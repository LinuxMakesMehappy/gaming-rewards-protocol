//! Staking logic module for the Gaming Rewards Protocol

use wasm_bindgen::prelude::*;
use crate::types::{StakingPosition, StakingStatus};
use crate::error::{GamingRewardsError, GamingRewardsResult};
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};

/// Staking manager for managing staking positions
#[wasm_bindgen]
pub struct StakingManager {
    default_apy: f64,
}

#[wasm_bindgen]
impl StakingManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StakingManager {
        StakingManager {
            default_apy: 12.5, // 12.5% APY
        }
    }

    /// Create a new staking position
    pub fn create_staking_position(&self, user_id: &str, amount: f64, lock_period: u32) -> Result<JsValue, JsValue> {
        let staking_position = StakingPosition {
            id: format!("stake_{}", uuid::Uuid::new_v4()),
            user_id: user_id.to_string(),
            amount: Decimal::from_f64(amount).unwrap_or_default(),
            staked_at: chrono::Utc::now(),
            lock_period,
            apy: self.default_apy,
            rewards_earned: Decimal::ZERO,
            status: StakingStatus::Active,
            unlock_date: chrono::Utc::now() + chrono::Duration::days(lock_period as i64),
        };

        Ok(serde_wasm_bindgen::to_value(&staking_position)?)
    }

    /// Calculate rewards for a staking position
    pub fn calculate_rewards(&self, amount: f64, days_staked: u32, apy: f64) -> Result<f64, JsValue> {
        let daily_rate = apy / 365.0 / 100.0;
        let rewards = amount * daily_rate * days_staked as f64;
        Ok(rewards)
    }

    /// Unstake a position
    pub fn unstake_position(&self, position_id: &str) -> Result<JsValue, JsValue> {
        // For now, return a mock unstaking position
        let staking_position = StakingPosition {
            id: position_id.to_string(),
            user_id: "mock_user".to_string(),
            amount: Decimal::new(1000, 2), // 10.00 SOL
            staked_at: chrono::Utc::now() - chrono::Duration::days(30),
            lock_period: 30,
            apy: self.default_apy,
            rewards_earned: Decimal::new(125, 2), // 1.25 SOL rewards
            status: StakingStatus::Unstaking,
            unlock_date: chrono::Utc::now(),
        };

        Ok(serde_wasm_bindgen::to_value(&staking_position)?)
    }
}
