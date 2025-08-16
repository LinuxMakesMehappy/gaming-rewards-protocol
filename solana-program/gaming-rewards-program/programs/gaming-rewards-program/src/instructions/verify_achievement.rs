use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::token::{transfer, Transfer};
use crate::state::user::{UserProfile, AchievementVerification, ProtocolState, ErrorCode};

/// Verify an achievement and distribute rewards
#[derive(Accounts)]
#[instruction(
    achievement_id: String,
    game_id: String,
    achievement_name: String,
    reward_amount: u64,
    rarity: u8,
    difficulty: u8
)]
pub struct VerifyAchievement<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    /// User who achieved this
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = oracle,
        space = AchievementVerification::LEN,
        seeds = [
            b"achievement_verification",
            user.key().as_ref(),
            achievement_id.as_bytes(),
        ],
        bump
    )]
    pub achievement_verification: Account<'info, AchievementVerification>,
    
    /// Oracle/Authority verifying the achievement
    #[account(mut)]
    pub oracle: Signer<'info>,
    
    /// Protocol state
    #[account(
        mut,
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
    
    /// Protocol's reward token account
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = protocol_state,
    )]
    pub protocol_reward_account: Account<'info, TokenAccount>,
    
    /// Reward token mint
    pub reward_mint: Account<'info, Mint>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Associated token program
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

impl<'info> VerifyAchievement<'info> {
    pub fn verify(
        &mut self,
        achievement_id: String,
        game_id: String,
        achievement_name: String,
        reward_amount: u64,
        rarity: u8,
        difficulty: u8,
    ) -> Result<()> {
        // Validate inputs
        require!(!achievement_id.is_empty(), ErrorCode::InvalidAchievementData);
        require!(!game_id.is_empty(), ErrorCode::InvalidAchievementData);
        require!(!achievement_name.is_empty(), ErrorCode::InvalidAchievementData);
        require!(reward_amount > 0, ErrorCode::InvalidRewardAmount);
        require!(rarity >= 1 && rarity <= 5, ErrorCode::InvalidRarity);
        require!(difficulty >= 1 && difficulty <= 100, ErrorCode::InvalidDifficulty);
        
        // Rate limiting: Check if user has verified too many achievements recently
        let current_time = Clock::get()?.unix_timestamp;
        let time_since_last_verification = current_time - self.user_profile.last_achievement_verification;
        require!(
            time_since_last_verification >= 60, // Minimum 1 minute between verifications
            ErrorCode::RateLimitExceeded
        );
        
        // Get bump before calling initialize
        let bump = self.achievement_verification.bump;
        
        // Initialize achievement verification record
        self.achievement_verification.initialize(
            self.user.key(),
            achievement_id.clone(),
            game_id.clone(),
            achievement_name.clone(),
            reward_amount,
            self.oracle.key(),
            rarity,
            difficulty,
            bump,
        )?;
        
        // Update user profile with achievement verification
        self.user_profile.verify_achievement(reward_amount)?;
        
        // Transfer rewards from protocol to user
        let transfer_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.protocol_reward_account.to_account_info(),
                to: self.user_reward_account.to_account_info(),
                authority: self.protocol_state.to_account_info(),
            },
        );
        
        transfer(transfer_ctx, reward_amount)?;
        
        // Update protocol state
        self.protocol_state.add_distributed_rewards(reward_amount)?;
        self.protocol_state.increment_achievements()?;
        
        msg!("Achievement verified successfully");
        msg!("User: {}", self.user.key());
        msg!("Achievement: {}", achievement_name);
        msg!("Game: {}", game_id);
        msg!("Reward: {}", reward_amount);
        msg!("Rarity: {}", rarity);
        msg!("Difficulty: {}", difficulty);
        msg!("Oracle: {}", self.oracle.key());
        
        Ok(())
    }
}
