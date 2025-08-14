use anchor_lang::prelude::*;

/// Protocol constants and security parameters
/// These should be updated for mainnet deployment
pub const OWNER_PUBKEY: Pubkey = pubkey!("11111111111111111111111111111111");
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const ORACLE_PUBKEY: Pubkey = pubkey!("22222222222222222222222222222222");

/// Protocol constants
pub const MIN_HARVEST_INTERVAL: i64 = 3600; // 1 hour
pub const MIN_CLAIM_INTERVAL: i64 = 86400; // 24 hours
pub const MIN_ORACLE_STAKE: u64 = 10_000_000_000; // 10 SOL
pub const MAX_VERIFICATION_AGE: i64 = 300; // 5 minutes

/// Network-specific configurations
#[cfg(feature = "devnet")]
pub const USDC_MINT_DEVNET: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

#[cfg(feature = "mainnet")]
pub const USDC_MINT_MAINNET: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); 