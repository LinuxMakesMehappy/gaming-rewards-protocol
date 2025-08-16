use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::user::{ProtocolState, ErrorCode};

/// Initialize the Gaming Rewards Protocol
#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        space = ProtocolState::LEN,
        seeds = [b"protocol_state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// Protocol authority
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Token mint for rewards
    pub reward_mint: Account<'info, Mint>,
    
    /// Protocol's reward token account
    #[account(
        init,
        payer = authority,
        associated_token::mint = reward_mint,
        associated_token::authority = protocol_state,
    )]
    pub protocol_reward_account: Account<'info, TokenAccount>,
    
    /// Associated token program
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

impl<'info> InitializeProtocol<'info> {
    pub fn initialize(
        &mut self,
        protocol_fee_bps: u16,
        min_stake_amount: u64,
        max_stake_amount: u64,
    ) -> Result<()> {
        // Validate parameters
        require!(protocol_fee_bps <= 1000, ErrorCode::InvalidProtocolFee); // Max 10%
        require!(min_stake_amount > 0, ErrorCode::InvalidStakeAmount);
        require!(max_stake_amount > min_stake_amount, ErrorCode::InvalidStakeAmount);
        
        // Get bump before calling initialize
        let bump = self.protocol_state.bump;
        
        // Initialize protocol state
        self.protocol_state.initialize(
            self.authority.key(),
            protocol_fee_bps,
            min_stake_amount,
            max_stake_amount,
            bump,
        )?;
        
        msg!("Gaming Rewards Protocol initialized successfully");
        msg!("Authority: {}", self.authority.key());
        msg!("Protocol Fee: {} bps", protocol_fee_bps);
        msg!("Min Stake: {}", min_stake_amount);
        msg!("Max Stake: {}", max_stake_amount);
        
        Ok(())
    }
}
