use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn handler(
    ctx: Context<InitializeProtocol>,
    protocol_config: ProtocolConfig,
) -> Result<()> {
    let protocol_state = &mut ctx.accounts.protocol_state;
    let treasury_state = &mut ctx.accounts.treasury_state;
    
    // Validate protocol configuration
    require!(
        protocol_config.max_reward_per_achievement > 0,
        GamingRewardsError::InvalidConfig
    );
    
    require!(
        protocol_config.min_stake_amount <= protocol_config.max_stake_amount,
        GamingRewardsError::InvalidConfig
    );
    
    require!(
        protocol_config.protocol_fee_bps <= 10000, // Max 100%
        GamingRewardsError::InvalidConfig
    );
    
    // Initialize protocol state
    protocol_state.authority = protocol_config.authority;
    protocol_state.treasury = protocol_config.treasury;
    protocol_state.reward_token_mint = protocol_config.reward_token_mint;
    protocol_state.total_users = 0;
    protocol_state.total_rewards_distributed = 0;
    protocol_state.total_staked = 0;
    protocol_state.protocol_fee_collected = 0;
    protocol_state.is_paused = protocol_config.is_paused;
    protocol_state.security_level = protocol_config.security_level;
    protocol_state.last_update = Clock::get()?.unix_timestamp;
    
    // Initialize treasury state
    treasury_state.authority = protocol_config.authority;
    treasury_state.reward_token_account = protocol_config.treasury;
    treasury_state.fee_collector = protocol_config.authority;
    treasury_state.total_fees_collected = 0;
    treasury_state.total_rewards_paid = 0;
    treasury_state.emergency_fund = 0;
    treasury_state.last_update = Clock::get()?.unix_timestamp;
    
    msg!("Protocol initialized successfully with security level: {:?}", protocol_config.security_level);
    
    Ok(())
}
