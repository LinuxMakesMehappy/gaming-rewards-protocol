//! Security manager module for the Gaming Rewards Protocol

use wasm_bindgen::prelude::*;
use crate::types::{Session, SecurityLevel};
use crate::error::{GamingRewardsError, GamingRewardsResult};

/// Security manager for session and encryption management
#[wasm_bindgen]
pub struct SecurityManager {
    encryption_key: String,
}

#[wasm_bindgen]
impl SecurityManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SecurityManager {
        SecurityManager {
            encryption_key: "default_key_32_bytes_long".to_string(),
        }
    }

    /// Create a new session
    pub fn create_session(&self, user_id: &str, steam_id: &str) -> Result<JsValue, JsValue> {
        let session = Session {
            id: format!("session_{}", uuid::Uuid::new_v4()),
            user_id: user_id.to_string(),
            steam_id: steam_id.to_string(),
            created_at: chrono::Utc::now(),
            expires_at: chrono::Utc::now() + chrono::Duration::hours(24),
            is_valid: true,
            security_level: SecurityLevel::High,
        };

        Ok(serde_wasm_bindgen::to_value(&session)?)
    }

    /// Validate a session
    pub fn validate_session(&self, session_id: &str) -> Result<bool, JsValue> {
        // For now, always return true for mock sessions
        Ok(true)
    }

    /// Encrypt data
    pub fn encrypt_data(&self, data: &str) -> Result<String, JsValue> {
        // For now, return base64 encoded data
        Ok(base64::encode(data.as_bytes()))
    }

    /// Decrypt data
    pub fn decrypt_data(&self, encrypted_data: &str) -> Result<String, JsValue> {
        // For now, decode base64 data
        let bytes = base64::decode(encrypted_data)
            .map_err(|e| JsValue::from_str(&format!("Decryption failed: {}", e)))?;
        
        String::from_utf8(bytes)
            .map_err(|e| JsValue::from_str(&format!("Invalid UTF-8: {}", e)))
    }
}
