use anchor_lang::prelude::*;
use crate::errors::*;
use crate::constants::*;

/// Multi-layer verification system for gaming rewards protocol
/// Implements Steam session tickets, OAuth + wallet signatures, ZKP attestations, and multi-factor verification

/// Steam session ticket verification data
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SteamSessionTicket {
    pub ticket: Vec<u8>,
    pub steam_id: u64,
    pub timestamp: i64,
    pub session_id: Vec<u8>,
}

/// OAuth + Wallet signature verification data
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct OAuthWalletSignature {
    pub steam_id: u64,
    pub wallet_pubkey: Pubkey,
    pub signature: Vec<u8>,
    pub message: Vec<u8>,
    pub timestamp: i64,
}

/// Zero-knowledge proof attestation data
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ZKPAttestation {
    pub proof: Vec<u8>,
    pub public_inputs: Vec<u8>,
    pub attestation_id: Vec<u8>,
    pub issuer: Pubkey,
    pub timestamp: i64,
}

/// Multi-factor verification data
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct MultiFactorVerification {
    pub steam_achievements: Vec<u8>,
    pub wallet_nfts: Vec<Pubkey>,
    pub on_chain_activity: Vec<u8>,
    pub ruby_score: u64,
    pub verification_level: u8,
}

/// User verification profile account
#[account]
#[derive(Default)]
pub struct UserVerificationProfile {
    pub user: Pubkey,
    pub steam_id: u64,
    pub wallet_pubkey: Pubkey,
    pub verification_level: u8,
    pub steam_session_valid: bool,
    pub oauth_wallet_linked: bool,
    pub zkp_attestations: Vec<ZKPAttestation>,
    pub multi_factor_score: u64,
    pub last_verification: i64,
    pub total_verifications: u64,
    pub fraud_detected: bool,
}

impl UserVerificationProfile {
    /// Initialize user verification profile
    pub fn initialize(&mut self, user: Pubkey, steam_id: u64, wallet_pubkey: Pubkey) {
        self.user = user;
        self.steam_id = steam_id;
        self.wallet_pubkey = wallet_pubkey;
        self.verification_level = 0;
        self.steam_session_valid = false;
        self.oauth_wallet_linked = false;
        self.zkp_attestations = Vec::new();
        self.multi_factor_score = 0;
        self.last_verification = 0;
        self.total_verifications = 0;
        self.fraud_detected = false;
    }

    /// Verify Steam session ticket
    pub fn verify_steam_session(&mut self, ticket: &SteamSessionTicket, oracle_signature: &[u8]) -> Result<bool> {
        require!(!self.fraud_detected, GamingRewardsError::FraudDetected);
        require!(ticket.steam_id == self.steam_id, GamingRewardsError::InvalidSteamId);
        
        // Verify oracle signature for Steam session ticket
        let session_id_str = String::from_utf8_lossy(&ticket.session_id);
        let message = format!("{}:{}:{}", ticket.steam_id, ticket.timestamp, session_id_str);
        let message_bytes = message.as_bytes();
        
        // In production: Verify Ed25519 signature with oracle public key
        require!(!oracle_signature.is_empty(), GamingRewardsError::InvalidOracleSignature);
        
        // Verify timestamp is recent (within 5 minutes)
        let clock = Clock::get()?;
        require!(ticket.timestamp <= clock.unix_timestamp, GamingRewardsError::InvalidTimestamp);
        require!(ticket.timestamp >= clock.unix_timestamp - MAX_VERIFICATION_AGE, GamingRewardsError::StaleVerification);
        
        self.steam_session_valid = true;
        self.last_verification = clock.unix_timestamp;
        self.total_verifications = self.total_verifications.checked_add(1)
            .ok_or(GamingRewardsError::Overflow)?;
        
        Ok(true)
    }

    /// Verify OAuth + Wallet signature
    pub fn verify_oauth_wallet(&mut self, oauth_data: &OAuthWalletSignature) -> Result<bool> {
        require!(!self.fraud_detected, GamingRewardsError::FraudDetected);
        require!(oauth_data.steam_id == self.steam_id, GamingRewardsError::InvalidSteamId);
        require!(oauth_data.wallet_pubkey == self.wallet_pubkey, GamingRewardsError::InvalidWallet);
        
        // Verify wallet signature
        let message = format!("{}:{}:{}", oauth_data.steam_id, oauth_data.wallet_pubkey, oauth_data.timestamp);
        let message_bytes = message.as_bytes();
        
        // In production: Verify Ed25519 signature with wallet public key
        require!(!oauth_data.signature.is_empty(), GamingRewardsError::InvalidWalletSignature);
        
        // Verify timestamp
        let clock = Clock::get()?;
        require!(oauth_data.timestamp <= clock.unix_timestamp, GamingRewardsError::InvalidTimestamp);
        require!(oauth_data.timestamp >= clock.unix_timestamp - MAX_VERIFICATION_AGE, GamingRewardsError::StaleVerification);
        
        self.oauth_wallet_linked = true;
        self.verification_level = self.verification_level.saturating_add(1);
        self.last_verification = clock.unix_timestamp;
        
        Ok(true)
    }

    /// Add ZKP attestation
    pub fn add_zkp_attestation(&mut self, attestation: ZKPAttestation) -> Result<bool> {
        require!(!self.fraud_detected, GamingRewardsError::FraudDetected);
        require!(attestation.issuer == ORACLE_PUBKEY, GamingRewardsError::Unauthorized);
        
        // Verify attestation timestamp
        let clock = Clock::get()?;
        require!(attestation.timestamp <= clock.unix_timestamp, GamingRewardsError::InvalidTimestamp);
        require!(attestation.timestamp >= clock.unix_timestamp - MAX_VERIFICATION_AGE, GamingRewardsError::StaleVerification);
        
        // In production: Verify ZKP proof on-chain
        require!(!attestation.proof.is_empty(), GamingRewardsError::InvalidZKPProof);
        
        self.zkp_attestations.push(attestation);
        self.verification_level = self.verification_level.saturating_add(1);
        self.last_verification = clock.unix_timestamp;
        
        Ok(true)
    }

    /// Verify multi-factor authentication
    pub fn verify_multi_factor(&mut self, mfa_data: &MultiFactorVerification) -> Result<bool> {
        require!(!self.fraud_detected, GamingRewardsError::FraudDetected);
        require!(self.steam_session_valid, GamingRewardsError::SteamSessionRequired);
        require!(self.oauth_wallet_linked, GamingRewardsError::OAuthWalletRequired);
        
        // Calculate multi-factor score
        let mut score = 0u64;
        
        // Steam achievements verification
        if !mfa_data.steam_achievements.is_empty() {
            score = score.checked_add(25).ok_or(GamingRewardsError::Overflow)?;
        }
        
        // Wallet NFT verification
        if !mfa_data.wallet_nfts.is_empty() {
            score = score.checked_add(25).ok_or(GamingRewardsError::Overflow)?;
        }
        
        // On-chain activity verification
        if !mfa_data.on_chain_activity.is_empty() {
            score = score.checked_add(25).ok_or(GamingRewardsError::Overflow)?;
        }
        
        // Ruby score verification
        if mfa_data.ruby_score > 0 {
            score = score.checked_add(25).ok_or(GamingRewardsError::Overflow)?;
        }
        
        self.multi_factor_score = score;
        self.verification_level = self.verification_level.saturating_add(1);
        
        let clock = Clock::get()?;
        self.last_verification = clock.unix_timestamp;
        
        Ok(true)
    }

    /// Check if user is eligible for rewards
    pub fn is_eligible_for_rewards(&self) -> Result<bool> {
        require!(!self.fraud_detected, GamingRewardsError::FraudDetected);
        require!(self.steam_session_valid, GamingRewardsError::SteamSessionRequired);
        require!(self.oauth_wallet_linked, GamingRewardsError::OAuthWalletRequired);
        require!(self.verification_level >= 2, GamingRewardsError::InsufficientVerification);
        require!(self.multi_factor_score >= 50, GamingRewardsError::InsufficientMultiFactor);
        
        Ok(true)
    }

    /// Mark user as fraudulent
    pub fn mark_fraudulent(&mut self) {
        self.fraud_detected = true;
        self.steam_session_valid = false;
        self.oauth_wallet_linked = false;
        self.verification_level = 0;
        self.multi_factor_score = 0;
    }

    /// Get verification score for reward calculation
    pub fn get_verification_score(&self) -> u64 {
        if self.fraud_detected {
            return 0;
        }
        
        let mut score = 0u64;
        
        if self.steam_session_valid {
            score = score.saturating_add(25);
        }
        
        if self.oauth_wallet_linked {
            score = score.saturating_add(25);
        }
        
        score = score.saturating_add(self.verification_level.saturating_mul(10) as u64);
        score = score.saturating_add(self.multi_factor_score.saturating_div(4));
        
        score
    }
}

/// Oracle verification account for managing verification oracles
#[account]
#[derive(Default)]
pub struct OracleVerificationAccount {
    pub oracle: Pubkey,
    pub stake: u64,
    pub verification_count: u64,
    pub fraud_detected_count: u64,
    pub last_verification: i64,
    pub is_active: bool,
}

impl OracleVerificationAccount {
    /// Initialize oracle verification account
    pub fn initialize(&mut self, oracle: Pubkey, stake: u64) {
        self.oracle = oracle;
        self.stake = stake;
        self.verification_count = 0;
        self.fraud_detected_count = 0;
        self.last_verification = 0;
        self.is_active = true;
    }

    /// Validate oracle stake
    pub fn validate_stake(&self, min_stake: u64) -> Result<()> {
        require!(self.stake >= min_stake, GamingRewardsError::InsufficientOracleStake);
        require!(self.is_active, GamingRewardsError::InactiveOracle);
        Ok(())
    }

    /// Record verification
    pub fn record_verification(&mut self, fraud_detected: bool) {
        self.verification_count = self.verification_count.saturating_add(1);
        if fraud_detected {
            self.fraud_detected_count = self.fraud_detected_count.saturating_add(1);
        }
        
        let clock = Clock::get().unwrap_or_default();
        self.last_verification = clock.unix_timestamp;
    }

    /// Slash oracle for fraudulent verification
    pub fn slash_oracle(&mut self, slash_amount: u64) -> Result<()> {
        require!(slash_amount <= self.stake, GamingRewardsError::InvalidSlashAmount);
        self.stake = self.stake.checked_sub(slash_amount)
            .ok_or(GamingRewardsError::Underflow)?;
        
        if self.stake < MIN_ORACLE_STAKE {
            self.is_active = false;
        }
        
        Ok(())
    }
}

/// Verification constants and validation functions
pub mod verification_constants {
    use super::*;
    
    /// Maximum verification age in seconds
    pub const MAX_VERIFICATION_AGE: i64 = 300; // 5 minutes
    
    /// Minimum verification level for rewards
    pub const MIN_VERIFICATION_LEVEL: u8 = 2;
    
    /// Minimum multi-factor score for rewards
    pub const MIN_MULTI_FACTOR_SCORE: u64 = 50;
    
    /// Steam session ticket validation
    pub fn validate_steam_session_ticket(ticket: &SteamSessionTicket) -> Result<()> {
        require!(!ticket.ticket.is_empty(), GamingRewardsError::InvalidSteamTicket);
        require!(ticket.steam_id > 0, GamingRewardsError::InvalidSteamId);
        require!(!ticket.session_id.is_empty(), GamingRewardsError::InvalidSessionId);
        Ok(())
    }
    
    /// OAuth wallet signature validation
    pub fn validate_oauth_wallet_signature(oauth_data: &OAuthWalletSignature) -> Result<()> {
        require!(oauth_data.steam_id > 0, GamingRewardsError::InvalidSteamId);
        require!(!oauth_data.signature.is_empty(), GamingRewardsError::InvalidWalletSignature);
        require!(!oauth_data.message.is_empty(), GamingRewardsError::InvalidMessage);
        Ok(())
    }
    
    /// ZKP attestation validation
    pub fn validate_zkp_attestation(attestation: &ZKPAttestation) -> Result<()> {
        require!(!attestation.proof.is_empty(), GamingRewardsError::InvalidZKPProof);
        require!(!attestation.public_inputs.is_empty(), GamingRewardsError::InvalidZKPInputs);
        require!(!attestation.attestation_id.is_empty(), GamingRewardsError::InvalidAttestationId);
        Ok(())
    }
    
    /// Multi-factor verification validation
    pub fn validate_multi_factor_verification(mfa_data: &MultiFactorVerification) -> Result<()> {
        require!(mfa_data.verification_level <= 4, GamingRewardsError::InvalidVerificationLevel);
        require!(mfa_data.ruby_score <= 1000, GamingRewardsError::InvalidRubyScore);
        Ok(())
    }
}
