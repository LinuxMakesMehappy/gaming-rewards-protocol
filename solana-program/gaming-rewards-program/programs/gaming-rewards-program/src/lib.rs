use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod constants;

use instructions::*;

declare_id!("GkdgN6BBTURDsXeojvvz13VN5T43zaKRrf7XMJHjPNze");

/// Gaming Rewards Protocol - Zero-CVE Solana Program
/// 
/// This program provides a secure, decentralized platform for gaming achievement rewards
/// with military-grade security standards and zero-CVE architecture.
#[program]
pub mod gaming_rewards_program {
    use super::*;

    /// Initialize the Gaming Rewards Protocol
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
        min_stake_amount: u64,
        max_stake_amount: u64,
    ) -> Result<()> {
        ctx.accounts.initialize(
            protocol_fee_bps,
            min_stake_amount,
            max_stake_amount,
        )
    }

    /// Register a new user in the Gaming Rewards Protocol
    pub fn register_user(
        ctx: Context<RegisterUser>,
        steam_id: String,
    ) -> Result<()> {
        ctx.accounts.register(steam_id)
    }

    /// Verify an achievement and distribute rewards
    pub fn verify_achievement(
        ctx: Context<VerifyAchievement>,
        achievement_id: String,
        game_id: String,
        achievement_name: String,
        reward_amount: u64,
        rarity: u8,
        difficulty: u8,
    ) -> Result<()> {
        ctx.accounts.verify(
            achievement_id,
            game_id,
            achievement_name,
            reward_amount,
            rarity,
            difficulty,
        )
    }

    /// Stake rewards in the Gaming Rewards Protocol
    pub fn stake_rewards(
        ctx: Context<StakeRewards>,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.stake(amount)
    }

    /// Unstake rewards from the Gaming Rewards Protocol
    pub fn unstake_rewards(
        ctx: Context<UnstakeRewards>,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.unstake(amount)
    }
}
