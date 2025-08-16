use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::token::{transfer, Transfer};
use crate::state::user::{UserProfile, ProtocolState, ErrorCode};

/// Stake rewards in the Gaming Rewards Protocol
#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct StakeRewards<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    /// User staking rewards
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// Protocol state
    #[account(
        seeds = [b"protocol_state"],
        bump = protocol_state.bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// User's reward token account
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_reward_account: Account<'info, TokenAccount>,
    
    /// User's staking token account
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_staking_account: Account<'info, TokenAccount>,
    
    /// Reward token mint
    pub reward_mint: Account<'info, Mint>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Associated token program
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

impl<'info> StakeRewards<'info> {
    pub fn stake(&mut self, amount: u64) -> Result<()> {
        // Validate amount
        require!(amount > 0, ErrorCode::InvalidStakeAmount);
        require!(
            amount >= self.protocol_state.min_stake_amount,
            ErrorCode::BelowMinimumStake
        );
        require!(
            amount <= self.protocol_state.max_stake_amount,
            ErrorCode::AboveMaximumStake
        );
        
        // Check user has sufficient rewards
        require!(
            amount <= self.user_profile.total_rewards,
            ErrorCode::InsufficientRewards
        );
        
        // Transfer tokens from reward account to staking account
        let transfer_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_reward_account.to_account_info(),
                to: self.user_staking_account.to_account_info(),
                authority: self.user.to_account_info(),
            },
        );
        
        transfer(transfer_ctx, amount)?;
        
        // Update user profile
        self.user_profile.stake_rewards(amount)?;
        
        msg!("Rewards staked successfully");
        msg!("User: {}", self.user.key());
        msg!("Amount: {}", amount);
        msg!("Total Staked: {}", self.user_profile.staked_amount);
        msg!("Remaining Rewards: {}", self.user_profile.total_rewards);
        
        Ok(())
    }
}

/// Unstake rewards from the Gaming Rewards Protocol
#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct UnstakeRewards<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    /// User unstaking rewards
    pub user: Signer<'info>,
    
    /// Protocol state
    #[account(
        seeds = [b"protocol_state"],
        bump = protocol_state.bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// User's reward token account
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_reward_account: Account<'info, TokenAccount>,
    
    /// User's staking token account
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_staking_account: Account<'info, TokenAccount>,
    
    /// Reward token mint
    pub reward_mint: Account<'info, Mint>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

impl<'info> UnstakeRewards<'info> {
    pub fn unstake(&mut self, amount: u64) -> Result<()> {
        // Validate amount
        require!(amount > 0, ErrorCode::InvalidStakeAmount);
        
        // Check user has sufficient staked amount
        require!(
            amount <= self.user_profile.staked_amount,
            ErrorCode::InsufficientStakedAmount
        );
        
        // Transfer tokens from staking account back to reward account
        let transfer_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_staking_account.to_account_info(),
                to: self.user_reward_account.to_account_info(),
                authority: self.user.to_account_info(),
            },
        );
        
        transfer(transfer_ctx, amount)?;
        
        // Update user profile
        self.user_profile.unstake_rewards(amount)?;
        
        msg!("Rewards unstaked successfully");
        msg!("User: {}", self.user.key());
        msg!("Amount: {}", amount);
        msg!("Remaining Staked: {}", self.user_profile.staked_amount);
        msg!("Total Rewards: {}", self.user_profile.total_rewards);
        
        Ok(())
    }
}
