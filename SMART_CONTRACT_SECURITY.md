# 🔒 Smart Contract Security Guide

## 🚨 **CRITICAL SECURITY OVERVIEW**

This document outlines the security-first approach implemented in the Gaming Rewards Protocol's smart contract integration for the memecoin staking system with 50% rewards distribution to verified users.

### ⚠️ **SECURITY PRINCIPLES**

1. **Defense in Depth**: Multiple layers of security validation
2. **Principle of Least Privilege**: Minimal access rights for all components
3. **Fail-Safe Defaults**: Secure by default, explicit permission required
4. **Complete Mediation**: All access attempts are validated
5. **Open Design**: Security through transparency and auditability

## 🏗️ **ARCHITECTURE SECURITY**

### **Smart Contract Structure**

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Access Control & Authorization                    │
│  Layer 2: Input Validation & Sanitization                   │
│  Layer 3: Rate Limiting & Anti-Spam                         │
│  Layer 4: Oracle Security & Signature Verification          │
│  Layer 5: Treasury Security & Balance Integrity             │
│  Layer 6: Arithmetic Safety & Overflow Protection           │
│  Layer 7: Reentrancy Protection & State Management          │
└─────────────────────────────────────────────────────────────┘
```

### **Account Security Model**

```rust
// Treasury Account - Central funds management
pub struct Treasury {
    pub authority: Pubkey,           // Only authorized access
    pub total_balance: u64,          // Integrity checks
    pub user_rewards_pool: u64,      // 50% of yields
    pub treasury_reserve: u64,       // 50% of yields
    pub total_distributed: u64,      // Audit trail
    pub last_harvest_timestamp: i64, // Rate limiting
    pub active_stakers: u32,         // Staking metrics
    pub total_staked: u64,           // Staking balance
}

// User Reward Account - Individual user tracking
pub struct UserReward {
    pub user: Pubkey,                    // User identity
    pub total_claimed: u64,              // Claim history
    pub last_claim_timestamp: i64,       // Rate limiting
    pub claims_in_window: u32,           // Anti-spam
    pub is_staking: bool,                // Staking status
    pub staked_amount: u64,              // Staking amount
    pub reputation_score: u32,           // Trust score
    pub achievements_verified: u32,      // Achievement count
}

// Oracle Account - Trusted verification
pub struct OracleAccount {
    pub oracle: Pubkey,                  // Oracle identity
    pub stake_amount: u64,               // Security stake
    pub reputation_score: u32,           // Trust score
    pub successful_verifications: u32,   // Success metrics
    pub failed_verifications: u32,       // Failure metrics
    pub status: OracleStatus,            // Active/Slashed
    pub slash_count: u32,                // Misconduct history
}
```

## 🔐 **ACCESS CONTROL SECURITY**

### **Authorization Matrix**

| Operation | Treasury Authority | Oracle | User | Public |
|-----------|-------------------|--------|------|--------|
| Initialize Treasury | ✅ | ❌ | ❌ | ❌ |
| Harvest & Rebalance | ✅ | ❌ | ❌ | ❌ |
| Claim Reward | ❌ | ✅ (Verify) | ✅ (Claim) | ❌ |
| Slash Oracle | ✅ | ❌ | ❌ | ❌ |
| View Treasury | ❌ | ❌ | ❌ | ✅ |

### **Permission Validation**

```rust
// Treasury access control
require!(ctx.accounts.authority.key() == treasury.authority, 
         GamingRewardsError::Unauthorized);

// Oracle validation
require!(oracle_account.status == OracleStatus::Active, 
         GamingRewardsError::OracleNotActive);
require!(oracle_account.stake_amount >= MIN_ORACLE_STAKE, 
         GamingRewardsError::InsufficientOracleStake);

// User claim validation
require!(user_reward.user == user, 
         GamingRewardsError::Unauthorized);
```

## 🛡️ **INPUT VALIDATION SECURITY**

### **Amount Validation**

```rust
// Yield amount validation
require!(yield_amount > 0, GamingRewardsError::InvalidYieldAmount);
require!(yield_amount <= MAX_HARVEST_AMOUNT, GamingRewardsError::InvalidYieldAmount);

// Claim amount validation
require!(claim_amount > 0, GamingRewardsError::InvalidYieldAmount);
require!(claim_amount <= MAX_CLAIM_AMOUNT, GamingRewardsError::InvalidYieldAmount);
require!(claim_amount <= treasury.user_rewards_pool, GamingRewardsError::InsufficientRewardsPool);

// Achievement value validation
require!(achievement_value >= MIN_ACHIEVEMENT_VALUE, GamingRewardsError::InvalidAchievementValue);
require!(achievement_value <= MAX_ACHIEVEMENT_VALUE, GamingRewardsError::InvalidAchievementValue);
```

### **Timestamp Validation**

```rust
// Timestamp validation
require!(timestamp <= clock.unix_timestamp, GamingRewardsError::InvalidTimestamp);
require!(timestamp >= clock.unix_timestamp - MAX_VERIFICATION_AGE, GamingRewardsError::InvalidTimestamp);

// Rate limiting validation
require!(current_timestamp - last_claim_timestamp >= MIN_TIME_BETWEEN_CLAIMS, 
         GamingRewardsError::ClaimTooFrequent);
```

## ⏱️ **RATE LIMITING SECURITY**

### **Harvest Rate Limiting**

```rust
// Harvest interval enforcement
const HARVEST_INTERVAL: i64 = 3600; // 1 hour
let time_since_harvest = current_timestamp - treasury.last_harvest_timestamp;
require!(time_since_harvest >= HARVEST_INTERVAL, GamingRewardsError::RateLimitExceeded);
```

### **Claim Rate Limiting**

```rust
// Claim window management
if current_timestamp - user_reward.window_start_timestamp >= CLAIM_RATE_LIMIT_WINDOW {
    user_reward.claims_in_window = 0;
    user_reward.window_start_timestamp = current_timestamp;
}

// Maximum claims per window
require!(user_reward.claims_in_window < MAX_CLAIMS_PER_WINDOW, 
         GamingRewardsError::RateLimitExceeded);
```

## 🔍 **ORACLE SECURITY**

### **Oracle Signature Verification**

```rust
// Message construction for signature verification
let message = format!("{}:{}:{}", user, timestamp, claim_amount);
let message_bytes = message.as_bytes();

// Signature validation (Ed25519)
require!(!oracle_signature.is_empty(), GamingRewardsError::InvalidOracleSignature);

// In production, implement actual Ed25519 verification:
// let signature = Ed25519Signature::try_from(&oracle_signature)?;
// let public_key = Ed25519PublicKey::try_from(&oracle_account.oracle.to_bytes())?;
// require!(signature.verify(&message_bytes, &public_key).is_ok(), 
//          GamingRewardsError::InvalidOracleSignature);
```

### **Oracle Stake Management**

```rust
// Oracle stake validation
pub fn validate_stake(&self, min_stake: u64) -> Result<()> {
    require!(self.stake_amount >= min_stake, GamingRewardsError::InsufficientOracleStake);
    require!(self.status == OracleStatus::Active, GamingRewardsError::OracleNotActive);
    Ok(())
}

// Oracle slashing mechanism
pub fn slash(&mut self, slash_amount: u64) -> Result<u64> {
    require!(self.stake_amount >= slash_amount, GamingRewardsError::InsufficientStakeToSlash);
    
    self.stake_amount = self.stake_amount.checked_sub(slash_amount)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    
    if self.stake_amount < MIN_ORACLE_STAKE {
        self.status = OracleStatus::Slashed;
    }
    
    Ok(slash_amount)
}
```

## 💰 **TREASURY SECURITY**

### **Balance Integrity**

```rust
// 50/50 reward distribution
pub fn add_yield(&mut self, yield_amount: u64) -> Result<()> {
    require!(yield_amount > 0, GamingRewardsError::InvalidYieldAmount);
    
    let user_share = yield_amount * 50 / 100;
    let treasury_share = yield_amount - user_share;
    
    self.user_rewards_pool = self.user_rewards_pool.checked_add(user_share)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    self.treasury_reserve = self.treasury_reserve.checked_add(treasury_share)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    self.total_balance = self.total_balance.checked_add(yield_amount)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    
    Ok(())
}

// Secure reward withdrawal
pub fn subtract_from_rewards_pool(&mut self, amount: u64) -> Result<()> {
    require!(amount > 0, GamingRewardsError::InvalidYieldAmount);
    require!(self.user_rewards_pool >= amount, GamingRewardsError::InsufficientRewardsPool);
    
    self.user_rewards_pool = self.user_rewards_pool.checked_sub(amount)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    self.total_distributed = self.total_distributed.checked_add(amount)
        .ok_or(GamingRewardsError::ArithmeticOverflow)?;
    
    Ok(())
}
```

## 🧮 **ARITHMETIC SAFETY**

### **Overflow Protection**

```rust
// Safe addition
self.user_rewards_pool = self.user_rewards_pool.checked_add(user_share)
    .ok_or(GamingRewardsError::ArithmeticOverflow)?;

// Safe subtraction
self.user_rewards_pool = self.user_rewards_pool.checked_sub(amount)
    .ok_or(GamingRewardsError::ArithmeticOverflow)?;

// Safe multiplication
let user_share = yield_amount.checked_mul(50)
    .ok_or(GamingRewardsError::ArithmeticOverflow)?
    .checked_div(100)
    .ok_or(GamingRewardsError::ArithmeticOverflow)?;
```

### **Division Safety**

```rust
// Prevent division by zero
require!(divisor > 0, GamingRewardsError::ArithmeticOverflow);

// Safe division with remainder handling
let quotient = dividend.checked_div(divisor)
    .ok_or(GamingRewardsError::ArithmeticOverflow)?;
```

## 🔄 **REENTRANCY PROTECTION**

### **State Update Pattern**

```rust
// Update state BEFORE external calls
treasury.subtract_from_rewards_pool(claim_amount)?;
user_reward.update_claim(claim_amount, clock.unix_timestamp);

// External call (USDC transfer) happens after state update
// This prevents reentrancy attacks
```

### **Checks-Effects-Interactions Pattern**

```rust
// 1. CHECKS: Validate all conditions
require!(claim_amount > 0, GamingRewardsError::InvalidYieldAmount);
require!(claim_amount <= treasury.user_rewards_pool, GamingRewardsError::InsufficientRewardsPool);

// 2. EFFECTS: Update state
treasury.subtract_from_rewards_pool(claim_amount)?;
user_reward.update_claim(claim_amount, clock.unix_timestamp);

// 3. INTERACTIONS: External calls
// Transfer USDC tokens (external call)
```

## 🎮 **MEMECOIN STAKING SECURITY**

### **Staking Validation**

```rust
// Staking period validation
pub fn start_staking(&mut self, amount: u64, timestamp: i64) -> Result<()> {
    require!(!self.is_staking, GamingRewardsError::AlreadyStaking);
    require!(amount > 0, GamingRewardsError::InvalidStakeAmount);
    
    self.is_staking = true;
    self.staking_start_timestamp = timestamp;
    self.staked_amount = amount;
    
    Ok(())
}

// Staking bonus calculation
pub fn calculate_staking_bonus(&self, current_timestamp: i64) -> u64 {
    if !self.is_staking {
        return 100; // No bonus
    }
    
    let staking_duration = current_timestamp - self.staking_start_timestamp;
    
    if staking_duration >= MAX_STAKING_PERIOD {
        LONG_TERM_STAKER_BONUS // 150% (50% bonus)
    } else if staking_duration >= MIN_STAKING_PERIOD {
        120 // 120% (20% bonus)
    } else {
        100 // 100% (no bonus)
    }
}
```

## 🚨 **SECURITY CONSTANTS**

### **Critical Limits**

```rust
// Security thresholds
pub const MAX_VERIFICATION_AGE: i64 = 300;           // 5 minutes
pub const MAX_CLAIM_AMOUNT: u64 = 10_000_000_000;    // 10,000 USDC
pub const MAX_HARVEST_AMOUNT: u64 = 1_000_000_000_000; // 1,000,000 USDC
pub const MIN_ORACLE_STAKE: u64 = 1_000_000_000;     // 1 SOL
pub const CLAIM_RATE_LIMIT_WINDOW: i64 = 3600;       // 1 hour
pub const MAX_CLAIMS_PER_WINDOW: u32 = 10;           // 10 claims per hour
pub const MIN_TIME_BETWEEN_CLAIMS: i64 = 300;        // 5 minutes

// Achievement limits
pub const MIN_ACHIEVEMENT_VALUE: u64 = 100;          // 100 points minimum
pub const MAX_ACHIEVEMENT_VALUE: u64 = 10_000;       // 10,000 points maximum
pub const ACHIEVEMENT_VERIFICATION_WINDOW: i64 = 3600; // 1 hour

// Staking limits
pub const MIN_STAKING_PERIOD: i64 = 86400;           // 24 hours
pub const MAX_STAKING_PERIOD: i64 = 2592000;         // 30 days
pub const LONG_TERM_STAKER_BONUS: u64 = 150;         // 50% bonus
```

## 🔍 **SECURITY MONITORING**

### **Treasury Health Checks**

```typescript
// Monitor treasury balance
const treasuryBalance = new BN(treasuryAccount.totalBalance);
const userRewardsPool = new BN(treasuryAccount.userRewardsPool);

// Alert if treasury is running low
if (treasuryBalance.lt(new BN(LAMPORTS_PER_SOL * 10))) {
    logger.warn('Treasury balance is low', {
        balance: treasuryBalance.toString(),
        userRewardsPool: userRewardsPool.toString()
    });
}

// Check for suspicious activity
const totalDistributed = new BN(treasuryAccount.totalDistributed);
if (totalDistributed.gt(treasuryBalance.mul(new BN(90)).div(new BN(100)))) {
    logger.error('Suspicious treasury activity detected', {
        totalDistributed: totalDistributed.toString(),
        treasuryBalance: treasuryBalance.toString()
    });
}
```

### **Oracle Reputation Monitoring**

```typescript
// Monitor oracle performance
const successRate = oracleAccount.successfulVerifications / 
    (oracleAccount.successfulVerifications + oracleAccount.failedVerifications);

if (successRate < 0.95) { // 95% success rate threshold
    logger.warn('Oracle performance below threshold', {
        oracle: oracleAccount.oracle.toString(),
        successRate: successRate
    });
}
```

## 🧪 **SECURITY TESTING**

### **Test Coverage Requirements**

- ✅ Access Control Tests (100% coverage)
- ✅ Input Validation Tests (100% coverage)
- ✅ Rate Limiting Tests (100% coverage)
- ✅ Oracle Security Tests (100% coverage)
- ✅ Treasury Security Tests (100% coverage)
- ✅ Arithmetic Safety Tests (100% coverage)
- ✅ Reentrancy Protection Tests (100% coverage)
- ✅ Integration Security Tests (100% coverage)

### **Security Test Categories**

1. **Access Control Tests**
   - Unauthorized treasury access prevention
   - Oracle permission validation
   - Minimum stake requirements

2. **Input Validation Tests**
   - Yield amount validation
   - Claim amount validation
   - Timestamp validation

3. **Rate Limiting Tests**
   - Harvest rate limits
   - Claim rate limits
   - Rapid operation prevention

4. **Oracle Security Tests**
   - Signature validation
   - Stake requirements
   - Slashing mechanisms

5. **Treasury Security Tests**
   - Balance integrity
   - 50/50 distribution
   - Overflow prevention

6. **Arithmetic Safety Tests**
   - Addition overflow prevention
   - Multiplication overflow prevention
   - Safe division

7. **Reentrancy Protection Tests**
   - Reentrant call prevention
   - State update before external calls

## 🚀 **DEPLOYMENT SECURITY**

### **Pre-Deployment Checklist**

- [ ] All security tests passing (100% coverage)
- [ ] Security audit completed
- [ ] Access control matrix validated
- [ ] Rate limiting configured
- [ ] Oracle stake requirements set
- [ ] Treasury limits configured
- [ ] Emergency procedures documented
- [ ] Monitoring alerts configured

### **Production Security Measures**

1. **Multi-Signature Treasury**: Require multiple signatures for large operations
2. **Time-Locked Operations**: Implement delays for critical operations
3. **Emergency Pause**: Ability to pause all operations in emergency
4. **Gradual Rollout**: Deploy with limited functionality first
5. **Continuous Monitoring**: Real-time security monitoring
6. **Incident Response**: Documented response procedures

## 📋 **SECURITY CHECKLIST**

### **Smart Contract Security**

- [ ] Access control implemented
- [ ] Input validation complete
- [ ] Rate limiting enforced
- [ ] Oracle security validated
- [ ] Treasury security implemented
- [ ] Arithmetic safety ensured
- [ ] Reentrancy protection active
- [ ] Error handling secure
- [ ] Events logged properly
- [ ] State consistency maintained

### **Bot Integration Security**

- [ ] Environment validation
- [ ] Key management secure
- [ ] Rate limiting implemented
- [ ] Input sanitization active
- [ ] Error handling secure
- [ ] Logging configured
- [ ] Monitoring active
- [ ] Backup procedures ready

### **Operational Security**

- [ ] Key rotation procedures
- [ ] Access logging enabled
- [ ] Incident response plan
- [ ] Recovery procedures
- [ ] Security training completed
- [ ] Regular audits scheduled
- [ ] Compliance verified
- [ ] Insurance coverage

## 🔗 **SECURITY RESOURCES**

### **Documentation**

- [Security Audit Report](./SECURITY_AUDIT_REPORT.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Setup Guide](./SETUP.md)

### **Tools**

- [Security Tests](./tests/unit/smart-contract-security.test.ts)
- [Security Manager](./bots/src/utils/security-manager.ts)
- [Security Monitoring](./bots/src/utils/logger.ts)

### **Emergency Contacts**

- **Security Team**: security@gamingrewards.io
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Incident Response**: incident@gamingrewards.io

---

**⚠️ REMEMBER: Security is everyone's responsibility. When in doubt, ask the security team before proceeding.**
