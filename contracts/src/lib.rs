use anchor_lang::prelude::*;

pub mod account_structs;
pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod security;

use account_structs::*;
use constants::*;
use errors::*;
use events::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gaming_rewards_protocol {
    use super::*;

    /// Initialize treasury account
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::handler(ctx)
    }

    /// Harvest stake rewards and rebalance treasury
    pub fn harvest_and_rebalance(ctx: Context<HarvestAndRebalance>, yield_amount: u64) -> Result<()> {
        instructions::harvest_and_rebalance::handler(ctx, yield_amount)
    }

    /// Claim USDC rewards from treasury
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        user: Pubkey,
        timestamp: i64,
        claim_amount: u64,
        oracle_signature: Vec<u8>,
    ) -> Result<()> {
        instructions::claim_reward::handler(ctx, user, timestamp, claim_amount, oracle_signature)
    }

    /// Slash oracle for malicious behavior
    pub fn slash_oracle(ctx: Context<SlashOracle>, slash_amount: u64) -> Result<()> {
        instructions::slash_oracle::handler(ctx, slash_amount)
    }
} 