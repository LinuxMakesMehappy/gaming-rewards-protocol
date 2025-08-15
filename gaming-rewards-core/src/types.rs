//! Core types for the Gaming Rewards Protocol

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};
use wasm_bindgen::prelude::*;

/// Steam user information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SteamUser {
    pub steam_id: String,
    pub username: String,
    pub profile_url: String,
    pub avatar_url: String,
    pub account_age: u32, // days
    pub game_count: u32,
    pub level: u32,
    pub created_at: DateTime<Utc>,
}

/// Steam achievement information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub rarity: f64, // percentage (0.0 - 100.0)
    pub unlocked_at: DateTime<Utc>,
    pub game_id: String,
    pub game_name: String,
    pub icon_url: Option<String>,
}

/// Reward information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reward {
    pub id: String,
    pub amount: Decimal,
    pub currency: String,
    pub status: RewardStatus,
    pub timestamp: DateTime<Utc>,
    pub achievement_id: Option<String>,
    pub user_id: String,
    pub transaction_hash: Option<String>,
}

/// Reward status enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RewardStatus {
    Pending,
    Claimed,
    Staked,
    Failed,
}

/// Staking position information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingPosition {
    pub id: String,
    pub user_id: String,
    pub amount: Decimal,
    pub staked_at: DateTime<Utc>,
    pub lock_period: u32, // days
    pub apy: f64, // annual percentage yield
    pub rewards_earned: Decimal,
    pub status: StakingStatus,
    pub unlock_date: DateTime<Utc>,
}

/// Staking status enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Copy)]
pub enum StakingStatus {
    Active,
    Locked,
    Completed,
    Unstaking,
}

/// Security level enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Copy)]
pub enum SecurityLevel {
    Low,
    Medium,
    High,
    Military,
}

/// Fraud detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FraudResult {
    pub score: f64, // 0.0 - 1.0
    pub risk_level: RiskLevel,
    pub reasons: Vec<String>,
    pub timestamp: DateTime<Utc>,
}

/// Risk level enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Copy)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub steam_id: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub is_valid: bool,
    pub security_level: SecurityLevel,
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub details: String,
    pub timestamp: DateTime<Utc>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
}

/// Steam API response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SteamApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub success: bool,
    pub steam_data: Option<SteamUser>,
    pub achievement_data: Option<Achievement>,
    pub fraud_result: Option<FraudResult>,
    pub reason: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Rate limiting information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub requests_remaining: u32,
    pub reset_time: DateTime<Utc>,
    pub limit: u32,
    pub window_seconds: u32,
}

/// Protocol configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolConfig {
    pub base_reward_amount: Decimal,
    pub max_daily_claims: u32,
    pub min_stake_amount: Decimal,
    pub max_stake_amount: Decimal,
    pub staking_apy_rates: Vec<StakingTier>,
    pub security_settings: SecuritySettings,
}

/// Staking tier configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingTier {
    pub lock_period_days: u32,
    pub apy_percentage: f64,
    pub min_amount: Decimal,
    pub max_amount: Decimal,
}

/// Security settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySettings {
    pub max_fraud_score: f64,
    pub session_timeout_hours: u32,
    pub max_login_attempts: u32,
    pub require_2fa: bool,
    pub encryption_level: SecurityLevel,
}

// WASM-compatible wrapper types
#[wasm_bindgen]
pub struct SteamUserWasm {
    inner: SteamUser,
}

#[wasm_bindgen]
impl SteamUserWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        steam_id: String,
        username: String,
        profile_url: String,
        avatar_url: String,
        account_age: u32,
        game_count: u32,
        level: u32,
    ) -> SteamUserWasm {
        SteamUserWasm {
            inner: SteamUser {
                steam_id,
                username,
                profile_url,
                avatar_url,
                account_age,
                game_count,
                level,
                created_at: Utc::now(),
            }
        }
    }

    pub fn get_account_age_years(&self) -> f64 {
        self.inner.account_age as f64 / 365.0
    }

    pub fn is_veteran(&self) -> bool {
        self.inner.account_age > 365 * 2 // More than 2 years
    }

    pub fn get_steam_id(&self) -> String {
        self.inner.steam_id.clone()
    }

    pub fn get_username(&self) -> String {
        self.inner.username.clone()
    }
}

#[wasm_bindgen]
pub struct AchievementWasm {
    inner: Achievement,
}

#[wasm_bindgen]
impl AchievementWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        name: String,
        description: String,
        rarity: f64,
        game_id: String,
        game_name: String,
    ) -> AchievementWasm {
        AchievementWasm {
            inner: Achievement {
                id,
                name,
                description,
                rarity,
                unlocked_at: Utc::now(),
                game_id,
                game_name,
                icon_url: None,
            }
        }
    }

    pub fn is_rare(&self) -> bool {
        self.inner.rarity < 10.0
    }

    pub fn is_legendary(&self) -> bool {
        self.inner.rarity < 1.0
    }

    pub fn get_id(&self) -> String {
        self.inner.id.clone()
    }

    pub fn get_name(&self) -> String {
        self.inner.name.clone()
    }
}

#[wasm_bindgen]
pub struct RewardWasm {
    inner: Reward,
}

#[wasm_bindgen]
impl RewardWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        amount: f64,
        currency: String,
        user_id: String,
    ) -> RewardWasm {
        RewardWasm {
            inner: Reward {
                id,
                amount: Decimal::from_f64(amount).unwrap_or_default(),
                currency,
                status: RewardStatus::Pending,
                timestamp: Utc::now(),
                achievement_id: None,
                user_id,
                transaction_hash: None,
            }
        }
    }

    pub fn get_amount_as_f64(&self) -> f64 {
        self.inner.amount.to_f64().unwrap_or(0.0)
    }

    pub fn get_id(&self) -> String {
        self.inner.id.clone()
    }
}

#[wasm_bindgen]
pub struct StakingPositionWasm {
    inner: StakingPosition,
}

#[wasm_bindgen]
impl StakingPositionWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        user_id: String,
        amount: f64,
        lock_period: u32,
        apy: f64,
    ) -> StakingPositionWasm {
        let staked_at = Utc::now();
        let unlock_date = staked_at + chrono::Duration::days(lock_period as i64);
        
        StakingPositionWasm {
            inner: StakingPosition {
                id,
                user_id,
                amount: Decimal::from_f64(amount).unwrap_or_default(),
                staked_at,
                lock_period,
                apy,
                rewards_earned: Decimal::ZERO,
                status: StakingStatus::Active,
                unlock_date,
            }
        }
    }

    pub fn get_amount_as_f64(&self) -> f64 {
        self.inner.amount.to_f64().unwrap_or(0.0)
    }

    pub fn get_rewards_earned_as_f64(&self) -> f64 {
        self.inner.rewards_earned.to_f64().unwrap_or(0.0)
    }

    pub fn can_unstake(&self) -> bool {
        Utc::now() >= self.inner.unlock_date
    }

    pub fn get_id(&self) -> String {
        self.inner.id.clone()
    }
}
