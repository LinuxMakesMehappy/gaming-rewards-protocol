use anchor_lang::prelude::*;

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

/// Maximum verification age for oracle signatures (5 minutes)
pub const MAX_VERIFICATION_AGE: i64 = 300;

/// Maximum claim amount per transaction (10,000 USDC lamports)
pub const MAX_CLAIM_AMOUNT: u64 = 10_000_000_000;

/// Maximum yield harvest amount per transaction (1,000,000 USDC lamports)
pub const MAX_HARVEST_AMOUNT: u64 = 1_000_000_000_000;

/// Minimum oracle stake required (1 SOL)
pub const MIN_ORACLE_STAKE: u64 = 1_000_000_000;

/// Maximum claim rate limit window (1 hour)
pub const CLAIM_RATE_LIMIT_WINDOW: i64 = 3600;

/// Maximum claims per rate limit window
pub const MAX_CLAIMS_PER_WINDOW: u32 = 10;

// =============================================================================
// MEMECOIN STAKING CONSTANTS
// =============================================================================

/// Percentage of rewards distributed to verified users (50%)
pub const USER_REWARDS_PERCENTAGE: u8 = 50;

/// Percentage of rewards kept in treasury (50%)
pub const TREASURY_PERCENTAGE: u8 = 50;

/// Minimum staking period for memecoin rewards (24 hours)
pub const MIN_STAKING_PERIOD: i64 = 86400;

/// Maximum staking period for bonus rewards (30 days)
pub const MAX_STAKING_PERIOD: i64 = 2592000;

/// Bonus multiplier for long-term stakers (1.5x)
pub const LONG_TERM_STAKER_BONUS: u64 = 150;

/// Base staking reward rate (10% APY)
pub const BASE_STAKING_RATE: u64 = 10;

// =============================================================================
// ORACLE SECURITY CONSTANTS
// =============================================================================

/// Oracle signature verification timeout (30 seconds)
pub const ORACLE_SIGNATURE_TIMEOUT: i64 = 30;

/// Maximum oracle stake (100 SOL)
pub const MAX_ORACLE_STAKE: u64 = 100_000_000_000;

/// Oracle slashing penalty (50% of stake)
pub const ORACLE_SLASH_PENALTY: u8 = 50;

/// Oracle reputation threshold for trusted status
pub const ORACLE_REPUTATION_THRESHOLD: u32 = 100;

// =============================================================================
// GAMING ACHIEVEMENT CONSTANTS
// =============================================================================

/// Minimum achievement value for rewards (100 points)
pub const MIN_ACHIEVEMENT_VALUE: u64 = 100;

/// Maximum achievement value for rewards (10,000 points)
pub const MAX_ACHIEVEMENT_VALUE: u64 = 10_000;

/// Achievement verification window (1 hour)
pub const ACHIEVEMENT_VERIFICATION_WINDOW: i64 = 3600;

/// Steam API rate limit (requests per minute)
pub const STEAM_API_RATE_LIMIT: u32 = 60;

// =============================================================================
// TREASURY MANAGEMENT CONSTANTS
// =============================================================================

/// Treasury rebalancing threshold (1,000 USDC)
pub const REBALANCE_THRESHOLD: u64 = 1_000_000_000;

/// Emergency withdrawal cooldown (24 hours)
pub const EMERGENCY_WITHDRAWAL_COOLDOWN: i64 = 86400;

/// Treasury fee for operations (0.1%)
pub const TREASURY_FEE_PERCENTAGE: u8 = 1;

// =============================================================================
// NETWORK CONSTANTS
// =============================================================================

/// Solana cluster configuration
pub const SOLANA_CLUSTER: &str = "devnet";

/// RPC endpoint timeout (30 seconds)
pub const RPC_TIMEOUT: u64 = 30;

/// Transaction confirmation timeout (60 seconds)
pub const TX_CONFIRMATION_TIMEOUT: u64 = 60;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/// Maximum string length for user identifiers
pub const MAX_USER_ID_LENGTH: usize = 64;

/// Maximum string length for achievement descriptions
pub const MAX_ACHIEVEMENT_DESCRIPTION_LENGTH: usize = 256;

/// Maximum number of achievements per claim
pub const MAX_ACHIEVEMENTS_PER_CLAIM: u32 = 10;

/// Minimum time between claims (5 minutes)
pub const MIN_TIME_BETWEEN_CLAIMS: i64 = 300; 