use anchor_lang::prelude::*;
use crate::account_structs::*;
use crate::errors::*;
use crate::events::*;
use crate::constants::*;

/// Claim USDC rewards from treasury
pub fn handler(
    ctx: Context<ClaimReward>,
    user: Pubkey,
    timestamp: i64,
    claim_amount: u64,
    oracle_signature: Vec<u8>,
) -> Result<()> {
    let clock = Clock::get()?;
    let treasury = &mut ctx.accounts.treasury;
    let user_reward = &mut ctx.accounts.user_reward;
    let oracle_account = &mut ctx.accounts.oracle_account;
    
    // Validate timestamp
    require!(timestamp <= clock.unix_timestamp, GamingRewardsError::InvalidTimestamp);
    require!(timestamp >= clock.unix_timestamp - MAX_VERIFICATION_AGE, GamingRewardsError::InvalidTimestamp);
    
    // Validate claim amount
    require!(claim_amount > 0, GamingRewardsError::InvalidYieldAmount);
    require!(claim_amount <= MAX_CLAIM_AMOUNT, GamingRewardsError::InvalidYieldAmount);
    require!(claim_amount <= treasury.user_rewards_pool, GamingRewardsError::InsufficientRewardsPool);
    
    // Validate oracle stake
    oracle_account.validate_stake(MIN_ORACLE_STAKE)?;
    
    // Verify oracle signature
    let message = format!("{}:{}:{}", user, timestamp, claim_amount);
    let message_bytes = message.as_bytes();
    
    // Note: In a real implementation, this would verify the Ed25519 signature
    // For now, we'll just check that the signature is not empty
    require!(!oracle_signature.is_empty(), GamingRewardsError::InvalidOracleSignature);
    
    // Validate claim rate limit
    user_reward.validate_claim(clock.unix_timestamp)?;
    
    // Update state before transfer to prevent reentrancy
    treasury.subtract_from_rewards_pool(claim_amount)?;
    user_reward.update_claim(claim_amount, clock.unix_timestamp);
    
    // Note: In a real implementation, this would transfer USDC tokens
    // For now, we'll just emit the event
    msg!("Reward approved: {} USDC lamports", claim_amount);
    msg!("User: {}", user);
    msg!("Note: Actual USDC transfer must be handled by treasury");
    
    // Emit claim event
    emit!(ClaimRewardEvent {
        user,
        amount: claim_amount,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
} 