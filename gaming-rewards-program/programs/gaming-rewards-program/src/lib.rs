use anchor_lang::prelude::*;

declare_id!("AQYCveRo1vkTyRASU8WL2peDGxG33eMARTY2VUMU4KPX");

#[program]
pub mod gaming_rewards_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
