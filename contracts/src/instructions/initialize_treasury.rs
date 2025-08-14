use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::errors::*;

/// Initialize the treasury with PDA
pub fn handler(ctx: Context<InitializeTreasury>) -> Result<()> {
    let clock = Clock::get()?;
    let treasury = &mut ctx.accounts.treasury;
    
    // Initialize treasury account
    treasury.owner = ctx.accounts.payer.key();
    treasury.last_harvest = clock.unix_timestamp;
    treasury.user_rewards_pool = 0;
    treasury.stake_account = Pubkey::default(); // Will be set later
    
    // Validate initialization
    treasury.validate_init()?;
    
    msg!("Treasury initialized successfully");
    msg!("Treasury: {}", treasury.key());
    msg!("Owner: {}", treasury.owner);
    
    Ok(())
} 