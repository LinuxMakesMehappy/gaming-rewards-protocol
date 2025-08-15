use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn handler(
    ctx: Context<RegisterUser>,
    steam_id: String,
    user_data: UserRegistrationData,
) -> Result<()> {
    let user_state = &mut ctx.accounts.user_state;
    
    // Validate Steam ID format
    require!(
        steam_id.len() == 17 && steam_id.chars().all(|c| c.is_ascii_digit()),
        GamingRewardsError::InvalidSteamId
    );
    
    // Validate user registration data
    require!(
        user_data.steam_id == steam_id,
        GamingRewardsError::InvalidConfig
    );
    
    // Check if user is blacklisted
    require!(
        !user_data.security_verification.fraud_score >= 100,
        GamingRewardsError::UserBlacklisted
    );
    
    // Initialize user state
    user_state.user = ctx.accounts.user.key();
    user_state.steam_id = steam_id;
    user_state.total_rewards_earned = 0;
    user_state.total_rewards_claimed = 0;
    user_state.total_staked = 0;
    user_state.active_stakes = 0;
    user_state.security_level = SecurityLevel::Medium; // Default level
    user_state.registration_timestamp = Clock::get()?.unix_timestamp;
    user_state.last_activity = Clock::get()?.unix_timestamp;
    user_state.is_blacklisted = false;
    user_state.fraud_score = user_data.security_verification.fraud_score;
    
    msg!("User registered successfully: {}", steam_id);
    
    Ok(())
}
