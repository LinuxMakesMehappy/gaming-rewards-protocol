use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;
use state::*;

#[program]
pub mod gaming_rewards_protocol {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_config: ProtocolConfig,
    ) -> Result<()> {
        instructions::initialize_protocol::handler(ctx, protocol_config)
    }

    pub fn register_user(
        ctx: Context<RegisterUser>,
        steam_id: String,
        user_data: UserRegistrationData,
    ) -> Result<()> {
        instructions::register_user::handler(ctx, steam_id, user_data)
    }

    pub fn process_achievement(
        ctx: Context<ProcessAchievement>,
        achievement: AchievementData,
        reward_amount: u64,
    ) -> Result<()> {
        instructions::process_achievement::handler(ctx, achievement, reward_amount)
    }

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        amount: u64,
    ) -> Result<()> {
        instructions::claim_rewards::handler(ctx, amount)
    }

    pub fn stake_rewards(
        ctx: Context<StakeRewards>,
        amount: u64,
        lock_period: u64,
    ) -> Result<()> {
        instructions::stake_rewards::handler(ctx, amount, lock_period)
    }

    pub fn unstake_rewards(
        ctx: Context<UnstakeRewards>,
        stake_id: u64,
    ) -> Result<()> {
        instructions::unstake_rewards::handler(ctx, stake_id)
    }

    pub fn update_protocol_config(
        ctx: Context<UpdateProtocolConfig>,
        new_config: ProtocolConfig,
    ) -> Result<()> {
        instructions::update_protocol_config::handler(ctx, new_config)
    }

    pub fn emergency_pause(
        ctx: Context<EmergencyPause>,
    ) -> Result<()> {
        instructions::emergency_pause::handler(ctx)
    }

    pub fn emergency_resume(
        ctx: Context<EmergencyResume>,
    ) -> Result<()> {
        instructions::emergency_resume::handler(ctx)
    }
}

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
    
    #[account(
        init,
        payer = authority,
        space = TreasuryState::LEN,
        seeds = [b"treasury_state"],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserState::LEN,
        seeds = [b"user_state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessAchievement<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(
        mut,
        seeds = [b"treasury_state"],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        seeds = [b"treasury_state"],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StakeRewards<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        init,
        payer = user,
        space = StakingPosition::LEN,
        seeds = [b"staking_position", user.key().as_ref(), &stake_id.to_le_bytes()],
        bump
    )]
    pub staking_position: Account<'info, StakingPosition>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeRewards<'info> {
    #[account(
        mut,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        seeds = [b"staking_position", user.key().as_ref(), &stake_id.to_le_bytes()],
        bump,
        has_one = user
    )]
    pub staking_position: Account<'info, StakingPosition>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProtocolConfig<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump,
        has_one = authority
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump,
        has_one = authority
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyResume<'info> {
    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump,
        has_one = authority
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub authority: Signer<'info>,
}
