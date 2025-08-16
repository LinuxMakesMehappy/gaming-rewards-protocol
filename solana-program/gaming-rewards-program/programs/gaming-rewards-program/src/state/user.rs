use anchor_lang::prelude::*;

/// User profile for the Gaming Rewards Protocol
#[account]
#[derive(Default)]
pub struct UserProfile {
    /// Authority of this user profile
    pub authority: Pubkey,
    /// Steam ID for achievement verification
    pub steam_id: String,
    /// Total rewards earned
    pub total_rewards: u64,
    /// Current staked amount
    pub staked_amount: u64,
    /// Last achievement verification timestamp
    pub last_achievement_verification: i64,
    /// Security level (1-5, 5 being highest)
    pub security_level: u8,
    /// Number of achievements verified
    pub achievements_verified: u32,
    /// User's reputation score
    pub reputation_score: u32,
    /// Account creation timestamp
    pub created_at: i64,
    /// Last activity timestamp
    pub last_activity: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl UserProfile {
    pub const LEN: usize = 32 + 32 + 64 + 8 + 8 + 8 + 1 + 4 + 4 + 8 + 8 + 1;
    
    /// Initialize a new user profile
    pub fn initialize(
        &mut self,
        authority: Pubkey,
        steam_id: String,
        bump: u8,
    ) -> Result<()> {
        self.authority = authority;
        self.steam_id = steam_id;
        self.total_rewards = 0;
        self.staked_amount = 0;
        self.last_achievement_verification = 0;
        self.security_level = 1;
        self.achievements_verified = 0;
        self.reputation_score = 100; // Starting reputation
        self.created_at = Clock::get()?.unix_timestamp;
        self.last_activity = Clock::get()?.unix_timestamp;
        self.bump = bump;
        Ok(())
    }
    
    /// Update user activity
    pub fn update_activity(&mut self) -> Result<()> {
        self.last_activity = Clock::get()?.unix_timestamp;
        Ok(())
    }
    
    /// Add rewards to user
    pub fn add_rewards(&mut self, amount: u64) -> Result<()> {
        self.total_rewards = self.total_rewards.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update_activity()?;
        Ok(())
    }
    
    /// Stake rewards
    pub fn stake_rewards(&mut self, amount: u64) -> Result<()> {
        require!(
            amount <= self.total_rewards,
            ErrorCode::InsufficientRewards
        );
        self.total_rewards = self.total_rewards.checked_sub(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.staked_amount = self.staked_amount.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update_activity()?;
        Ok(())
    }
    
    /// Unstake rewards
    pub fn unstake_rewards(&mut self, amount: u64) -> Result<()> {
        require!(
            amount <= self.staked_amount,
            ErrorCode::InsufficientStakedAmount
        );
        self.staked_amount = self.staked_amount.checked_sub(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.total_rewards = self.total_rewards.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update_activity()?;
        Ok(())
    }
    
    /// Verify achievement and update stats
    pub fn verify_achievement(&mut self, reward_amount: u64) -> Result<()> {
        self.achievements_verified = self.achievements_verified.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.last_achievement_verification = Clock::get()?.unix_timestamp;
        self.add_rewards(reward_amount)?;
        
        // Increase reputation for verified achievements
        self.reputation_score = self.reputation_score.checked_add(10)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Increase security level based on achievements
        if self.achievements_verified % 10 == 0 && self.security_level < 5 {
            self.security_level = self.security_level.checked_add(1)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
        }
        
        Ok(())
    }
}

/// Achievement verification record
#[account]
#[derive(Default)]
pub struct AchievementVerification {
    /// User who achieved this
    pub user: Pubkey,
    /// Steam achievement ID
    pub achievement_id: String,
    /// Game ID
    pub game_id: String,
    /// Achievement name
    pub achievement_name: String,
    /// Reward amount for this achievement
    pub reward_amount: u64,
    /// Verification timestamp
    pub verified_at: i64,
    /// Verification authority (oracle)
    pub verified_by: Pubkey,
    /// Achievement rarity (1-5, 5 being legendary)
    pub rarity: u8,
    /// Achievement difficulty (1-100)
    pub difficulty: u8,
    /// Bump seed for PDA
    pub bump: u8,
}

impl AchievementVerification {
    pub const LEN: usize = 32 + 64 + 64 + 128 + 8 + 8 + 32 + 1 + 1 + 1;
    
    /// Initialize a new achievement verification
    pub fn initialize(
        &mut self,
        user: Pubkey,
        achievement_id: String,
        game_id: String,
        achievement_name: String,
        reward_amount: u64,
        verified_by: Pubkey,
        rarity: u8,
        difficulty: u8,
        bump: u8,
    ) -> Result<()> {
        self.user = user;
        self.achievement_id = achievement_id;
        self.game_id = game_id;
        self.achievement_name = achievement_name;
        self.reward_amount = reward_amount;
        self.verified_at = Clock::get()?.unix_timestamp;
        self.verified_by = verified_by;
        self.rarity = rarity;
        self.difficulty = difficulty;
        self.bump = bump;
        Ok(())
    }
}

/// Global protocol state
#[account]
#[derive(Default)]
pub struct ProtocolState {
    /// Protocol authority
    pub authority: Pubkey,
    /// Total rewards distributed
    pub total_rewards_distributed: u64,
    /// Total users registered
    pub total_users: u32,
    /// Total achievements verified
    pub total_achievements: u32,
    /// Protocol fee percentage (basis points)
    pub protocol_fee_bps: u16,
    /// Minimum stake amount
    pub min_stake_amount: u64,
    /// Maximum stake amount
    pub max_stake_amount: u64,
    /// Protocol creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub last_updated: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl ProtocolState {
    pub const LEN: usize = 32 + 8 + 4 + 4 + 2 + 8 + 8 + 8 + 8 + 1;
    
    /// Initialize protocol state
    pub fn initialize(
        &mut self,
        authority: Pubkey,
        protocol_fee_bps: u16,
        min_stake_amount: u64,
        max_stake_amount: u64,
        bump: u8,
    ) -> Result<()> {
        self.authority = authority;
        self.total_rewards_distributed = 0;
        self.total_users = 0;
        self.total_achievements = 0;
        self.protocol_fee_bps = protocol_fee_bps;
        self.min_stake_amount = min_stake_amount;
        self.max_stake_amount = max_stake_amount;
        self.created_at = Clock::get()?.unix_timestamp;
        self.last_updated = Clock::get()?.unix_timestamp;
        self.bump = bump;
        Ok(())
    }
    
    /// Update protocol state
    pub fn update(&mut self) -> Result<()> {
        self.last_updated = Clock::get()?.unix_timestamp;
        Ok(())
    }
    
    /// Add distributed rewards
    pub fn add_distributed_rewards(&mut self, amount: u64) -> Result<()> {
        self.total_rewards_distributed = self.total_rewards_distributed.checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update()?;
        Ok(())
    }
    
    /// Increment user count
    pub fn increment_users(&mut self) -> Result<()> {
        self.total_users = self.total_users.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update()?;
        Ok(())
    }
    
    /// Increment achievement count
    pub fn increment_achievements(&mut self) -> Result<()> {
        self.total_achievements = self.total_achievements.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        self.update()?;
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,
    #[msg("Insufficient rewards balance")]
    InsufficientRewards,
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
    #[msg("Invalid achievement data")]
    InvalidAchievementData,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid security level")]
    InvalidSecurityLevel,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Invalid protocol fee")]
    InvalidProtocolFee,
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    #[msg("Invalid Steam ID")]
    InvalidSteamId,
    #[msg("Invalid reward amount")]
    InvalidRewardAmount,
    #[msg("Invalid rarity level")]
    InvalidRarity,
    #[msg("Invalid difficulty level")]
    InvalidDifficulty,
    #[msg("Below minimum stake amount")]
    BelowMinimumStake,
    #[msg("Above maximum stake amount")]
    AboveMaximumStake,
}
