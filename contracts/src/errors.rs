use anchor_lang::prelude::*;

#[error_code]
pub enum GamingRewardsError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid yield amount")]
    InvalidYieldAmount,
    
    #[msg("Insufficient rewards pool")]
    InsufficientRewardsPool,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Harvest too frequent")]
    HarvestTooFrequent,
    
    #[msg("Insufficient oracle stake")]
    InsufficientOracleStake,
    
    #[msg("Invalid slash amount")]
    InvalidSlashAmount,
    
    #[msg("Invalid oracle signature")]
    InvalidOracleSignature,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Stale verification")]
    StaleVerification,
} 