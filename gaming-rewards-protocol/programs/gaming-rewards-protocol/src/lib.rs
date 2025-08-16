use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};

declare_id!("9NDb1c8ANjRXaD45HZi16khQH2cLPngdiCos1gR6gsDc");

#[program]
pub mod gaming_rewards_protocol {
    use super::*;

    /// Initialize the Gaming Rewards Protocol
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.authority = ctx.accounts.authority.key();
        protocol_state.reward_mint = ctx.accounts.reward_mint.key();
        protocol_state.total_users = 0;
        protocol_state.total_achievements_claimed = 0;
        protocol_state.total_rewards_distributed = 0;
        protocol_state.bump = *ctx.bumps.get("protocol_state").unwrap();
        
        msg!("🎮 Gaming Rewards Protocol initialized!");
        msg!("Authority: {}", protocol_state.authority);
        msg!("Reward Mint: {}", protocol_state.reward_mint);
        
        Ok(())
    }

    /// Register a new user in the protocol
    pub fn register_user(
        ctx: Context<RegisterUser>,
        steam_id: String,
        username: String,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let protocol_state = &mut ctx.accounts.protocol_state;
        
        // Validate Steam ID (17 digits)
        require!(steam_id.len() == 17, GamingRewardsError::InvalidSteamId);
        require!(steam_id.chars().all(|c| c.is_numeric()), GamingRewardsError::InvalidSteamId);
        
        // Validate username
        require!(username.len() >= 3 && username.len() <= 32, GamingRewardsError::InvalidUsername);
        
        user_profile.user = ctx.accounts.user.key();
        user_profile.steam_id = steam_id;
        user_profile.username = username;
        user_profile.total_achievements = 0;
        user_profile.total_rewards = 0;
        user_profile.staked_amount = 0;
        user_profile.is_active = true;
        user_profile.created_at = Clock::get()?.unix_timestamp;
        user_profile.bump = *ctx.bumps.get("user_profile").unwrap();
        
        protocol_state.total_users += 1;
        
        msg!("👤 User registered: {}", username);
        msg!("Steam ID: {}", user_profile.steam_id);
        
        Ok(())
    }

    /// Claim an achievement and receive rewards
    pub fn claim_achievement(
        ctx: Context<ClaimAchievement>,
        achievement_id: String,
        achievement_name: String,
        game_name: String,
        rarity: AchievementRarity,
    ) -> Result<()> {
        let achievement = &mut ctx.accounts.achievement;
        let user_profile = &mut ctx.accounts.user_profile;
        let protocol_state = &mut ctx.accounts.protocol_state;
        
        // Check if achievement already claimed
        require!(!achievement.is_claimed, GamingRewardsError::AchievementAlreadyClaimed);
        
        // Calculate reward based on rarity
        let reward_amount = match rarity {
            AchievementRarity::Common => 100,
            AchievementRarity::Rare => 250,
            AchievementRarity::Epic => 500,
            AchievementRarity::Legendary => 1000,
        };
        
        // Update achievement
        achievement.achievement_id = achievement_id;
        achievement.achievement_name = achievement_name;
        achievement.game_name = game_name;
        achievement.rarity = rarity;
        achievement.reward_amount = reward_amount;
        achievement.is_claimed = true;
        achievement.claimed_at = Clock::get()?.unix_timestamp;
        achievement.bump = *ctx.bumps.get("achievement").unwrap();
        
        // Update user profile
        user_profile.total_achievements += 1;
        user_profile.total_rewards += reward_amount;
        
        // Update protocol state
        protocol_state.total_achievements_claimed += 1;
        protocol_state.total_rewards_distributed += reward_amount;
        
        // Transfer tokens to user
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.protocol_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.protocol_state.to_account_info(),
            },
        );
        
        anchor_spl::token::transfer(transfer_ctx, reward_amount)?;
        
        msg!("🏆 Achievement claimed: {}", achievement.achievement_name);
        msg!("Game: {}", achievement.game_name);
        msg!("Rarity: {:?}", achievement.rarity);
        msg!("Reward: {} tokens", reward_amount);
        
        Ok(())
    }

    /// Stake rewards to earn additional rewards
    pub fn stake_rewards(ctx: Context<StakeRewards>, amount: u64) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let staking_account = &mut ctx.accounts.staking_account;
        
        require!(amount > 0, GamingRewardsError::InvalidStakeAmount);
        require!(user_profile.total_rewards >= amount, GamingRewardsError::InsufficientRewards);
        
        // Update user profile
        user_profile.total_rewards -= amount;
        user_profile.staked_amount += amount;
        
        // Update staking account
        staking_account.user = ctx.accounts.user.key();
        staking_account.staked_amount = amount;
        staking_account.staked_at = Clock::get()?.unix_timestamp;
        staking_account.is_active = true;
        staking_account.bump = *ctx.bumps.get("staking_account").unwrap();
        
        // Transfer tokens to staking account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.staking_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        
        anchor_spl::token::transfer(transfer_ctx, amount)?;
        
        msg!("💰 Rewards staked: {} tokens", amount);
        msg!("Total staked: {} tokens", user_profile.staked_amount);
        
        Ok(())
    }

    /// Unstake rewards
    pub fn unstake_rewards(ctx: Context<UnstakeRewards>, amount: u64) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let staking_account = &mut ctx.accounts.staking_account;
        
        require!(amount > 0, GamingRewardsError::InvalidStakeAmount);
        require!(staking_account.staked_amount >= amount, GamingRewardsError::InsufficientStakedAmount);
        
        // Calculate staking rewards (simple 5% APY)
        let staking_duration = Clock::get()?.unix_timestamp - staking_account.staked_at;
        let days_staked = staking_duration / 86400; // 86400 seconds per day
        let staking_reward = (amount * 5 * days_staked as u64) / (100 * 365); // 5% APY
        
        let total_amount = amount + staking_reward;
        
        // Update user profile
        user_profile.total_rewards += total_amount;
        user_profile.staked_amount -= amount;
        
        // Update staking account
        staking_account.staked_amount -= amount;
        if staking_account.staked_amount == 0 {
            staking_account.is_active = false;
        }
        
        // Transfer tokens back to user
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_account.to_account_info(),
            },
        );
        
        anchor_spl::token::transfer(transfer_ctx, total_amount)?;
        
        msg!("💰 Rewards unstaked: {} tokens", amount);
        msg!("Staking reward: {} tokens", staking_reward);
        msg!("Total returned: {} tokens", total_amount);
        
        Ok(())
    }

    /// Update user profile
    pub fn update_profile(ctx: Context<UpdateProfile>, new_username: String) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        require!(new_username.len() >= 3 && new_username.len() <= 32, GamingRewardsError::InvalidUsername);
        
        user_profile.username = new_username;
        user_profile.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("👤 Profile updated: {}", user_profile.username);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::INIT_SPACE,
        seeds = [b"protocol_state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub reward_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAchievement<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Achievement::INIT_SPACE,
        seeds = [b"achievement", user.key().as_ref(), achievement_id.as_bytes()],
        bump
    )]
    pub achievement: Account<'info, Achievement>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = protocol_state
    )]
    pub protocol_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub reward_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct StakeRewards<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + StakingAccount::INIT_SPACE,
        seeds = [b"staking", user.key().as_ref()],
        bump
    )]
    pub staking_account: Account<'info, StakingAccount>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = staking_account
    )]
    pub staking_token_account: Account<'info, TokenAccount>,
    
    pub reward_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct UnstakeRewards<'info> {
    #[account(
        mut,
        seeds = [b"staking", user.key().as_ref()],
        bump = staking_account.bump
    )]
    pub staking_account: Account<'info, StakingAccount>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = staking_account
    )]
    pub staking_token_account: Account<'info, TokenAccount>,
    
    pub reward_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub total_users: u64,
    pub total_achievements_claimed: u64,
    pub total_rewards_distributed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub user: Pubkey,
    pub steam_id: String,
    pub username: String,
    pub total_achievements: u64,
    pub total_rewards: u64,
    pub staked_amount: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Achievement {
    pub achievement_id: String,
    pub achievement_name: String,
    pub game_name: String,
    pub rarity: AchievementRarity,
    pub reward_amount: u64,
    pub is_claimed: bool,
    pub claimed_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StakingAccount {
    pub user: Pubkey,
    pub staked_amount: u64,
    pub staked_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum AchievementRarity {
    Common,
    Rare,
    Epic,
    Legendary,
}

#[error_code]
pub enum GamingRewardsError {
    #[msg("Invalid Steam ID - must be 17 digits")]
    InvalidSteamId,
    #[msg("Invalid username - must be 3-32 characters")]
    InvalidUsername,
    #[msg("Achievement already claimed")]
    AchievementAlreadyClaimed,
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    #[msg("Insufficient rewards")]
    InsufficientRewards,
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
}
