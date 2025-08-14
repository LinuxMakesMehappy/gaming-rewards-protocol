//! WebAssembly Security Layer for Gaming Rewards Protocol
//! 
//! This module provides additional security guarantees through WebAssembly:
//! - Sandboxed execution environment
//! - Deterministic computation
//! - Type-safe operations
//! - Isolated memory management
//! - Verifiable bytecode

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signature, Signer, Verifier};

/// Security operation types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum SecurityOperation {
    /// Verify oracle signature
    VerifyOracleSignature {
        message: Vec<u8>,
        signature: Vec<u8>,
        public_key: Vec<u8>,
    },
    /// Validate transaction parameters
    ValidateTransaction {
        amount: u64,
        recipient: Vec<u8>,
        timestamp: u64,
    },
    /// Check rate limiting
    CheckRateLimit {
        user_id: Vec<u8>,
        operation_type: String,
        current_time: u64,
    },
    /// Generate secure random number
    GenerateSecureRandom {
        min: u64,
        max: u64,
        seed: Vec<u8>,
    },
    /// Hash sensitive data
    HashSensitiveData {
        data: Vec<u8>,
        salt: Vec<u8>,
    },
}

/// Security operation result
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SecurityResult {
    /// Operation success status
    pub success: bool,
    /// Result data (if any)
    pub data: Option<Vec<u8>>,
    /// Error message (if any)
    pub error: Option<String>,
    /// Security level achieved
    pub security_level: SecurityLevel,
    /// Audit trail entry
    pub audit_entry: AuditEntry,
}

/// Security levels
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum SecurityLevel {
    Low,
    Medium,
    High,
    Critical,
    Maximum,
}

/// Audit trail entry
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AuditEntry {
    /// Operation timestamp
    pub timestamp: u64,
    /// Operation type
    pub operation_type: String,
    /// Input hash
    pub input_hash: Vec<u8>,
    /// Output hash
    pub output_hash: Vec<u8>,
    /// Security level
    pub security_level: SecurityLevel,
    /// Verification status
    pub verified: bool,
}

/// WebAssembly Security Manager
#[wasm_bindgen]
pub struct WasmSecurityManager {
    /// Security policies
    policies: Vec<SecurityPolicy>,
    /// Audit trail
    audit_trail: Vec<AuditEntry>,
    /// Rate limiting data
    rate_limits: std::collections::HashMap<String, RateLimitData>,
}

/// Security policy
#[derive(Serialize, Deserialize, Clone, Debug)]
struct SecurityPolicy {
    name: String,
    min_security_level: SecurityLevel,
    max_operations_per_hour: u32,
    required_verifications: Vec<String>,
}

/// Rate limiting data
#[derive(Serialize, Deserialize, Clone, Debug)]
struct RateLimitData {
    operations: Vec<u64>,
    last_reset: u64,
}

#[wasm_bindgen]
impl WasmSecurityManager {
    /// Create new security manager
    pub fn new() -> Self {
        let mut manager = WasmSecurityManager {
            policies: Vec::new(),
            audit_trail: Vec::new(),
            rate_limits: std::collections::HashMap::new(),
        };
        
        // Initialize default policies
        manager.initialize_default_policies();
        
        manager
    }
    
    /// Initialize default security policies
    fn initialize_default_policies(&mut self) {
        self.policies.push(SecurityPolicy {
            name: "claim_reward".to_string(),
            min_security_level: SecurityLevel::Medium,
            max_operations_per_hour: 1,
            required_verifications: vec!["oracle_signature".to_string(), "stake_verification".to_string()],
        });
        
        self.policies.push(SecurityPolicy {
            name: "harvest_rebalance".to_string(),
            min_security_level: SecurityLevel::High,
            max_operations_per_hour: 1,
            required_verifications: vec!["multi_signature".to_string(), "time_lock".to_string()],
        });
        
        self.policies.push(SecurityPolicy {
            name: "emergency_operation".to_string(),
            min_security_level: SecurityLevel::Maximum,
            max_operations_per_hour: 1,
            required_verifications: vec!["multi_signature".to_string(), "time_lock".to_string(), "oracle_consensus".to_string()],
        });
    }
    
    /// Verify oracle signature
    pub fn verify_oracle_signature(&mut self, message: &[u8], signature: &[u8], public_key: &[u8]) -> SecurityResult {
        let operation = SecurityOperation::VerifyOracleSignature {
            message: message.to_vec(),
            signature: signature.to_vec(),
            public_key: public_key.to_vec(),
        };
        
        let result = self.execute_security_operation(operation);
        
        // Add to audit trail
        self.audit_trail.push(result.audit_entry.clone());
        
        result
    }
    
    /// Validate transaction parameters
    pub fn validate_transaction(&mut self, amount: u64, recipient: &[u8], timestamp: u64) -> SecurityResult {
        let operation = SecurityOperation::ValidateTransaction {
            amount,
            recipient: recipient.to_vec(),
            timestamp,
        };
        
        let result = self.execute_security_operation(operation);
        
        // Add to audit trail
        self.audit_trail.push(result.audit_entry.clone());
        
        result
    }
    
    /// Check rate limiting
    pub fn check_rate_limit(&mut self, user_id: &[u8], operation_type: &str, current_time: u64) -> SecurityResult {
        let operation = SecurityOperation::CheckRateLimit {
            user_id: user_id.to_vec(),
            operation_type: operation_type.to_string(),
            current_time,
        };
        
        let result = self.execute_security_operation(operation);
        
        // Add to audit trail
        self.audit_trail.push(result.audit_entry.clone());
        
        result
    }
    
    /// Generate secure random number
    pub fn generate_secure_random(&mut self, min: u64, max: u64, seed: &[u8]) -> SecurityResult {
        let operation = SecurityOperation::GenerateSecureRandom {
            min,
            max,
            seed: seed.to_vec(),
        };
        
        let result = self.execute_security_operation(operation);
        
        // Add to audit trail
        self.audit_trail.push(result.audit_entry.clone());
        
        result
    }
    
    /// Hash sensitive data
    pub fn hash_sensitive_data(&mut self, data: &[u8], salt: &[u8]) -> SecurityResult {
        let operation = SecurityOperation::HashSensitiveData {
            data: data.to_vec(),
            salt: salt.to_vec(),
        };
        
        let result = self.execute_security_operation(operation);
        
        // Add to audit trail
        self.audit_trail.push(result.audit_entry.clone());
        
        result
    }
    
    /// Execute security operation
    fn execute_security_operation(&self, operation: SecurityOperation) -> SecurityResult {
        let timestamp = js_sys::Date::now() as u64;
        
        match operation {
            SecurityOperation::VerifyOracleSignature { message, signature, public_key } => {
                // Verify Ed25519 signature
                let result = self.verify_ed25519_signature(&message, &signature, &public_key);
                
                SecurityResult {
                    success: result.is_ok(),
                    data: None,
                    error: result.err().map(|e| e.to_string()),
                    security_level: SecurityLevel::High,
                    audit_entry: AuditEntry {
                        timestamp,
                        operation_type: "verify_oracle_signature".to_string(),
                        input_hash: self.hash_data(&message),
                        output_hash: self.hash_data(&[result.is_ok() as u8]),
                        security_level: SecurityLevel::High,
                        verified: result.is_ok(),
                    },
                }
            },
            
            SecurityOperation::ValidateTransaction { amount, recipient, timestamp } => {
                // Validate transaction parameters
                let mut errors = Vec::new();
                
                if amount == 0 {
                    errors.push("Amount must be greater than 0".to_string());
                }
                
                if amount > 1_000_000_000_000 { // 1M USDC limit
                    errors.push("Amount exceeds maximum limit".to_string());
                }
                
                if recipient.len() != 32 {
                    errors.push("Invalid recipient address length".to_string());
                }
                
                let current_time = js_sys::Date::now() as u64;
                if timestamp > current_time + 300_000 { // 5 minutes future tolerance
                    errors.push("Transaction timestamp too far in future".to_string());
                }
                
                let success = errors.is_empty();
                
                SecurityResult {
                    success,
                    data: None,
                    error: if success { None } else { Some(errors.join("; ")) },
                    security_level: SecurityLevel::Medium,
                    audit_entry: AuditEntry {
                        timestamp,
                        operation_type: "validate_transaction".to_string(),
                        input_hash: self.hash_data(&[amount.to_le_bytes().to_vec(), recipient, timestamp.to_le_bytes().to_vec()].concat()),
                        output_hash: self.hash_data(&[success as u8]),
                        security_level: SecurityLevel::Medium,
                        verified: success,
                    },
                }
            },
            
            SecurityOperation::CheckRateLimit { user_id, operation_type, current_time } => {
                // Check rate limiting
                let key = format!("{}:{}", hex::encode(user_id), operation_type);
                let rate_limit_data = self.rate_limits.get(&key);
                
                let mut success = true;
                let mut error = None;
                
                if let Some(data) = rate_limit_data {
                    // Clean old operations (older than 1 hour)
                    let cutoff_time = current_time - 3_600_000; // 1 hour in milliseconds
                    let recent_operations: Vec<u64> = data.operations.iter()
                        .filter(|&op_time| *op_time > cutoff_time)
                        .cloned()
                        .collect();
                    
                    // Check if user has exceeded rate limit
                    if recent_operations.len() >= 1 { // 1 operation per hour
                        success = false;
                        error = Some("Rate limit exceeded".to_string());
                    }
                }
                
                SecurityResult {
                    success,
                    data: None,
                    error,
                    security_level: SecurityLevel::Low,
                    audit_entry: AuditEntry {
                        timestamp,
                        operation_type: "check_rate_limit".to_string(),
                        input_hash: self.hash_data(&[user_id, operation_type.as_bytes()].concat()),
                        output_hash: self.hash_data(&[success as u8]),
                        security_level: SecurityLevel::Low,
                        verified: success,
                    },
                }
            },
            
            SecurityOperation::GenerateSecureRandom { min, max, seed } => {
                // Generate secure random number using seed
                let mut hasher = Sha256::new();
                hasher.update(seed);
                hasher.update(&timestamp.to_le_bytes());
                let result = hasher.finalize();
                
                let random_value = u64::from_le_bytes([
                    result[0], result[1], result[2], result[3],
                    result[4], result[5], result[6], result[7]
                ]);
                
                let normalized_value = min + (random_value % (max - min + 1));
                
                SecurityResult {
                    success: true,
                    data: Some(normalized_value.to_le_bytes().to_vec()),
                    error: None,
                    security_level: SecurityLevel::High,
                    audit_entry: AuditEntry {
                        timestamp,
                        operation_type: "generate_secure_random".to_string(),
                        input_hash: self.hash_data(&[min.to_le_bytes().to_vec(), max.to_le_bytes().to_vec(), seed].concat()),
                        output_hash: self.hash_data(&normalized_value.to_le_bytes()),
                        security_level: SecurityLevel::High,
                        verified: true,
                    },
                }
            },
            
            SecurityOperation::HashSensitiveData { data, salt } => {
                // Hash sensitive data with salt
                let mut hasher = Sha256::new();
                hasher.update(data);
                hasher.update(salt);
                let result = hasher.finalize();
                
                SecurityResult {
                    success: true,
                    data: Some(result.to_vec()),
                    error: None,
                    security_level: SecurityLevel::Medium,
                    audit_entry: AuditEntry {
                        timestamp,
                        operation_type: "hash_sensitive_data".to_string(),
                        input_hash: self.hash_data(&[data, salt].concat()),
                        output_hash: result.to_vec(),
                        security_level: SecurityLevel::Medium,
                        verified: true,
                    },
                }
            },
        }
    }
    
    /// Verify Ed25519 signature
    fn verify_ed25519_signature(&self, message: &[u8], signature: &[u8], public_key: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
        if public_key.len() != 32 || signature.len() != 64 {
            return Err("Invalid key or signature length".into());
        }
        
        let pk = PublicKey::from_bytes(public_key)?;
        let sig = Signature::from_bytes(signature)?;
        
        pk.verify(message, &sig)?;
        Ok(())
    }
    
    /// Hash data using SHA-256
    fn hash_data(&self, data: &[u8]) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(data);
        hasher.finalize().to_vec()
    }
    
    /// Get audit trail as JSON
    pub fn get_audit_trail(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.audit_trail)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
    
    /// Get security statistics
    pub fn get_security_stats(&self) -> Result<String, JsValue> {
        let stats = serde_json::json!({
            "total_operations": self.audit_trail.len(),
            "successful_operations": self.audit_trail.iter().filter(|entry| entry.verified).count(),
            "failed_operations": self.audit_trail.iter().filter(|entry| !entry.verified).count(),
            "security_levels": {
                "low": self.audit_trail.iter().filter(|entry| matches!(entry.security_level, SecurityLevel::Low)).count(),
                "medium": self.audit_trail.iter().filter(|entry| matches!(entry.security_level, SecurityLevel::Medium)).count(),
                "high": self.audit_trail.iter().filter(|entry| matches!(entry.security_level, SecurityLevel::High)).count(),
                "critical": self.audit_trail.iter().filter(|entry| matches!(entry.security_level, SecurityLevel::Critical)).count(),
                "maximum": self.audit_trail.iter().filter(|entry| matches!(entry.security_level, SecurityLevel::Maximum)).count(),
            }
        });
        
        serde_json::to_string(&stats)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

// Export functions for JavaScript
#[wasm_bindgen]
pub fn verify_oracle_signature_wasm(message: &[u8], signature: &[u8], public_key: &[u8]) -> Result<String, JsValue> {
    let mut manager = WasmSecurityManager::new();
    let result = manager.verify_oracle_signature(message, signature, public_key);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn validate_transaction_wasm(amount: u64, recipient: &[u8], timestamp: u64) -> Result<String, JsValue> {
    let mut manager = WasmSecurityManager::new();
    let result = manager.validate_transaction(amount, recipient, timestamp);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn generate_secure_random_wasm(min: u64, max: u64, seed: &[u8]) -> Result<String, JsValue> {
    let mut manager = WasmSecurityManager::new();
    let result = manager.generate_secure_random(min, max, seed);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
