//! Gaming Rewards Protocol Core - Rust + WebAssembly
//! 
//! This library provides secure, memory-safe implementations of:
//! - Steam user validation and achievement verification
//! - Cryptographic security and encryption
//! - Reward calculation and staking logic
//! - Fraud detection and rate limiting
//! - Audit logging and session management

use wasm_bindgen::prelude::*;

// Core modules
pub mod steam_validation;
pub mod security_manager;
pub mod reward_engine;
pub mod staking_logic;
pub mod fraud_detection;
pub mod crypto_utils;
pub mod error;
pub mod types;

// Re-export main types for WASM
pub use steam_validation::SteamValidator;
pub use security_manager::SecurityManager;
pub use reward_engine::RewardEngine;
pub use staking_logic::StakingManager;
pub use fraud_detection::FraudDetector;
pub use types::{SteamUserWasm, AchievementWasm, RewardWasm, StakingPositionWasm};
pub use types::*;

/// Initialize the gaming rewards core system
#[wasm_bindgen]
pub fn init_gaming_rewards() -> Result<(), JsValue> {
    // Set up panic hook for better error reporting in WASM
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    
    // Initialize logging
    log::info!("Gaming Rewards Core initialized successfully");
    
    Ok(())
}

/// Get the version of the gaming rewards core
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get security status information
#[wasm_bindgen]
pub fn get_security_status() -> Result<JsValue, JsValue> {
    let status = SecurityStatus {
        memory_safety: true,
        type_safety: true,
        cryptographic_security: true,
        sandboxed_execution: true,
        deterministic_behavior: true,
        version: get_version(),
    };
    
    Ok(serde_wasm_bindgen::to_value(&status)?)
}

#[derive(serde::Serialize)]
struct SecurityStatus {
    memory_safety: bool,
    type_safety: bool,
    cryptographic_security: bool,
    sandboxed_execution: bool,
    deterministic_behavior: bool,
    version: String,
}

// WASM-specific utilities
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn console_log(s: &str) {
    log(s);
}
