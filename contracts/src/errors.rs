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
    
    #[msg("Fraud detected")]
    FraudDetected,
    
    #[msg("Invalid Steam ID")]
    InvalidSteamId,
    
    #[msg("Invalid Steam ticket")]
    InvalidSteamTicket,
    
    #[msg("Invalid session ID")]
    InvalidSessionId,
    
    #[msg("Invalid wallet signature")]
    InvalidWalletSignature,
    
    #[msg("Invalid message")]
    InvalidMessage,
    
    #[msg("Invalid ZKP proof")]
    InvalidZKPProof,
    
    #[msg("Invalid ZKP inputs")]
    InvalidZKPInputs,
    
    #[msg("Invalid attestation ID")]
    InvalidAttestationId,
    
    #[msg("Invalid verification level")]
    InvalidVerificationLevel,
    
    #[msg("Invalid Ruby score")]
    InvalidRubyScore,
    
    #[msg("Steam session required")]
    SteamSessionRequired,
    
    #[msg("OAuth wallet required")]
    OAuthWalletRequired,
    
    #[msg("Insufficient verification")]
    InsufficientVerification,
    
    #[msg("Insufficient multi-factor")]
    InsufficientMultiFactor,
    
    #[msg("Inactive oracle")]
    InactiveOracle,
    
    #[msg("Overflow")]
    Overflow,
    
    #[msg("Underflow")]
    Underflow,
    
    #[msg("Invalid wallet")]
    InvalidWallet,
} 