use anchor_lang::prelude::*;

#[error_code]
pub enum GamingRewardsError {
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    
    #[msg("Invalid Steam ID format")]
    InvalidSteamId,
    
    #[msg("User is blacklisted")]
    UserBlacklisted,
    
    #[msg("Insufficient rewards balance")]
    InsufficientRewards,
    
    #[msg("Invalid achievement data")]
    InvalidAchievement,
    
    #[msg("Achievement already processed")]
    AchievementAlreadyProcessed,
    
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[msg("Stake lock period not expired")]
    StakeLockNotExpired,
    
    #[msg("Invalid security verification")]
    InvalidSecurityVerification,
    
    #[msg("Fraud detection triggered")]
    FraudDetected,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid protocol configuration")]
    InvalidConfig,
    
    #[msg("Treasury insufficient funds")]
    TreasuryInsufficientFunds,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Jupiter swap failed")]
    JupiterSwapFailed,
    
    #[msg("Steam validation failed")]
    SteamValidationFailed,
}
