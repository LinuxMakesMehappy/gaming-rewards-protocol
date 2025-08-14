use anchor_lang::prelude::*;
use crate::accounts::*;
use crate::errors::*;
use crate::events::*;

/// Slash oracle stake (owner only)
pub fn handler(ctx: Context<SlashOracle>, slash_amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let oracle_account = &mut ctx.accounts.oracle_account;
    
    // Validate slash amount
    require!(slash_amount > 0, GamingRewardsError::InvalidSlashAmount);
    require!(slash_amount <= oracle_account.stake, GamingRewardsError::InvalidSlashAmount);
    
    // Slash oracle stake
    oracle_account.slash_stake(slash_amount)?;
    
    // Emit slash event
    emit!(SlashOracleEvent {
        oracle: oracle_account.key(),
        amount: slash_amount,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Oracle slashed: {} lamports", slash_amount);
    msg!("Remaining stake: {} lamports", oracle_account.stake);
    
    Ok(())
} 