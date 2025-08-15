use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub reward_token_mint: Pubkey,
    pub max_reward_per_achievement: u64,
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub staking_lock_period: u64,
    pub protocol_fee_bps: u16,
    pub is_paused: bool,
    pub security_level: SecurityLevel,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum SecurityLevel {
    Low = 0,
    Medium = 1,
    High = 2,
    Maximum = 3,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct UserRegistrationData {
    pub steam_id: String,
    pub email_hash: [u8; 32],
    pub phone_hash: [u8; 32],
    pub ip_address: [u8; 16],
    pub registration_timestamp: i64,
    pub security_verification: SecurityVerification,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SecurityVerification {
    pub mfa_verified: bool,
    pub steam_verified: bool,
    pub wallet_verified: bool,
    pub fraud_score: u8,
    pub verification_timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct AchievementData {
    pub achievement_id: String,
    pub steam_id: String,
    pub game_id: String,
    pub achievement_name: String,
    pub achievement_value: u64,
    pub timestamp: i64,
    pub verification_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct StakingPosition {
    pub user: Pubkey,
    pub amount: u64,
    pub lock_period: u64,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub rewards_earned: u64,
    pub is_active: bool,
    pub stake_id: u64,
}

#[account]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub reward_token_mint: Pubkey,
    pub total_users: u64,
    pub total_rewards_distributed: u64,
    pub total_staked: u64,
    pub protocol_fee_collected: u64,
    pub is_paused: bool,
    pub security_level: SecurityLevel,
    pub last_update: i64,
    pub bump: u8,
}

impl ProtocolState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 1;
}

#[account]
pub struct TreasuryState {
    pub authority: Pubkey,
    pub reward_token_account: Pubkey,
    pub fee_collector: Pubkey,
    pub total_fees_collected: u64,
    pub total_rewards_paid: u64,
    pub emergency_fund: u64,
    pub last_update: i64,
    pub bump: u8,
}

impl TreasuryState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct UserState {
    pub user: Pubkey,
    pub steam_id: String,
    pub total_rewards_earned: u64,
    pub total_rewards_claimed: u64,
    pub total_staked: u64,
    pub active_stakes: u64,
    pub security_level: SecurityLevel,
    pub registration_timestamp: i64,
    pub last_activity: i64,
    pub is_blacklisted: bool,
    pub fraud_score: u8,
    pub bump: u8,
}

impl UserState {
    pub const LEN: usize = 8 + 32 + 4 + 17 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct StakingPositionAccount {
    pub position: StakingPosition,
    pub bump: u8,
}

impl StakingPositionAccount {
    pub const LEN: usize = 8 + std::mem::size_of::<StakingPosition>() + 1;
}

impl StakingPosition {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct RewardCalculation {
    pub base_amount: u64,
    pub bonus_multiplier: u16,
    pub security_bonus: u16,
    pub staking_bonus: u16,
    pub final_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SecurityMetrics {
    pub total_verifications: u64,
    pub successful_verifications: u64,
    pub failed_verifications: u64,
    pub fraud_detections: u64,
    pub average_fraud_score: u8,
    pub last_security_audit: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct JupiterSwapData {
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
    pub input_amount: u64,
    pub expected_output: u64,
    pub price_impact: u16,
    pub fee_amount: u64,
    pub swap_timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SteamValidationData {
    pub steam_id: String,
    pub steam_verified: bool,
    pub achievement_count: u32,
    pub account_age_days: u32,
    pub standing: SteamStanding,
    pub last_validation: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum SteamStanding {
    Cleared = 0,
    Suspicious = 1,
    Blacklisted = 2,
    Ineligible = 3,
}
