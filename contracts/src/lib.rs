use anchor_lang::prelude::*;

pub mod accounts;
pub mod instructions;
pub mod errors;
pub mod events;
pub mod constants;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gaming_rewards {
    use super::*;

    /// Initialize the treasury with PDA
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::handler(ctx)
    }

    /// Harvest stake rewards and rebalance treasury (50% to user pool, 50% to treasury)
    pub fn harvest_and_rebalance(
        ctx: Context<HarvestAndRebalance>,
        yield_amount: u64,
    ) -> Result<()> {
        instructions::harvest_and_rebalance::handler(ctx, yield_amount)
    }

    /// Claim rewards with oracle verification
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        user: Pubkey,
        timestamp: i64,
        oracle_signature: Vec<u8>,
        claim_amount: u64,
    ) -> Result<()> {
        instructions::claim_reward::handler(ctx, user, timestamp, oracle_signature, claim_amount)
    }

    /// Slash oracle stake (owner only)
    pub fn slash_oracle(
        ctx: Context<SlashOracle>,
        slash_amount: u64,
    ) -> Result<()> {
        instructions::slash_oracle::handler(ctx, slash_amount)
    }
} 