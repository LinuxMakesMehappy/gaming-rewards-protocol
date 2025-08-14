use anchor_lang::prelude::*;
use crate::account_structs::*;
use crate::errors::*;
use crate::events::*;
use crate::security::verification::*;

/// Verify OAuth + wallet signature
pub fn handler(
    ctx: Context<VerifyOAuthWallet>,
    oauth_data: OAuthWalletSignature,
) -> Result<()> {
    let clock = Clock::get()?;
    let user_profile = &mut ctx.accounts.user_profile;
    let oracle_account = &mut ctx.accounts.oracle_account;
    
    // Validate oracle stake
    oracle_account.validate_stake(MIN_ORACLE_STAKE)?;
    
    // Validate OAuth wallet signature data
    verification_constants::validate_oauth_wallet_signature(&oauth_data)?;
    
    // Verify OAuth + wallet signature
    let verification_success = user_profile.verify_oauth_wallet(&oauth_data)?;
    require!(verification_success, GamingRewardsError::InvalidWalletSignature);
    
    // Record oracle verification
    oracle_account.record_verification(false);
    
    // Emit verification event
    emit!(OAuthWalletVerifiedEvent {
        user: user_profile.user,
        steam_id: oauth_data.steam_id,
        wallet: oauth_data.wallet_pubkey,
        timestamp: clock.unix_timestamp,
        oracle: oracle_account.oracle,
    });
    
    msg!("OAuth wallet verified successfully");
    msg!("User: {}", user_profile.user);
    msg!("Steam ID: {}", oauth_data.steam_id);
    msg!("Wallet: {}", oauth_data.wallet_pubkey);
    msg!("Oracle: {}", oracle_account.oracle);
    
    Ok(())
}
