//! Cryptographic utilities for the Gaming Rewards Protocol

use rand::{Rng, RngCore};
use rand::rngs::OsRng;
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use pbkdf2::pbkdf2;
use wasm_bindgen::prelude::*;
use crate::error::{GamingRewardsError, GamingRewardsResult};

/// Cryptographic key management
#[derive(Debug, Clone)]
pub struct CryptoKey {
    key: [u8; 32],
    salt: [u8; 32],
}

impl CryptoKey {
    /// Generate a new cryptographic key from a password
    pub fn from_password(password: &str, salt: Option<[u8; 32]>) -> GamingRewardsResult<Self> {
        let salt = salt.unwrap_or_else(|| {
            let mut salt = [0u8; 32];
            OsRng.fill_bytes(&mut salt);
            salt
        });
        
        let mut key = [0u8; 32];
        pbkdf2::<Hmac<Sha256>>(password.as_bytes(), &salt, 100_000, &mut key)
            .map_err(|e| GamingRewardsError::EncryptionError(format!("Key derivation failed: {}", e)))?;
        
        Ok(CryptoKey { key, salt })
    }
    
    /// Generate a random cryptographic key
    pub fn random() -> Self {
        let mut key = [0u8; 32];
        let mut salt = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        OsRng.fill_bytes(&mut salt);
        
        CryptoKey { key, salt }
    }
    
    /// Get the key bytes
    pub fn key_bytes(&self) -> &[u8; 32] {
        &self.key
    }
    
    /// Get the salt bytes
    pub fn salt_bytes(&self) -> &[u8; 32] {
        &self.salt
    }
}

/// Simple XOR-based encryption (for demonstration - not for production)
pub struct SimpleCipher {
    key: Vec<u8>,
}

impl SimpleCipher {
    /// Create a new simple cipher from a key
    pub fn new(key: &CryptoKey) -> Self {
        SimpleCipher {
            key: key.key_bytes().to_vec(),
        }
    }
    
    /// Encrypt data with simple XOR
    pub fn encrypt(&self, data: &[u8]) -> GamingRewardsResult<Vec<u8>> {
        let mut result = Vec::with_capacity(data.len());
        for (i, &byte) in data.iter().enumerate() {
            let key_byte = self.key[i % self.key.len()];
            result.push(byte ^ key_byte);
        }
        Ok(result)
    }
    
    /// Decrypt data with simple XOR
    pub fn decrypt(&self, encrypted_data: &[u8]) -> GamingRewardsResult<Vec<u8>> {
        self.encrypt(encrypted_data) // XOR is symmetric
    }
}

/// Hash utilities
pub struct HashUtils;

impl HashUtils {
    /// Generate SHA-256 hash
    pub fn sha256(data: &[u8]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(data);
        hasher.finalize().into()
    }
    
    /// Generate HMAC-SHA256
    pub fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; 32] {
        let mut mac = Hmac::<Sha256>::new_from_slice(key)
            .expect("HMAC can take key of any size");
        mac.update(data);
        mac.finalize().into_bytes().into()
    }
    
    /// Generate a secure random token
    pub fn random_token(length: usize) -> String {
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let mut rng = OsRng;
        let mut token = String::with_capacity(length);
        
        for _ in 0..length {
            let idx = rng.gen_range(0..CHARSET.len());
            token.push(CHARSET[idx] as char);
        }
        
        token
    }
    
    /// Generate a secure random bytes
    pub fn random_bytes(length: usize) -> Vec<u8> {
        let mut bytes = vec![0u8; length];
        OsRng.fill_bytes(&mut bytes);
        bytes
    }
}

/// Session token generator
pub struct SessionTokenGenerator;

impl SessionTokenGenerator {
    /// Generate a secure session token
    pub fn generate() -> String {
        let token_data = HashUtils::random_bytes(32);
        let timestamp = chrono::Utc::now().timestamp().to_string();
        let combined = format!("{}{}", hex::encode(token_data), timestamp);
        
        HashUtils::sha256(combined.as_bytes())
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>()
    }
    
    /// Validate a session token format
    pub fn validate_format(token: &str) -> bool {
        token.len() == 64 && token.chars().all(|c| c.is_ascii_hexdigit())
    }
}

/// WASM bindings for cryptographic functions
#[wasm_bindgen]
pub struct CryptoManager {
    cipher: SimpleCipher,
    key: CryptoKey,
}

#[wasm_bindgen]
impl CryptoManager {
    #[wasm_bindgen(constructor)]
    pub fn new(password: &str) -> Result<CryptoManager, JsValue> {
        let key = CryptoKey::from_password(password, None)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let cipher = SimpleCipher::new(&key);
        
        Ok(CryptoManager { cipher, key })
    }
    
    /// Encrypt data
    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>, JsValue> {
        self.cipher.encrypt(data)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
    
    /// Decrypt data
    pub fn decrypt(&self, encrypted_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        self.cipher.decrypt(encrypted_data)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
    
    /// Generate a secure random token
    pub fn generate_token(&self, length: usize) -> String {
        HashUtils::random_token(length)
    }
    
    /// Generate a session token
    pub fn generate_session_token(&self) -> String {
        SessionTokenGenerator::generate()
    }
    
    /// Hash data with SHA-256
    pub fn hash_sha256(&self, data: &[u8]) -> String {
        let hash = HashUtils::sha256(data);
        hex::encode(hash)
    }
    
    /// Generate HMAC-SHA256
    pub fn hmac_sha256(&self, key: &[u8], data: &[u8]) -> String {
        let hmac = HashUtils::hmac_sha256(key, data);
        hex::encode(hmac)
    }
}

/// Secure random number generator for WASM
#[wasm_bindgen]
pub struct SecureRandom;

#[wasm_bindgen]
impl SecureRandom {
    /// Generate random bytes
    pub fn random_bytes(length: usize) -> Vec<u8> {
        HashUtils::random_bytes(length)
    }
    
    /// Generate random token
    pub fn random_token(length: usize) -> String {
        HashUtils::random_token(length)
    }
    
    /// Generate random number between min and max
    pub fn random_number(min: u32, max: u32) -> u32 {
        let mut rng = OsRng;
        rng.gen_range(min..=max)
    }
    
    /// Generate random float between 0.0 and 1.0
    pub fn random_float() -> f64 {
        let mut rng = OsRng;
        rng.gen::<f64>()
    }
}

/// Password hashing utilities
pub struct PasswordHasher;

impl PasswordHasher {
    /// Hash a password with PBKDF2
    pub fn hash_password(password: &str) -> GamingRewardsResult<String> {
        let salt = HashUtils::random_bytes(32);
        let mut hash = [0u8; 32];
        
        pbkdf2::<Hmac<Sha256>>(password.as_bytes(), &salt, 100_000, &mut hash)
            .map_err(|e| GamingRewardsError::EncryptionError(format!("Password hashing failed: {}", e)))?;
        
        let combined = [salt.as_slice(), &hash].concat();
        Ok(hex::encode(combined))
    }
    
    /// Verify a password against a hash
    pub fn verify_password(password: &str, hash_hex: &str) -> GamingRewardsResult<bool> {
        let combined = hex::decode(hash_hex)
            .map_err(|e| GamingRewardsError::DecryptionError(format!("Invalid hash format: {}", e)))?;
        
        if combined.len() != 64 {
            return Err(GamingRewardsError::DecryptionError("Invalid hash length".to_string()));
        }
        
        let salt = &combined[..32];
        let stored_hash = &combined[32..];
        
        let mut computed_hash = [0u8; 32];
        pbkdf2::<Hmac<Sha256>>(password.as_bytes(), salt, 100_000, &mut computed_hash)
            .map_err(|e| GamingRewardsError::EncryptionError(format!("Password verification failed: {}", e)))?;
        
        Ok(computed_hash == stored_hash)
    }
}

#[wasm_bindgen]
impl PasswordHasher {
    /// Hash a password (WASM binding)
    pub fn hash_password_wasm(password: &str) -> Result<String, JsValue> {
        Self::hash_password(password)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
    
    /// Verify a password (WASM binding)
    pub fn verify_password_wasm(password: &str, hash: &str) -> Result<bool, JsValue> {
        Self::verify_password(password, hash)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_encryption_decryption() {
        let key = CryptoKey::random();
        let cipher = SimpleCipher::new(&key);
        let data = b"Hello, World!";
        
        let encrypted = cipher.encrypt(data).unwrap();
        let decrypted = cipher.decrypt(&encrypted).unwrap();
        
        assert_eq!(data, decrypted.as_slice());
    }
    
    #[test]
    fn test_password_hashing() {
        let password = "my_secure_password";
        let hash = PasswordHasher::hash_password(password).unwrap();
        
        assert!(PasswordHasher::verify_password(password, &hash).unwrap());
        assert!(!PasswordHasher::verify_password("wrong_password", &hash).unwrap());
    }
    
    #[test]
    fn test_session_token_generation() {
        let token1 = SessionTokenGenerator::generate();
        let token2 = SessionTokenGenerator::generate();
        
        assert_eq!(token1.len(), 64);
        assert_eq!(token2.len(), 64);
        assert_ne!(token1, token2);
        assert!(SessionTokenGenerator::validate_format(&token1));
        assert!(SessionTokenGenerator::validate_format(&token2));
    }
}
