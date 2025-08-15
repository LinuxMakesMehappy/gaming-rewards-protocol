use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

pub fn handler(
    ctx: Context<ProcessAchievement>,
    achievement: AchievementData,
    reward_amount: u64,
) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    let treasury_state = &mut ctx.accounts.treasury_state;
    let user_state = &mut ctx.accounts.user_state;
    
    // Check if protocol is paused
    require!(!protocol_state.is_paused, GamingRewardsError::ProtocolPaused);
    
    // Validate achievement data
    require!(
        achievement.steam_id == user_state.steam_id,
        GamingRewardsError::InvalidAchievement
    );
    
    // Validate reward amount
    require!(
        reward_amount > 0 && reward_amount <= protocol_state.max_reward_per_achievement,
        GamingRewardsError::InvalidConfig
    );
    
    // Check if user is blacklisted
    require!(!user_state.is_blacklisted, GamingRewardsError::UserBlacklisted);
    
    // Calculate protocol fee
    let protocol_fee = (reward_amount * protocol_state.protocol_fee_bps as u64) / 10000;
    let user_reward = reward_amount - protocol_fee;
    
    // Transfer rewards from treasury to user
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.treasury_state.to_account_info(),
        },
    );
    
    token::transfer(transfer_ctx, user_reward)?;
    
    // Update state
    user_state.total_rewards_earned += reward_amount;
    user_state.total_rewards_claimed += user_reward;
    user_state.last_activity = Clock::get()?.unix_timestamp;
    
    protocol_state.total_rewards_distributed += reward_amount;
    protocol_state.protocol_fee_collected += protocol_fee;
    protocol_state.last_update = Clock::get()?.unix_timestamp;
    
    treasury_state.total_rewards_paid += user_reward;
    treasury_state.total_fees_collected += protocol_fee;
    treasury_state.last_update = Clock::get()?.unix_timestamp;
    
    msg!("Achievement processed: {} rewards distributed", user_reward);
    
    Ok(())
}
