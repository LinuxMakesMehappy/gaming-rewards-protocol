use anchor_lang::prelude::*;
use crate::errors::GamingRewardsError;
use crate::constants::ORACLE_PUBKEY;
use crate::security::verification::{UserVerificationProfile, OracleVerificationAccount};

/// Treasury account that holds protocol funds and manages yield farming
#[account]
#[derive(Default)]
pub struct TreasuryAccount {
    /// Owner of the treasury
    pub owner: Pubkey,
    
    /// Last harvest timestamp
    pub last_harvest: i64,
    
    /// User rewards pool in USDC lamports
    pub user_rewards_pool: u64,
    
    /// Stake account for SOL staking
    pub stake_account: Pubkey,
}

impl TreasuryAccount {
    /// Validate treasury initialization
    pub fn validate_init(&self) -> Result<()> {
        require!(self.owner != Pubkey::default(), GamingRewardsError::Unauthorized);
        require!(self.last_harvest > 0, GamingRewardsError::InvalidYieldAmount);
        Ok(())
    }
    
    /// Check if enough time has passed since last harvest (1 hour rate limit)
    pub fn can_harvest(&self, current_timestamp: i64) -> Result<bool> {
        let time_since_harvest = current_timestamp.checked_sub(self.last_harvest)
            .ok_or(GamingRewardsError::InvalidYieldAmount)?;
        let min_harvest_interval = 3600; // 1 hour minimum
        Ok(time_since_harvest >= min_harvest_interval)
    }
    
    /// Update harvest timestamp
    pub fn update_harvest(&mut self, current_timestamp: i64) {
        self.last_harvest = current_timestamp;
    }
    
    /// Add to user rewards pool
    pub fn add_to_rewards_pool(&mut self, amount: u64) {
        self.user_rewards_pool = self.user_rewards_pool.checked_add(amount)
            .expect("Rewards pool overflow");
    }
    
    /// Subtract from user rewards pool
    pub fn subtract_from_rewards_pool(&mut self, amount: u64) -> Result<()> {
        require!(self.user_rewards_pool >= amount, GamingRewardsError::InsufficientRewardsPool);
        self.user_rewards_pool = self.user_rewards_pool.checked_sub(amount)
            .expect("Rewards pool underflow");
        Ok(())
    }
}

/// User reward account for tracking claimable USDC
#[account]
#[derive(Default)]
pub struct UserRewardAccount {
    /// User's wallet address
    pub user: Pubkey,
    
    /// Last claim timestamp
    pub last_claim: i64,
    
    /// Total claimed amount
    pub total_claimed: u64,
}

impl UserRewardAccount {
    /// Validate claim parameters (24 hour rate limit)
    pub fn validate_claim(&self, current_timestamp: i64) -> Result<()> {
        let time_since_claim = current_timestamp.checked_sub(self.last_claim)
            .ok_or(GamingRewardsError::RateLimitExceeded)?;
        let min_claim_interval = 86400; // 24 hours
        require!(time_since_claim >= min_claim_interval, GamingRewardsError::RateLimitExceeded);
        Ok(())
    }
    
    /// Update claim state
    pub fn update_claim(&mut self, claim_amount: u64, current_timestamp: i64) {
        self.last_claim = current_timestamp;
        self.total_claimed = self.total_claimed.checked_add(claim_amount)
            .expect("Total claimed overflow");
    }
    
    /// Initialize user reward account
    pub fn initialize(&mut self, user: Pubkey, current_timestamp: i64) {
        self.user = user;
        self.last_claim = current_timestamp;
        self.total_claimed = 0;
    }
}

/// Oracle account for stake-based verification
#[account]
#[derive(Default)]
pub struct OracleAccount {
    /// Oracle stake amount in lamports
    pub stake: u64,
}

impl OracleAccount {
    /// Validate oracle stake
    pub fn validate_stake(&self, min_stake: u64) -> Result<()> {
        require!(self.stake >= min_stake, GamingRewardsError::InsufficientOracleStake);
        Ok(())
    }
    
    /// Slash oracle stake
    pub fn slash_stake(&mut self, slash_amount: u64) -> Result<()> {
        require!(self.stake >= slash_amount, GamingRewardsError::InvalidSlashAmount);
        self.stake = self.stake.checked_sub(slash_amount)
            .expect("Stake underflow");
        Ok(())
    }
}

/// Context for treasury initialization
#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 8 + 32, // discriminator + owner + last_harvest + user_rewards_pool + stake_account
        seeds = [b"treasury", payer.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Context for harvest and rebalance
#[derive(Accounts)]
pub struct HarvestAndRebalance<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.owner.as_ref()],
        bump,
        has_one = owner @ GamingRewardsError::Unauthorized
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Context for claiming rewards
#[derive(Accounts)]
#[instruction(user: Pubkey, timestamp: i64)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.owner.as_ref()],
        bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 8, // discriminator + user + last_claim + total_claimed
        seeds = [b"user_reward", user.key().as_ref()],
        bump,
        has_one = user @ GamingRewardsError::Unauthorized
    )]
    pub user_reward: Account<'info, UserRewardAccount>,
    
    #[account(
        mut,
        constraint = oracle_account.key() == ORACLE_PUBKEY @ GamingRewardsError::Unauthorized
    )]
    pub oracle_account: Account<'info, OracleAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Context for slashing oracles
#[derive(Accounts)]
pub struct SlashOracle<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.owner.as_ref()],
        bump,
        has_one = owner @ GamingRewardsError::Unauthorized
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    
    #[account(mut)]
    pub oracle_account: Account<'info, OracleAccount>,
    
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Context for Steam session verification
#[derive(Accounts)]
pub struct VerifySteamSession<'info> {
    #[account(
        mut,
        seeds = [b"user_verification", user_profile.user.as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserVerificationProfile>,
    
    #[account(
        mut,
        constraint = oracle_account.key() == ORACLE_PUBKEY @ GamingRewardsError::Unauthorized
    )]
    pub oracle_account: Account<'info, OracleVerificationAccount>,
    
    pub system_program: Program<'info, System>,
}

/// Context for OAuth wallet verification
#[derive(Accounts)]
pub struct VerifyOAuthWallet<'info> {
    #[account(
        mut,
        seeds = [b"user_verification", user_profile.user.as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserVerificationProfile>,
    
    #[account(
        mut,
        constraint = oracle_account.key() == ORACLE_PUBKEY @ GamingRewardsError::Unauthorized
    )]
    pub oracle_account: Account<'info, OracleVerificationAccount>,
    
    pub system_program: Program<'info, System>,
}

/// Context for multi-factor verification
#[derive(Accounts)]
pub struct VerifyMultiFactor<'info> {
    #[account(
        mut,
        seeds = [b"user_verification", user_profile.user.as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserVerificationProfile>,
    
    #[account(
        mut,
        constraint = oracle_account.key() == ORACLE_PUBKEY @ GamingRewardsError::Unauthorized
    )]
    pub oracle_account: Account<'info, OracleVerificationAccount>,
    
    pub system_program: Program<'info, System>,
}