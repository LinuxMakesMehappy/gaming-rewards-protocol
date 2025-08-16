use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::user::{UserProfile, ProtocolState, ErrorCode};

/// Register a new user in the Gaming Rewards Protocol
#[derive(Accounts)]
#[instruction(steam_id: String)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    /// User registering
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
        init,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_reward_account: Account<'info, TokenAccount>,
    
    /// Reward token mint
    pub reward_mint: Account<'info, Mint>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Associated token program
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

impl<'info> RegisterUser<'info> {
    pub fn register(&mut self, steam_id: String) -> Result<()> {
        // Validate Steam ID format (basic validation)
        require!(!steam_id.is_empty(), ErrorCode::InvalidSteamId);
        require!(steam_id.len() <= 32, ErrorCode::InvalidSteamId);
        
        // Get bump before calling initialize
        let bump = self.user_profile.bump;
        
        // Initialize user profile
        self.user_profile.initialize(
            self.user.key(),
            steam_id,
            bump,
        )?;
        
        // Increment total users in protocol
        self.protocol_state.increment_users()?;
        
        msg!("User registered successfully");
        msg!("User: {}", self.user.key());
        msg!("Steam ID: {}", self.user_profile.steam_id);
        msg!("Security Level: {}", self.user_profile.security_level);
        
        Ok(())
    }
}
