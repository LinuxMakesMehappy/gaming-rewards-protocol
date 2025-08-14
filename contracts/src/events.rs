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

/// Event emitted when Steam session is verified
#[event]
pub struct SteamSessionVerifiedEvent {
    pub user: Pubkey,
    pub steam_id: u64,
    pub timestamp: i64,
    pub oracle: Pubkey,
}

/// Event emitted when OAuth wallet is verified
#[event]
pub struct OAuthWalletVerifiedEvent {
    pub user: Pubkey,
    pub steam_id: u64,
    pub wallet: Pubkey,
    pub timestamp: i64,
    pub oracle: Pubkey,
}

/// Event emitted when multi-factor verification is completed
#[event]
pub struct MultiFactorVerifiedEvent {
    pub user: Pubkey,
    pub verification_level: u8,
    pub multi_factor_score: u64,
    pub ruby_score: u64,
    pub timestamp: i64,
    pub oracle: Pubkey,
}