use anchor_lang::prelude::*;
use crate::errors::GamingRewardsError;
use crate::constants::ORACLE_PUBKEY;
use crate::security::verification::{UserVerificationProfile, OracleVerificationAccount};

// =============================================================================
// TREASURY ACCOUNT
// =============================================================================

#[account]
pub struct Treasury {
    /// Treasury authority (owner)
    pub authority: Pubkey,
    
    /// Total treasury balance (in lamports)
    pub total_balance: u64,
    
    /// User rewards pool (50% of harvested yields)
    pub user_rewards_pool: u64,
    
    /// Treasury reserve (50% of harvested yields)
    pub treasury_reserve: u64,
    
    /// Total rewards distributed to users
    pub total_distributed: u64,
    
    /// Last harvest timestamp
    pub last_harvest_timestamp: i64,
    
    /// Emergency withdrawal cooldown end
    pub emergency_withdrawal_cooldown: i64,
    
    /// Treasury fee collected
    pub treasury_fees: u64,
    
    /// Number of active stakers
    pub active_stakers: u32,
    
    /// Total staked amount
    pub total_staked: u64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl Treasury {
    /// Add yield to treasury and distribute according to percentages
    pub fn add_yield(&mut self, yield_amount: u64) -> Result<()> {
        require!(yield_amount > 0, GamingRewardsError::InvalidYieldAmount);
        
        // Calculate distribution (50% to users, 50% to treasury)
        let user_share = yield_amount * 50 / 100;
        let treasury_share = yield_amount - user_share;
        
        self.user_rewards_pool = self.user_rewards_pool.checked_add(user_share)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        self.treasury_reserve = self.treasury_reserve.checked_add(treasury_share)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        self.total_balance = self.total_balance.checked_add(yield_amount)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        
        Ok(())
    }
    
    /// Subtract from rewards pool (for user claims)
    pub fn subtract_from_rewards_pool(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, GamingRewardsError::InvalidYieldAmount);
        require!(self.user_rewards_pool >= amount, GamingRewardsError::InsufficientRewardsPool);
        
        self.user_rewards_pool = self.user_rewards_pool.checked_sub(amount)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        self.total_distributed = self.total_distributed.checked_add(amount)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        
        Ok(())
    }
    
    /// Add treasury fee
    pub fn add_fee(&mut self, fee_amount: u64) -> Result<()> {
        self.treasury_fees = self.treasury_fees.checked_add(fee_amount)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        Ok(())
    }
}

// =============================================================================
// USER REWARD ACCOUNT
// =============================================================================

#[account]
pub struct UserReward {
    /// User's public key
    pub user: Pubkey,
    
    /// Total rewards claimed by user
    pub total_claimed: u64,
    
    /// Last claim timestamp
    pub last_claim_timestamp: i64,
    
    /// Number of claims in current window
    pub claims_in_window: u32,
    
    /// Window start timestamp
    pub window_start_timestamp: i64,
    
    /// User's staking status
    pub is_staking: bool,
    
    /// Staking start timestamp
    pub staking_start_timestamp: i64,
    
    /// Staked amount
    pub staked_amount: u64,
    
    /// User's reputation score
    pub reputation_score: u32,
    
    /// Number of achievements verified
    pub achievements_verified: u32,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl UserReward {
    /// Validate claim rate limit
    pub fn validate_claim(&mut self, current_timestamp: i64) -> Result<()> {
        // Check if we need to reset the window
        if current_timestamp - self.window_start_timestamp >= CLAIM_RATE_LIMIT_WINDOW {
            self.claims_in_window = 0;
            self.window_start_timestamp = current_timestamp;
        }
        
        // Check rate limit
        require!(
            self.claims_in_window < MAX_CLAIMS_PER_WINDOW,
            GamingRewardsError::RateLimitExceeded
        );
        
        // Check minimum time between claims
        require!(
            current_timestamp - self.last_claim_timestamp >= MIN_TIME_BETWEEN_CLAIMS,
            GamingRewardsError::ClaimTooFrequent
        );
        
        Ok(())
    }
    
    /// Update claim data
    pub fn update_claim(&mut self, amount: u64, timestamp: i64) {
        self.total_claimed = self.total_claimed.checked_add(amount).unwrap_or(self.total_claimed);
        self.last_claim_timestamp = timestamp;
        self.claims_in_window = self.claims_in_window.checked_add(1).unwrap_or(self.claims_in_window);
    }
    
    /// Start staking
    pub fn start_staking(&mut self, amount: u64, timestamp: i64) -> Result<()> {
        require!(!self.is_staking, GamingRewardsError::AlreadyStaking);
        require!(amount > 0, GamingRewardsError::InvalidStakeAmount);
        
        self.is_staking = true;
        self.staking_start_timestamp = timestamp;
        self.staked_amount = amount;
        
        Ok(())
    }
    
    /// Calculate staking bonus
    pub fn calculate_staking_bonus(&self, current_timestamp: i64) -> u64 {
        if !self.is_staking {
            return 100; // No bonus
        }
        
        let staking_duration = current_timestamp - self.staking_start_timestamp;
        
        if staking_duration >= MAX_STAKING_PERIOD {
            LONG_TERM_STAKER_BONUS
        } else if staking_duration >= MIN_STAKING_PERIOD {
            120 // 20% bonus for medium-term stakers
        } else {
            100 // No bonus for short-term stakers
        }
    }
}

// =============================================================================
// ORACLE ACCOUNT
// =============================================================================

#[account]
pub struct OracleAccount {
    /// Oracle's public key
    pub oracle: Pubkey,
    
    /// Oracle's stake amount
    pub stake_amount: u64,
    
    /// Oracle's reputation score
    pub reputation_score: u32,
    
    /// Number of successful verifications
    pub successful_verifications: u32,
    
    /// Number of failed verifications
    pub failed_verifications: u32,
    
    /// Last verification timestamp
    pub last_verification_timestamp: i64,
    
    /// Oracle's status (active/inactive/slashed)
    pub status: OracleStatus,
    
    /// Slashing history
    pub slash_count: u32,
    
    /// Last slash timestamp
    pub last_slash_timestamp: i64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OracleStatus {
    Active,
    Inactive,
    Slashed,
    Suspended,
}

impl OracleAccount {
    /// Validate oracle stake
    pub fn validate_stake(&self, min_stake: u64) -> Result<()> {
        require!(self.stake_amount >= min_stake, GamingRewardsError::InsufficientOracleStake);
        require!(self.status == OracleStatus::Active, GamingRewardsError::OracleNotActive);
        Ok(())
    }
    
    /// Update reputation score
    pub fn update_reputation(&mut self, success: bool) {
        if success {
            self.successful_verifications = self.successful_verifications.checked_add(1)
                .unwrap_or(self.successful_verifications);
            self.reputation_score = self.reputation_score.checked_add(1)
                .unwrap_or(self.reputation_score);
        } else {
            self.failed_verifications = self.failed_verifications.checked_add(1)
                .unwrap_or(self.failed_verifications);
            self.reputation_score = self.reputation_score.saturating_sub(1);
        }
        
        // Update status based on reputation
        if self.reputation_score < 50 {
            self.status = OracleStatus::Suspended;
        } else if self.reputation_score >= ORACLE_REPUTATION_THRESHOLD {
            self.status = OracleStatus::Active;
        }
    }
    
    /// Slash oracle
    pub fn slash(&mut self, slash_amount: u64) -> Result<u64> {
        require!(self.stake_amount >= slash_amount, GamingRewardsError::InsufficientStakeToSlash);
        
        self.stake_amount = self.stake_amount.checked_sub(slash_amount)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        self.slash_count = self.slash_count.checked_add(1)
            .ok_or(GamingRewardsError::ArithmeticOverflow)?;
        
        if self.stake_amount < MIN_ORACLE_STAKE {
            self.status = OracleStatus::Slashed;
        }
        
        Ok(slash_amount)
    }
}

// =============================================================================
// ACHIEVEMENT VERIFICATION ACCOUNT
// =============================================================================

#[account]
pub struct AchievementVerification {
    /// User's public key
    pub user: Pubkey,
    
    /// Achievement ID
    pub achievement_id: String,
    
    /// Achievement value/points
    pub achievement_value: u64,
    
    /// Verification timestamp
    pub verification_timestamp: i64,
    
    /// Oracle that verified this achievement
    pub verifying_oracle: Pubkey,
    
    /// Oracle signature
    pub oracle_signature: Vec<u8>,
    
    /// Verification status
    pub status: VerificationStatus,
    
    /// Reward amount for this achievement
    pub reward_amount: u64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VerificationStatus {
    Pending,
    Verified,
    Rejected,
    Expired,
}

impl AchievementVerification {
    /// Validate achievement value
    pub fn validate_achievement_value(&self) -> Result<()> {
        require!(
            self.achievement_value >= MIN_ACHIEVEMENT_VALUE,
            GamingRewardsError::InvalidAchievementValue
        );
        require!(
            self.achievement_value <= MAX_ACHIEVEMENT_VALUE,
            GamingRewardsError::InvalidAchievementValue
        );
        Ok(())
    }
    
    /// Check if verification is still valid
    pub fn is_valid(&self, current_timestamp: i64) -> bool {
        self.status == VerificationStatus::Verified &&
        current_timestamp - self.verification_timestamp <= ACHIEVEMENT_VERIFICATION_WINDOW
    }
    
    /// Calculate reward amount based on achievement value
    pub fn calculate_reward(&self, user_bonus: u64) -> u64 {
        let base_reward = self.achievement_value * 100; // 100 lamports per point
        base_reward * user_bonus / 100
    }
}

// =============================================================================
// CONTEXT STRUCTURES
// =============================================================================

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HarvestAndRebalance<'info> {
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump,
        has_one = authority
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(
        mut,
        seeds = [b"user_reward", user.key().as_ref()],
        bump = user_reward.bump
    )]
    pub user_reward: Account<'info, UserReward>,
    
    #[account(
        mut,
        seeds = [b"oracle", oracle_account.oracle.as_ref()],
        bump = oracle_account.bump
    )]
    pub oracle_account: Account<'info, OracleAccount>,
    
    /// CHECK: User claiming the reward
    pub user: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SlashOracle<'info> {
    #[account(
        mut,
        seeds = [b"oracle", oracle_account.oracle.as_ref()],
        bump = oracle_account.bump
    )]
    pub oracle_account: Account<'info, OracleAccount>,
    
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump,
        has_one = authority
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// =============================================================================
// EVENTS
// =============================================================================

#[event]
pub struct ClaimRewardEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct HarvestEvent {
    pub yield_amount: u64,
    pub user_share: u64,
    pub treasury_share: u64,
    pub timestamp: i64,
}

#[event]
pub struct OracleSlashEvent {
    pub oracle: Pubkey,
    pub slash_amount: u64,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct AchievementVerifiedEvent {
    pub user: Pubkey,
    pub achievement_id: String,
    pub achievement_value: u64,
    pub reward_amount: u64,
    pub oracle: Pubkey,
    pub timestamp: i64,
}