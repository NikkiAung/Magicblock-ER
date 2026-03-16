use borsh::BorshDeserialize;
use solana_program::program_error::ProgramError;

#[derive(BorshDeserialize)]
struct TapPayload {
    increase_by: u64,
}

pub enum TapChainInstruction {
    Initialize,                             // [0, 0, 0, 0, 0, 0, 0, 0]
    Tap { increase_by: u64 },              // [1, 0, 0, 0, 0, 0, 0, 0]
    Delegate,                               // [2, 0, 0, 0, 0, 0, 0, 0]
    CommitAndUndelegate,                    // [3, 0, 0, 0, 0, 0, 0, 0]
    Commit,                                 // [4, 0, 0, 0, 0, 0, 0, 0]
    Undelegate { pda_seeds: Vec<Vec<u8>> }, // [196, 28, 41, 206, 48, 37, 51, 167]
}

impl TapChainInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        if input.len() < 8 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let (discriminator, rest) = input.split_at(8);

        Ok(match discriminator {
            [0, 0, 0, 0, 0, 0, 0, 0] => Self::Initialize,
            [1, 0, 0, 0, 0, 0, 0, 0] => {
                let payload = TapPayload::try_from_slice(rest)
                    .map_err(|_| ProgramError::InvalidInstructionData)?;
                Self::Tap { increase_by: payload.increase_by }
            }
            [2, 0, 0, 0, 0, 0, 0, 0] => Self::Delegate,
            [3, 0, 0, 0, 0, 0, 0, 0] => Self::CommitAndUndelegate,
            [4, 0, 0, 0, 0, 0, 0, 0] => Self::Commit,
            [196, 28, 41, 206, 48, 37, 51, 167] => {
                let pda_seeds = Vec::<Vec<u8>>::try_from_slice(rest)
                    .map_err(|_| ProgramError::InvalidInstructionData)?;
                Self::Undelegate { pda_seeds }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}
