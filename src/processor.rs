use borsh::{BorshDeserialize, BorshSerialize};
use ephemeral_rollups_sdk::cpi::{delegate_account, undelegate_account, DelegateAccounts, DelegateConfig};
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::instruction::TapChainInstruction;
use crate::state::TapScore;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = TapChainInstruction::unpack(instruction_data)?;

    match instruction {
        TapChainInstruction::Initialize => process_initialize(program_id, accounts),
        TapChainInstruction::Tap { increase_by } => process_tap(program_id, accounts, increase_by),
        TapChainInstruction::Delegate => process_delegate(program_id, accounts),
        TapChainInstruction::CommitAndUndelegate => process_commit_and_undelegate(program_id, accounts),
        TapChainInstruction::Commit => process_commit(program_id, accounts),
        TapChainInstruction::Undelegate { pda_seeds } => process_undelegate(program_id, accounts, pda_seeds),
    }
}

// ─── Base layer: Initialize ───────────────────────────────────────────────────
// Creates the TapScore PDA account for the player.
// This only ever runs on Solana — once, before any session begins.

fn process_initialize(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player = next_account_info(accounts_iter)?;
    let tap_score_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Derive the expected PDA and verify the account passed matches
    let (tap_score_pda, bump) =
        Pubkey::find_program_address(&[b"tapscore", player.key.as_ref()], program_id);

    if tap_score_pda != *tap_score_account.key {
        msg!("Invalid PDA: expected {}", tap_score_pda);
        return Err(ProgramError::InvalidArgument);
    }

    // Only create the account if it doesn't already exist (lamports = 0)
    if **tap_score_account.try_borrow_lamports()? == 0 {
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(TapScore::SIZE);

        invoke_signed(
            &system_instruction::create_account(
                player.key,
                tap_score_account.key,
                lamports,
                TapScore::SIZE as u64,
                program_id,
            ),
            &[player.clone(), tap_score_account.clone(), system_program.clone()],
            &[&[b"tapscore", player.key.as_ref(), &[bump]]],
        )?;
    }

    // Set initial score to 0
    let tap_score = TapScore { score: 0 };
    tap_score.serialize(&mut &mut tap_score_account.data.borrow_mut()[..])?;

    msg!("TapScore initialized for player {}", player.key);
    Ok(())
}

// ─── Works on both Solana and ER ─────────────────────────────────────────────
// This is the recipe. It doesn't know or care which kitchen it's in.
// On Solana: slow (1s). On ER: fast (~10ms). Same code. Different runtime.

fn process_tap(program_id: &Pubkey, accounts: &[AccountInfo], increase_by: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player = next_account_info(accounts_iter)?;
    let tap_score_account = next_account_info(accounts_iter)?;

    // Verify the PDA belongs to this player
    let (tap_score_pda, _) =
        Pubkey::find_program_address(&[b"tapscore", player.key.as_ref()], program_id);

    if tap_score_pda != *tap_score_account.key {
        msg!("Invalid PDA for player {}", player.key);
        return Err(ProgramError::InvalidArgument);
    }

    let mut tap_score = TapScore::try_from_slice(&tap_score_account.data.borrow())?;
    tap_score.score += increase_by;
    tap_score.serialize(&mut &mut tap_score_account.data.borrow_mut()[..])?;

    msg!("Tapped! Score is now {}", tap_score.score);
    Ok(())
}

// ─── Base layer: Delegate ─────────────────────────────────────────────────────
// Hands the TapScore account to the delegation program.
// After this, Solana can no longer write to the account — the ER owns it.
// This is the "start session" instruction.

fn process_delegate(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;
    let tap_score_account = next_account_info(accounts_iter)?;
    let owner_program = next_account_info(accounts_iter)?;
    let delegation_buffer = next_account_info(accounts_iter)?;
    let delegation_record = next_account_info(accounts_iter)?;
    let delegation_metadata = next_account_info(accounts_iter)?;
    let delegation_program = next_account_info(accounts_iter)?;
    let validator_account = accounts_iter.next(); // optional — for local dev

    let pda_seeds: &[&[u8]] = &[b"tapscore", player.key.as_ref()];

    let delegate_accounts = DelegateAccounts {
        payer: player,
        pda: tap_score_account,
        owner_program,
        buffer: delegation_buffer,
        delegation_record,
        delegation_metadata,
        delegation_program,
        system_program,
    };

    // commit_frequency_ms: how often the ER auto-commits state back to Solana.
    // 35ms means the base layer is always close to current ER state.
    let config = DelegateConfig {
        validator: validator_account.map(|a| *a.key),
        commit_frequency_ms: 35,
        ..Default::default()
    };

    delegate_account(delegate_accounts, pda_seeds, config)?;

    msg!("TapScore delegated to ER. Session started.");
    Ok(())
}

// ─── ER only: Commit ──────────────────────────────────────────────────────────
// Snapshots current ER state back to Solana.
// Account stays delegated — session continues.
// Use this mid-session to checkpoint your score.

fn process_commit(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player = next_account_info(accounts_iter)?;
    let tap_score_account = next_account_info(accounts_iter)?;
    let magic_program = next_account_info(accounts_iter)?;
    let magic_context = next_account_info(accounts_iter)?;

    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    commit_accounts(player, vec![tap_score_account], magic_context, magic_program)?;

    msg!("Score committed to Solana. Session still active.");
    Ok(())
}

// ─── ER only: Commit and Undelegate ──────────────────────────────────────────
// Commits final score to Solana AND ends the session atomically.
// After this, the account is back on Solana. Tapping is slow again.
// This is the "end session" instruction.

fn process_commit_and_undelegate(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player = next_account_info(accounts_iter)?;
    let tap_score_account = next_account_info(accounts_iter)?;
    let magic_program = next_account_info(accounts_iter)?;
    let magic_context = next_account_info(accounts_iter)?;

    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    commit_and_undelegate_accounts(player, vec![tap_score_account], magic_context, magic_program)?;

    msg!("Score committed and session ended. Account returned to Solana.");
    Ok(())
}

// ─── Validator-called: Undelegate ────────────────────────────────────────────
// Called by the ER validator automatically after commit_and_undelegate.
// It recreates the account on Solana with the committed state and original owner.
// YOU never call this. The validator does — using the pda_seeds you passed.

fn process_undelegate(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    pda_seeds: Vec<Vec<u8>>,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let tap_score_account = next_account_info(accounts_iter)?;
    let delegation_buffer = next_account_info(accounts_iter)?;
    let player = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    undelegate_account(
        tap_score_account,
        program_id,
        delegation_buffer,
        player,
        system_program,
        pda_seeds,
    )?;

    msg!("Account undelegated by validator. Owner restored.");
    Ok(())
}
