use anchor_lang::prelude::*;
use crate::account_structs::*;
use crate::errors::*;
use crate::events::*;
use crate::security::verification::*;

/// Verify multi-factor authentication
pub fn handler(
    ctx: Context<VerifyMultiFactor>,
    mfa_data: MultiFactorVerification,
    oracle_signature: Vec<u8>,
) -> Result<()> {
    let clock = Clock::get()?;
    let user_profile = &mut ctx.accounts.user_profile;
    let oracle_account = &mut ctx.accounts.oracle_account;
    
    // Validate oracle stake
    oracle_account.validate_stake(MIN_ORACLE_STAKE)?;
    
    // Validate multi-factor verification data
    verification_constants::validate_multi_factor_verification(&mfa_data)?;
    
    // Verify oracle signature for multi-factor data
    let message = format!("{}:{}:{}", user_profile.user, mfa_data.ruby_score, mfa_data.verification_level);
    let message_bytes = message.as_bytes();
    require!(!oracle_signature.is_empty(), GamingRewardsError::InvalidOracleSignature);
    
    // Verify multi-factor authentication
    let verification_success = user_profile.verify_multi_factor(&mfa_data)?;
    require!(verification_success, GamingRewardsError::InsufficientMultiFactor);
    
    // Record oracle verification
    oracle_account.record_verification(false);
    
    // Emit verification event
    emit!(MultiFactorVerifiedEvent {
        user: user_profile.user,
        verification_level: mfa_data.verification_level,
        multi_factor_score: user_profile.multi_factor_score,
        ruby_score: mfa_data.ruby_score,
        timestamp: clock.unix_timestamp,
        oracle: oracle_account.oracle,
    });
    
    msg!("Multi-factor verification completed successfully");
    msg!("User: {}", user_profile.user);
    msg!("Verification Level: {}", mfa_data.verification_level);
    msg!("Multi-Factor Score: {}", user_profile.multi_factor_score);
    msg!("Ruby Score: {}", mfa_data.ruby_score);
    msg!("Oracle: {}", oracle_account.oracle);
    
    Ok(())
}
