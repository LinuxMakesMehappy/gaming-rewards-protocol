use anchor_lang::prelude::*;

/// Protocol constants and security parameters
/// ⚠️  CRITICAL: Update these addresses before deployment!
/// 
/// For development/testing, these can be placeholder values
/// For mainnet deployment, these MUST be real addresses
pub const OWNER_PUBKEY: Pubkey = pubkey!("11111111111111111111111111111111");
pub const ORACLE_PUBKEY: Pubkey = pubkey!("11111111111111111111111111111112");
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/// Time intervals (in seconds)
pub const HARVEST_INTERVAL: i64 = 3600; // 1 hour
pub const CLAIM_INTERVAL: i64 = 86400; // 24 hours
pub const MAX_VERIFICATION_AGE: i64 = 300; // 5 minutes

/// Oracle stake requirements
pub const MIN_ORACLE_STAKE: u64 = 10_000_000_000; // 10 SOL

/// Security limits
pub const MAX_CLAIM_AMOUNT: u64 = 1_000_000_000; // 1000 USDC
pub const MAX_HARVEST_AMOUNT: u64 = 100_000_000_000; // 100 SOL
pub const STAKE_MULTIPLIER: u64 = 150; // 150% stake requirement

/// Validation functions
pub fn validate_owner(owner: &Pubkey) -> bool {
    owner != &Pubkey::default() && owner != &OWNER_PUBKEY
}

pub fn validate_oracle(oracle: &Pubkey) -> bool {
    oracle != &Pubkey::default() && oracle != &ORACLE_PUBKEY
}

pub fn validate_amount(amount: u64, max_amount: u64) -> bool {
    amount > 0 && amount <= max_amount
} 