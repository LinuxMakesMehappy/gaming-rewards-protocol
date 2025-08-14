use anchor_lang::prelude::*;
use crate::account_structs::*;
use crate::errors::*;
use crate::events::*;
use crate::constants::*;

/// Harvest stake rewards and rebalance treasury (50% to user pool, 50% to treasury)
pub fn handler(ctx: Context<HarvestAndRebalance>, yield_amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let treasury = &mut ctx.accounts.treasury;
    
    // Validate yield amount
    require!(yield_amount > 0, GamingRewardsError::InvalidYieldAmount);
    require!(yield_amount <= MAX_HARVEST_AMOUNT, GamingRewardsError::InvalidYieldAmount);
    
    // Check rate limit (1 hour)
    require!(treasury.can_harvest(clock.unix_timestamp)?, GamingRewardsError::HarvestTooFrequent);
    
    // Calculate 50/50 split
    let user_share = yield_amount.checked_div(2)
        .ok_or(GamingRewardsError::InvalidYieldAmount)?;
    let treasury_share = yield_amount.checked_sub(user_share)
        .ok_or(GamingRewardsError::InvalidYieldAmount)?;
    
    // Add user share to rewards pool
    treasury.add_to_rewards_pool(user_share);
    
    // Note: Jupiter swap for treasury share would be implemented here
    // For now, we'll track the amount to be swapped
    msg!("Treasury share to be swapped: {} lamports", treasury_share);
    
    // Update harvest timestamp
    treasury.update_harvest(clock.unix_timestamp);
    
    // Emit harvest event
    emit!(HarvestRebalanceEvent {
        amount_harvested: yield_amount,
        amount_swapped: treasury_share,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Harvested {} lamports", yield_amount);
    msg!("User share: {} lamports", user_share);
    msg!("Treasury share: {} lamports", treasury_share);
    msg!("Total rewards pool: {} lamports", treasury.user_rewards_pool);
    
    Ok(())
} 