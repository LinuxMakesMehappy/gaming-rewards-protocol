//! Fraud detection module for the Gaming Rewards Protocol

use wasm_bindgen::prelude::*;
use crate::types::{FraudResult, RiskLevel};
use crate::error::{GamingRewardsError, GamingRewardsResult};

/// Fraud detector for detecting suspicious activity
#[wasm_bindgen]
pub struct FraudDetector {
    risk_threshold: f64,
}

#[wasm_bindgen]
impl FraudDetector {
    #[wasm_bindgen(constructor)]
    pub fn new() -> FraudDetector {
        FraudDetector {
            risk_threshold: 0.8,
        }
    }

    /// Analyze user behavior for fraud
    pub fn analyze_user(&self, steam_id: &str, account_age: u32, game_count: u32) -> Result<JsValue, JsValue> {
        let mut risk_score = 0.0;
        let mut reasons = Vec::new();

        // Check account age
        if account_age < 30 {
            risk_score += 0.3;
            reasons.push("New account (less than 30 days)".to_string());
        }

        // Check game count
        if game_count < 5 {
            risk_score += 0.2;
            reasons.push("Low game count".to_string());
        }

        // Check for suspicious patterns
        if steam_id.len() != 17 {
            risk_score += 0.5;
            reasons.push("Invalid Steam ID format".to_string());
        }

        let risk_level = if risk_score >= 0.8 {
            RiskLevel::Critical
        } else if risk_score >= 0.6 {
            RiskLevel::High
        } else if risk_score >= 0.4 {
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        };

        let fraud_result = FraudResult {
            score: risk_score,
            risk_level,
            reasons,
            timestamp: chrono::Utc::now(),
        };

        Ok(serde_wasm_bindgen::to_value(&fraud_result)?)
    }

    /// Check if a user is flagged for fraud
    pub fn is_fraudulent(&self, risk_score: f64) -> bool {
        risk_score >= self.risk_threshold
    }

    /// Get risk level description
    pub fn get_risk_description(&self, risk_level: &str) -> String {
        match risk_level {
            "Low" => "Low risk user".to_string(),
            "Medium" => "Medium risk user - monitor closely".to_string(),
            "High" => "High risk user - additional verification required".to_string(),
            "Critical" => "Critical risk user - blocked".to_string(),
            _ => "Unknown risk level".to_string(),
        }
    }
}
