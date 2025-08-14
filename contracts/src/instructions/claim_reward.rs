use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, transfer, Transfer};
use crate::accounts::*;
use crate::errors::*;
use crate::events::*;
use crate::constants::*;

/// Claim rewards with oracle verification
pub fn handler(
    ctx: Context<ClaimReward>,
    user: Pubkey,
    timestamp: i64,
    oracle_signature: Vec<u8>,
    claim_amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    let treasury = &mut ctx.accounts.treasury;
    let user_reward = &mut ctx.accounts.user_reward;
    let oracle_account = &ctx.accounts.oracle_account;
    
    // Validate claim amount
    require!(claim_amount > 0, GamingRewardsError::InvalidYieldAmount);
    require!(claim_amount <= treasury.user_rewards_pool, GamingRewardsError::InsufficientRewardsPool);
    
    // Check rate limit (24 hours)
    user_reward.validate_claim(clock.unix_timestamp)?;
    
    // Verify oracle stake
    oracle_account.validate_stake(MIN_ORACLE_STAKE)?;
    
    // Verify timestamp is recent (within 5 minutes)
    let time_diff = clock.unix_timestamp.checked_sub(timestamp).unwrap_or(0);
    require!(time_diff <= MAX_VERIFICATION_AGE, GamingRewardsError::StaleVerification);
    
    // Verify oracle signature
    let message = format!("{}:{}:{}", user, timestamp, claim_amount);
    let message_bytes = message.as_bytes();
    
    // Verify Ed25519 signature
    let oracle_pubkey = ORACLE_PUBKEY;
    let signature_valid = oracle_pubkey.verify(message_bytes, &oracle_signature).is_ok();
    require!(signature_valid, GamingRewardsError::InvalidOracleSignature);
    
    // Transfer USDC to user
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: treasury.to_account_info(),
        },
    );
    
    transfer(transfer_ctx, claim_amount)?;
    
    // Update state
    treasury.subtract_from_rewards_pool(claim_amount)?;
    user_reward.update_claim(claim_amount, clock.unix_timestamp);
    
    // Emit claim event
    emit!(ClaimRewardEvent {
        user,
        amount: claim_amount,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Reward claimed: {} USDC lamports", claim_amount);
    msg!("User: {}", user);
    
    Ok(())
} 