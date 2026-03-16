use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TapScore {
    pub score: u64,
}

impl TapScore {
    pub const SIZE: usize = 8; // u64 = 8 bytes
}
