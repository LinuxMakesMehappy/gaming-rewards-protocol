use anchor_lang::prelude::*;

#[error_code]
pub enum GamingRewardsError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Invalid slash amount")]
    InvalidSlashAmount,
    
    #[msg("Stale verification")]
    StaleVerification,
    
    #[msg("Insufficient oracle stake")]
    InsufficientOracleStake,
    
    #[msg("Insufficient rewards pool")]
    InsufficientRewardsPool,
    
    #[msg("Invalid oracle signature")]
    InvalidOracleSignature,
    
    #[msg("Oracle verification failed")]
    OracleVerificationFailed,
    
    #[msg("Invalid stake account")]
    InvalidStakeAccount,
    
    #[msg("Harvest too frequent")]
    HarvestTooFrequent,
    
    #[msg("Invalid yield amount")]
    InvalidYieldAmount,
} 