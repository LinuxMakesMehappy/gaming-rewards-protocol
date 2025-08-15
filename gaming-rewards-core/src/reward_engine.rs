//! Reward engine module for the Gaming Rewards Protocol

use wasm_bindgen::prelude::*;
use crate::types::{Reward, Achievement, RewardStatus};
use crate::error::{GamingRewardsError, GamingRewardsResult};
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};

/// Reward engine for calculating and managing rewards
#[wasm_bindgen]
pub struct RewardEngine {
    base_reward: Decimal,
}

#[wasm_bindgen]
impl RewardEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RewardEngine {
        RewardEngine {
            base_reward: Decimal::new(100, 2), // 1.00 SOL
        }
    }

    /// Calculate reward for an achievement
    pub fn calculate_reward(&self, achievement_rarity: f64) -> Result<f64, JsValue> {
        let rarity_multiplier = Decimal::from_f64(achievement_rarity / 100.0)
            .unwrap_or(Decimal::ONE);
        
        let reward = self.base_reward * rarity_multiplier;
        Ok(reward.to_f64().unwrap_or(1.0))
    }

    /// Create a new reward
    pub fn create_reward(&self, user_id: &str, amount: f64, achievement_id: Option<String>) -> Result<JsValue, JsValue> {
        let reward = Reward {
            id: format!("reward_{}", uuid::Uuid::new_v4()),
            amount: Decimal::from_f64(amount).unwrap_or_default(),
            currency: "SOL".to_string(),
            status: RewardStatus::Pending,
            timestamp: chrono::Utc::now(),
            achievement_id: achievement_id,
            user_id: user_id.to_string(),
            transaction_hash: None,
        };

        Ok(serde_wasm_bindgen::to_value(&reward)?)
    }

    /// Process a reward claim
    pub fn process_claim(&self, reward_id: &str) -> Result<JsValue, JsValue> {
        // For now, return a mock processed reward
        let reward = Reward {
            id: reward_id.to_string(),
            amount: Decimal::new(100, 2),
            currency: "SOL".to_string(),
            status: RewardStatus::Claimed,
            timestamp: chrono::Utc::now(),
            achievement_id: None,
            user_id: "mock_user".to_string(),
            transaction_hash: Some("mock_tx_hash".to_string()),
        };

        Ok(serde_wasm_bindgen::to_value(&reward)?)
    }
}
