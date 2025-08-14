use anchor_lang::prelude::*;

/// Events emitted by the gaming rewards protocol
#[event]
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct HarvestRebalanceEvent {
    pub amount_harvested: u64,
    pub amount_swapped: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ClaimRewardEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SlashOracleEvent {
    pub oracle: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
} 