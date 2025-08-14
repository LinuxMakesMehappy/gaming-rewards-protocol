use anchor_lang::prelude::*;
use crate::account_structs::*;
use crate::errors::*;
use crate::events::*;
use crate::security::verification::*;

/// Verify Steam session ticket with oracle signature
pub fn handler(
    ctx: Context<VerifySteamSession>,
    steam_ticket: SteamSessionTicket,
    oracle_signature: Vec<u8>,
) -> Result<()> {
    let clock = Clock::get()?;
    let user_profile = &mut ctx.accounts.user_profile;
    let oracle_account = &mut ctx.accounts.oracle_account;
    
    // Validate oracle stake
    oracle_account.validate_stake(MIN_ORACLE_STAKE)?;
    
    // Validate Steam session ticket
    verification_constants::validate_steam_session_ticket(&steam_ticket)?;
    
    // Verify Steam session ticket
    let verification_success = user_profile.verify_steam_session(&steam_ticket, &oracle_signature)?;
    require!(verification_success, GamingRewardsError::InvalidSteamTicket);
    
    // Record oracle verification
    oracle_account.record_verification(false);
    
    // Emit verification event
    emit!(SteamSessionVerifiedEvent {
        user: user_profile.user,
        steam_id: steam_ticket.steam_id,
        timestamp: clock.unix_timestamp,
        oracle: oracle_account.oracle,
    });
    
    msg!("Steam session verified successfully");
    msg!("User: {}", user_profile.user);
    msg!("Steam ID: {}", steam_ticket.steam_id);
    msg!("Oracle: {}", oracle_account.oracle);
    
    Ok(())
}
