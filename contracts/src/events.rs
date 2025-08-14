use anchor_lang::prelude::*;

/// Event emitted when harvest and rebalance occurs
#[event]
pub struct HarvestRebalanceEvent {
    pub amount_harvested: u64,
    pub amount_swapped: u64,
    pub timestamp: i64,
}

/// Event emitted when a user claims rewards
#[event]
pub struct ClaimRewardEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

/// Event emitted when an oracle is slashed
#[event]
pub struct SlashOracleEvent {
    pub oracle: Pubkey,
    pub slash_amount: u64,
    pub timestamp: i64,
} 