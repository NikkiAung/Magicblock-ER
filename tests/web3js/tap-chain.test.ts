import * as web3 from "@solana/web3.js";
import * as borsh from "borsh";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import {
  DELEGATION_PROGRAM_ID,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import * as fs from "fs";
import * as path from "path";
import {
  TapScore,
  TapScoreSchema,
  TapChainInstruction,
  buildTapInstruction,
} from "./schema";

// ─── Program ID ───────────────────────────────────────────────────────────────
// Loaded from the compiled keypair after `cargo build-sbf`
const PROGRAM_KEYPAIR_PATH = path.resolve(
  __dirname,
  "../../target/deploy/tap_chain-keypair.json"
);
const programKeypair = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(PROGRAM_KEYPAIR_PATH, "utf-8")))
);
const PROGRAM_ID = programKeypair.publicKey;

// ─── Connections ──────────────────────────────────────────────────────────────
// Two connections: one to Solana, one to the Ephemeral Rollup.
// This is the dual-connection pattern that makes ER work.
const connectionSolana = new web3.Connection(
  process.env.PROVIDER_ENDPOINT || "https://api.devnet.solana.com",
  { wsEndpoint: process.env.WS_ENDPOINT || "wss://api.devnet.solana.com" }
);

const connectionER = new web3.Connection(
  process.env.EPHEMERAL_PROVIDER_ENDPOINT || "https://devnet-as.magicblock.app/",
  { wsEndpoint: process.env.EPHEMERAL_WS_ENDPOINT || "wss://devnet-as.magicblock.app/" }
);

// ─── Player Keypair ───────────────────────────────────────────────────────────
let player: web3.Keypair;

// ─── PDA ──────────────────────────────────────────────────────────────────────
// ["tapscore", player_pubkey] — each player has their own TapScore account
let tapScorePda: web3.PublicKey;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function readScore(connection: web3.Connection): Promise<number> {
  const accountInfo = await connection.getAccountInfo(tapScorePda);
  if (!accountInfo) throw new Error("TapScore account not found");
  const decoded = borsh.deserialize(TapScoreSchema, TapScore, accountInfo.data);
  return decoded.score;
}

async function sendOnSolana(
  ix: web3.TransactionInstruction
): Promise<{ sig: string; ms: number }> {
  const tx = new web3.Transaction().add(ix);
  const start = Date.now();
  const sig = await web3.sendAndConfirmTransaction(connectionSolana, tx, [player]);
  return { sig, ms: Date.now() - start };
}

async function sendOnER(
  ix: web3.TransactionInstruction
): Promise<{ sig: string; ms: number }> {
  const tx = new web3.Transaction();
  tx.add(ix);
  tx.recentBlockhash = (await connectionER.getLatestBlockhash()).blockhash;
  tx.feePayer = player.publicKey;
  tx.sign(player);
  const start = Date.now();
  const sig = await connectionER.sendRawTransaction(tx.serialize(), {
    skipPreflight: true,
  });
  await connectionER.confirmTransaction(sig, "confirmed");
  return { sig, ms: Date.now() - start };
}

// ─── Setup ────────────────────────────────────────────────────────────────────
before(async () => {
  // Load or generate player keypair
  const envPath = path.resolve(__dirname, "../../.env");
  if (process.env.PRIVATE_KEY) {
    player = web3.Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY))
    );
  } else {
    player = web3.Keypair.generate();
    fs.writeFileSync(
      envPath,
      `PRIVATE_KEY=${JSON.stringify(Array.from(player.secretKey))}\n`
    );
  }

  // Airdrop on Solana if needed
  const balance = await connectionSolana.getBalance(player.publicKey);
  if (balance < web3.LAMPORTS_PER_SOL) {
    console.log("  Airdropping SOL on devnet...");
    const sig = await connectionSolana.requestAirdrop(
      player.publicKey,
      2 * web3.LAMPORTS_PER_SOL
    );
    await connectionSolana.confirmTransaction(sig, "confirmed");
  }

  // Airdrop on ER if needed (ER needs its own SOL for fees)
  const erBalance = await connectionER.getBalance(player.publicKey);
  if (erBalance < web3.LAMPORTS_PER_SOL) {
    console.log("  Airdropping SOL on ER...");
    const sig = await connectionER.requestAirdrop(
      player.publicKey,
      2 * web3.LAMPORTS_PER_SOL
    );
    await connectionER.confirmTransaction(sig, "confirmed");
  }

  // Derive TapScore PDA
  [tapScorePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("tapscore"), player.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log(`  Player:      ${player.publicKey.toBase58()}`);
  console.log(`  TapScore PDA: ${tapScorePda.toBase58()}`);
  console.log(`  Program ID:   ${PROGRAM_ID.toBase58()}`);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TapChain — MagicBlock ER Integration", () => {

  it("1. Initialize TapScore on Solana", async () => {
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
        { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(TapChainInstruction.Initialize, "hex"),
    });

    const { sig, ms } = await sendOnSolana(ix);
    const score = await readScore(connectionSolana);
    console.log(`  ✓ Score: ${score} | ${ms}ms | ${sig}`);
  });

  it("2. Tap on Solana (slow baseline)", async () => {
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
      ],
      data: buildTapInstruction(5),
    });

    const { sig, ms } = await sendOnSolana(ix);
    const score = await readScore(connectionSolana);
    console.log(`  ✓ Score: ${score} | ${ms}ms on Solana | ${sig}`);
  });

  it("3. Delegate TapScore to ER (start session)", async () => {
    // These PDAs are required by the delegation program to track delegation state.
    // The SDK provides helpers to derive them deterministically.
    const delegateBuffer = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
      tapScorePda,
      PROGRAM_ID
    );
    const delegationRecord = delegationRecordPdaFromDelegatedAccount(tapScorePda);
    const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(tapScorePda);

    // On localnet we pass the validator identity so the ER knows where to route.
    // On devnet, leave remaining accounts empty — the delegation program handles it.
    const isLocalnet = connectionSolana.rpcEndpoint.includes("localhost");
    const validatorAccounts = isLocalnet
      ? [
          {
            pubkey: new web3.PublicKey("mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev"),
            isSigner: false,
            isWritable: false,
          },
        ]
      : [];

    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
        { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: delegateBuffer, isSigner: false, isWritable: true },
        { pubkey: delegationRecord, isSigner: false, isWritable: true },
        { pubkey: delegationMetadata, isSigner: false, isWritable: true },
        { pubkey: new web3.PublicKey(DELEGATION_PROGRAM_ID), isSigner: false, isWritable: false },
        ...validatorAccounts,
      ],
      data: Buffer.from(TapChainInstruction.Delegate, "hex"),
    });

    const { sig, ms } = await sendOnSolana(ix);
    console.log(`  ✓ Delegated | ${ms}ms | ${sig}`);
    console.log(`  Waiting for ER to clone account...`);
    await new Promise((r) => setTimeout(r, 3000));
  });

  it("4. Tap on ER (fast — this is the point)", async () => {
    // Same instruction as test 2. Same program, same code.
    // The only difference: we send to connectionER instead of connectionSolana.
    // The ER holds write authority now — result is instant.
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
      ],
      data: buildTapInstruction(10),
    });

    const { sig, ms } = await sendOnER(ix);
    const erScore = await readScore(connectionER);
    console.log(`  ✓ ER Score: ${erScore} | ${ms}ms on ER (vs ~1000ms on Solana) | ${sig}`);
  });

  it("5. Commit score to Solana (checkpoint)", async () => {
    // Sends commit to ER → ER schedules a write to Solana.
    // Account stays delegated. Session continues.
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
        { pubkey: new web3.PublicKey(MAGIC_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: new web3.PublicKey(MAGIC_CONTEXT_ID), isSigner: false, isWritable: true },
      ],
      data: Buffer.from(TapChainInstruction.Commit, "hex"),
    });

    const { sig: erSig, ms } = await sendOnER(ix);
    // Wait for the ER → Solana commitment to land
    const solanaSig = await GetCommitmentSignature(erSig, connectionER);
    const solanaScore = await readScore(connectionSolana);
    console.log(`  ✓ Solana score after commit: ${solanaScore} | ER: ${ms}ms | Solana commit: ${solanaSig}`);
  });

  it("6. Tap more on ER", async () => {
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
      ],
      data: buildTapInstruction(20),
    });

    const { sig, ms } = await sendOnER(ix);
    const erScore = await readScore(connectionER);
    console.log(`  ✓ ER Score: ${erScore} | ${ms}ms | ${sig}`);
  });

  it("7. Commit and Undelegate (end session)", async () => {
    // Atomically: commits final score to Solana + ends delegation.
    // After this, the account is back on Solana. Tapping is slow again.
    const ix = new web3.TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: tapScorePda, isSigner: false, isWritable: true },
        { pubkey: new web3.PublicKey(MAGIC_PROGRAM_ID), isSigner: false, isWritable: false },
        { pubkey: new web3.PublicKey(MAGIC_CONTEXT_ID), isSigner: false, isWritable: true },
      ],
      data: Buffer.from(TapChainInstruction.CommitAndUndelegate, "hex"),
    });

    const { sig: erSig, ms } = await sendOnER(ix);
    const solanaSig = await GetCommitmentSignature(erSig, connectionER);
    const finalScore = await readScore(connectionSolana);
    console.log(`  ✓ Final score on Solana: ${finalScore} | ER: ${ms}ms | Solana: ${solanaSig}`);
    console.log(`  Session ended. Account returned to Solana.`);
  });
});
