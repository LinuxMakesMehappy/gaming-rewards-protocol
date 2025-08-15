//! Error handling for the Gaming Rewards Protocol

use thiserror::Error;
use wasm_bindgen::prelude::*;

/// Custom error types for the gaming rewards protocol
#[derive(Error, Debug, Clone)]
pub enum GamingRewardsError {
    #[error("Steam API error: {0}")]
    SteamApiError(String),
    
    #[error("Invalid Steam ID format: {0}")]
    InvalidSteamId(String),
    
    #[error("Achievement validation failed: {0}")]
    AchievementValidationError(String),
    
    #[error("Fraud detection failed: {0}")]
    FraudDetectionError(String),
    
    #[error("Rate limit exceeded: {0}")]
    RateLimitError(String),
    
    #[error("Encryption error: {0}")]
    EncryptionError(String),
    
    #[error("Decryption error: {0}")]
    DecryptionError(String),
    
    #[error("Session validation failed: {0}")]
    SessionError(String),
    
    #[error("Reward processing error: {0}")]
    RewardError(String),
    
    #[error("Staking error: {0}")]
    StakingError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Deserialization error: {0}")]
    DeserializationError(String),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("Unauthorized access: {0}")]
    Unauthorized(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<GamingRewardsError> for JsValue {
    fn from(error: GamingRewardsError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}

impl From<serde_json::Error> for GamingRewardsError {
    fn from(error: serde_json::Error) -> Self {
        GamingRewardsError::SerializationError(error.to_string())
    }
}

// Removed reqwest error handling since reqwest is not available in WASM
// impl From<reqwest::Error> for GamingRewardsError {
//     fn from(error: reqwest::Error) -> Self {
//         GamingRewardsError::NetworkError(error.to_string())
//     }
// }

impl From<aes_gcm::Error> for GamingRewardsError {
    fn from(error: aes_gcm::Error) -> Self {
        GamingRewardsError::EncryptionError(error.to_string())
    }
}

impl From<std::io::Error> for GamingRewardsError {
    fn from(error: std::io::Error) -> Self {
        GamingRewardsError::InternalError(error.to_string())
    }
}

impl From<chrono::ParseError> for GamingRewardsError {
    fn from(error: chrono::ParseError) -> Self {
        GamingRewardsError::InvalidInput(error.to_string())
    }
}

/// Result type for gaming rewards operations
pub type GamingRewardsResult<T> = Result<T, GamingRewardsError>;

/// WASM-compatible error wrapper
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ErrorInfo {
    pub error_type: String,
    pub message: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub code: Option<String>,
}

impl From<GamingRewardsError> for ErrorInfo {
    fn from(error: GamingRewardsError) -> Self {
        ErrorInfo {
            error_type: format!("{:?}", error),
            message: error.to_string(),
            timestamp: chrono::Utc::now(),
            code: None,
        }
    }
}

impl ErrorInfo {
    pub fn new(error_type: String, message: String) -> ErrorInfo {
        ErrorInfo {
            error_type,
            message,
            timestamp: chrono::Utc::now(),
            code: None,
        }
    }

    pub fn with_code(mut self, code: String) -> ErrorInfo {
        self.code = Some(code);
        self
    }

    pub fn get_timestamp_as_string(&self) -> String {
        self.timestamp.to_rfc3339()
    }
}

/// Error codes for different types of errors
#[derive(Debug, Clone, PartialEq, Copy)]
pub enum ErrorCode {
    // Steam-related errors (1000-1999)
    InvalidSteamId = 1000,
    SteamApiUnavailable = 1001,
    SteamApiRateLimit = 1002,
    SteamUserNotFound = 1003,
    SteamAchievementInvalid = 1004,
    
    // Security-related errors (2000-2999)
    EncryptionFailed = 2000,
    DecryptionFailed = 2001,
    SessionExpired = 2002,
    SessionInvalid = 2003,
    UnauthorizedAccess = 2004,
    FraudDetected = 2005,
    
    // Reward-related errors (3000-3999)
    RewardNotFound = 3000,
    RewardAlreadyClaimed = 3001,
    RewardCalculationFailed = 3002,
    InsufficientFunds = 3003,
    TransactionFailed = 3004,
    
    // Staking-related errors (4000-4999)
    StakingPositionNotFound = 4000,
    StakingLockPeriodNotMet = 4001,
    StakingAmountInvalid = 4002,
    StakingCalculationFailed = 4003,
    
    // Configuration errors (5000-5999)
    ConfigInvalid = 5000,
    ConfigMissing = 5001,
    ConfigParseError = 5002,
    
    // Network errors (6000-6999)
    NetworkTimeout = 6000,
    NetworkUnavailable = 6001,
    NetworkConnectionFailed = 6002,
    
    // Internal errors (9000-9999)
    InternalError = 9000,
    SerializationError = 9001,
    DeserializationError = 9002,
    UnknownError = 9999,
}

impl ErrorCode {
    pub fn as_u32(&self) -> u32 {
        self.clone() as u32
    }
    
    pub fn from_u32(code: u32) -> Option<ErrorCode> {
        match code {
            1000 => Some(ErrorCode::InvalidSteamId),
            1001 => Some(ErrorCode::SteamApiUnavailable),
            1002 => Some(ErrorCode::SteamApiRateLimit),
            1003 => Some(ErrorCode::SteamUserNotFound),
            1004 => Some(ErrorCode::SteamAchievementInvalid),
            2000 => Some(ErrorCode::EncryptionFailed),
            2001 => Some(ErrorCode::DecryptionFailed),
            2002 => Some(ErrorCode::SessionExpired),
            2003 => Some(ErrorCode::SessionInvalid),
            2004 => Some(ErrorCode::UnauthorizedAccess),
            2005 => Some(ErrorCode::FraudDetected),
            3000 => Some(ErrorCode::RewardNotFound),
            3001 => Some(ErrorCode::RewardAlreadyClaimed),
            3002 => Some(ErrorCode::RewardCalculationFailed),
            3003 => Some(ErrorCode::InsufficientFunds),
            3004 => Some(ErrorCode::TransactionFailed),
            4000 => Some(ErrorCode::StakingPositionNotFound),
            4001 => Some(ErrorCode::StakingLockPeriodNotMet),
            4002 => Some(ErrorCode::StakingAmountInvalid),
            4003 => Some(ErrorCode::StakingCalculationFailed),
            5000 => Some(ErrorCode::ConfigInvalid),
            5001 => Some(ErrorCode::ConfigMissing),
            5002 => Some(ErrorCode::ConfigParseError),
            6000 => Some(ErrorCode::NetworkTimeout),
            6001 => Some(ErrorCode::NetworkUnavailable),
            6002 => Some(ErrorCode::NetworkConnectionFailed),
            9000 => Some(ErrorCode::InternalError),
            9001 => Some(ErrorCode::SerializationError),
            9002 => Some(ErrorCode::DeserializationError),
            9999 => Some(ErrorCode::UnknownError),
            _ => None,
        }
    }
    
    pub fn get_message(&self) -> &'static str {
        match self {
            ErrorCode::InvalidSteamId => "Invalid Steam ID format",
            ErrorCode::SteamApiUnavailable => "Steam API is currently unavailable",
            ErrorCode::SteamApiRateLimit => "Steam API rate limit exceeded",
            ErrorCode::SteamUserNotFound => "Steam user not found",
            ErrorCode::SteamAchievementInvalid => "Invalid Steam achievement",
            ErrorCode::EncryptionFailed => "Data encryption failed",
            ErrorCode::DecryptionFailed => "Data decryption failed",
            ErrorCode::SessionExpired => "Session has expired",
            ErrorCode::SessionInvalid => "Invalid session",
            ErrorCode::UnauthorizedAccess => "Unauthorized access",
            ErrorCode::FraudDetected => "Fraud detected",
            ErrorCode::RewardNotFound => "Reward not found",
            ErrorCode::RewardAlreadyClaimed => "Reward already claimed",
            ErrorCode::RewardCalculationFailed => "Reward calculation failed",
            ErrorCode::InsufficientFunds => "Insufficient funds",
            ErrorCode::TransactionFailed => "Transaction failed",
            ErrorCode::StakingPositionNotFound => "Staking position not found",
            ErrorCode::StakingLockPeriodNotMet => "Staking lock period not met",
            ErrorCode::StakingAmountInvalid => "Invalid staking amount",
            ErrorCode::StakingCalculationFailed => "Staking calculation failed",
            ErrorCode::ConfigInvalid => "Invalid configuration",
            ErrorCode::ConfigMissing => "Configuration missing",
            ErrorCode::ConfigParseError => "Configuration parse error",
            ErrorCode::NetworkTimeout => "Network timeout",
            ErrorCode::NetworkUnavailable => "Network unavailable",
            ErrorCode::NetworkConnectionFailed => "Network connection failed",
            ErrorCode::InternalError => "Internal error",
            ErrorCode::SerializationError => "Serialization error",
            ErrorCode::DeserializationError => "Deserialization error",
            ErrorCode::UnknownError => "Unknown error",
        }
    }
}

/// Helper function to create error info with code
pub fn create_error_info(error: GamingRewardsError, code: ErrorCode) -> ErrorInfo {
    ErrorInfo {
        error_type: format!("{:?}", error),
        message: error.to_string(),
        timestamp: chrono::Utc::now(),
        code: Some(code.as_u32().to_string()),
    }
}
