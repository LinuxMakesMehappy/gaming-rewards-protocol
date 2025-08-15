# Gaming Rewards Protocol - Testing Guide

## 🧪 **Complete Testing Framework**

This guide will walk you through testing every component of the Gaming Rewards Protocol, from unit tests to production deployment validation.

## **Quick Start Testing**

### **1. Run All Tests (Recommended)**
```bash
# Make test runner executable
chmod +x test/run-tests.sh

# Run complete test suite
./test/run-tests.sh all
```

### **2. Run Specific Test Types**
```bash
# Unit tests only
./test/run-tests.sh unit

# Integration tests only
./test/run-tests.sh integration

# Security tests only
./test/run-tests.sh security

# Performance tests only
./test/run-tests.sh performance

# Smart contract tests only
./test/run-tests.sh contracts

# Coverage analysis only
./test/run-tests.sh coverage
```

## **Test Types Overview**

### **🔬 Unit Tests**
- **Purpose**: Test individual functions and components in isolation
- **Coverage**: Core business logic, validation, security features
- **Files**: `test/core.test.ts`, `test/validation.test.ts`, etc.
- **Duration**: 30-60 seconds

### **🔗 Integration Tests**
- **Purpose**: Test how components work together
- **Coverage**: API interactions, database operations, external services
- **Files**: `test/integration.test.ts`
- **Duration**: 2-5 minutes

### **🛡️ Security Tests**
- **Purpose**: Validate security measures and vulnerability prevention
- **Coverage**: Input validation, authentication, authorization, fraud detection
- **Files**: `test/security.test.ts`
- **Duration**: 1-3 minutes

### **⚡ Performance Tests**
- **Purpose**: Ensure system meets performance requirements
- **Coverage**: Response times, throughput, resource usage
- **Files**: `test/performance.test.ts`
- **Duration**: 5-10 minutes

### **📜 Smart Contract Tests**
- **Purpose**: Validate Solana smart contract functionality
- **Coverage**: Contract logic, state management, security
- **Files**: `test/contracts.test.ts`
- **Duration**: 3-7 minutes

## **Detailed Testing Walkthrough**

### **Step 1: Prerequisites Check**

Before running tests, ensure you have:

```bash
# Check Node.js version (18+ required)
node --version

# Check Rust installation
cargo --version

# Check Solana CLI (optional for contract tests)
solana --version

# Check Anchor CLI (optional for contract tests)
anchor --version
```

### **Step 2: Environment Setup**

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure test environment variables
nano .env
```

**Required Test Environment Variables:**
```env
# Test Configuration
NODE_ENV=test
TEST_MODE=integration

# Solana Test Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com

# Test API Keys (use test keys)
STEAM_API_KEY=test-steam-key
JUPITER_API_KEY=test-jupiter-key

# Test Security Configuration
MAX_FRAUD_SCORE=80
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_WINDOW=100
```

### **Step 3: Running Core Module Tests**

```bash
# Navigate to core module
cd core

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- core.test.ts

# Run tests in watch mode
npm run test:watch
```

**Expected Output:**
```
✅ GamingRewardsCore
  ✅ Initialization
    ✅ should initialize successfully
    ✅ should handle initialization errors gracefully
  ✅ User Registration
    ✅ should register a valid user successfully
    ✅ should reject invalid Steam ID
    ✅ should reject suspicious users
  ✅ Achievement Processing
    ✅ should process valid achievement successfully
    ✅ should reject unregistered users
  ✅ Security Features
    ✅ should enforce rate limiting
    ✅ should validate input sanitization
    ✅ should detect fraud patterns

Test Results: 15 passed, 0 failed
Coverage: 92.5%
```

### **Step 4: Running Smart Contract Tests**

```bash
# Navigate to contracts directory
cd contracts

# Build contracts
anchor build

# Run contract tests
anchor test

# Run specific test
anchor test --skip-local-validator

# Run with verbose output
anchor test --verbose
```

**Expected Output:**
```
✅ Gaming Rewards Protocol Smart Contracts
  ✅ Protocol Initialization
    ✅ should initialize protocol successfully
    ✅ should reject initialization with invalid config
  ✅ User Registration
    ✅ should register user successfully
    ✅ should reject invalid Steam ID
  ✅ Achievement Processing
    ✅ should process achievement successfully
    ✅ should reject processing when protocol is paused

Test Results: 8 passed, 0 failed
```

### **Step 5: Running Security Tests**

```bash
# Run security audit
npm audit --audit-level=moderate

# Run custom security tests
npm run test:security

# Run vulnerability scan (if Snyk installed)
snyk test
```

**Security Test Categories:**
- **Input Validation**: XSS, SQL injection, buffer overflow
- **Authentication**: Session management, token validation
- **Authorization**: Role-based access control
- **Fraud Detection**: Pattern recognition, anomaly detection
- **Rate Limiting**: Request throttling, abuse prevention

### **Step 6: Running Performance Tests**

```bash
# Run performance benchmarks
npm run test:performance

# Run load tests (if Artillery installed)
artillery run test/load-test.yml

# Run stress tests
npm run test:stress
```

**Performance Metrics:**
- **Response Time**: < 2 seconds for API calls
- **Throughput**: > 100 requests/second
- **Memory Usage**: < 512MB for core operations
- **CPU Usage**: < 80% under load

## **Test Results Interpretation**

### **✅ Passing Tests**
```
✅ Test Name
  - All assertions passed
  - Expected behavior confirmed
  - No errors or warnings
```

### **❌ Failing Tests**
```
❌ Test Name
  - Assertion failed: expected X but got Y
  - Error: Specific error message
  - Stack trace for debugging
```

### **⚠️ Warning Tests**
```
⚠️ Test Name
  - Test passed but with warnings
  - Performance below threshold
  - Security concerns detected
```

## **Test Coverage Analysis**

### **Coverage Report Example**
```
Coverage Summary:
├── Statements: 92.5%
├── Branches: 88.3%
├── Functions: 95.1%
└── Lines: 91.8%

Threshold: 80% ✅ PASSED
```

### **Coverage Categories**
- **Statements**: Individual code statements executed
- **Branches**: Conditional logic paths taken
- **Functions**: Functions called during testing
- **Lines**: Lines of code executed

## **Debugging Failed Tests**

### **1. Check Test Logs**
```bash
# View detailed test output
npm test -- --verbose

# Save test output to file
npm test > test.log 2>&1

# View specific test file
npm test -- core.test.ts --verbose
```

### **2. Debug Smart Contract Tests**
```bash
# Run with debug logging
anchor test --verbose

# Check contract logs
anchor logs

# Debug specific instruction
anchor test --skip-local-validator -- --nocapture
```

### **3. Common Test Issues**

#### **Network Timeout**
```bash
# Increase timeout for slow tests
npm test -- --timeout=30000

# Use local testnet
solana config set --url localhost
```

#### **Environment Issues**
```bash
# Reset test environment
rm -rf node_modules
npm install

# Clear test cache
npm test -- --clearCache
```

#### **Contract Build Issues**
```bash
# Clean and rebuild
anchor clean
anchor build

# Update Anchor version
avm install latest
avm use latest
```

## **Continuous Integration Testing**

### **GitHub Actions Example**
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-rust@v1
      - run: chmod +x test/run-tests.sh
      - run: ./test/run-tests.sh all
```

### **Pre-commit Hooks**
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

## **Production Testing Checklist**

### **Before Deployment**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Smart contract tests pass
- [ ] Coverage above 80%
- [ ] Zero security vulnerabilities
- [ ] Load testing completed

### **Post-Deployment**
- [ ] Monitor application logs
- [ ] Check error rates
- [ ] Validate transaction success rates
- [ ] Monitor performance metrics
- [ ] Security monitoring active
- [ ] Backup systems verified

## **Test Maintenance**

### **Adding New Tests**
```typescript
// Example: Adding a new unit test
describe('New Feature', () => {
  it('should handle new functionality', async () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = await newFeature.process(input);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

### **Updating Test Data**
```typescript
// Update test data in test-setup.ts
export class TestDataFactory {
  static createNewTestData() {
    return {
      // Updated test data
    };
  }
}
```

### **Test Documentation**
- Keep test descriptions clear and descriptive
- Document complex test scenarios
- Update tests when features change
- Maintain test data consistency

## **Performance Testing Scenarios**

### **Load Testing**
```bash
# Simulate 100 concurrent users
artillery run test/load-test.yml

# Test specific endpoints
artillery run test/api-load-test.yml
```

### **Stress Testing**
```bash
# Test system limits
npm run test:stress

# Monitor resource usage
npm run test:stress -- --monitor
```

### **Endurance Testing**
```bash
# Run tests for extended period
npm run test:endurance -- --duration=3600
```

## **Security Testing Scenarios**

### **Penetration Testing**
```bash
# Run security scan
npm run test:security

# Test specific vulnerabilities
npm run test:security -- --vulnerability=xss
```

### **Authentication Testing**
```bash
# Test authentication flows
npm run test:auth

# Test session management
npm run test:session
```

## **Troubleshooting Guide**

### **Common Issues**

#### **Test Environment Issues**
```bash
# Reset test environment
rm -rf node_modules package-lock.json
npm install

# Clear test cache
npm test -- --clearCache
```

#### **Contract Testing Issues**
```bash
# Reset Solana test validator
pkill -f solana-test-validator
solana-test-validator

# Reset Anchor test environment
anchor clean
anchor build
```

#### **Performance Test Issues**
```bash
# Increase system limits
ulimit -n 65536

# Monitor system resources
htop
```

## **Test Reporting**

### **Generate Test Report**
```bash
# Generate comprehensive report
./test/run-tests.sh all

# View report
cat test-results/report-*.md
```

### **Report Contents**
- Test execution summary
- Coverage analysis
- Security audit results
- Performance benchmarks
- Recommendations
- Next steps

## **Best Practices**

### **Test Writing**
- Write tests before implementing features (TDD)
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated
- Mock external dependencies

### **Test Organization**
- Group related tests in describe blocks
- Use consistent naming conventions
- Maintain test data factories
- Keep test utilities reusable

### **Test Maintenance**
- Update tests when features change
- Remove obsolete tests
- Maintain test documentation
- Regular test review and cleanup

---

## **Next Steps**

1. **Run the complete test suite**: `./test/run-tests.sh all`
2. **Review test results**: Check `test-results/` directory
3. **Fix any failing tests**: Address issues before deployment
4. **Improve coverage**: Add tests for uncovered code paths
5. **Deploy to devnet**: Test in staging environment
6. **Conduct security audit**: Professional security review
7. **Deploy to mainnet**: Production deployment

**Remember**: Comprehensive testing is crucial for a secure and reliable Gaming Rewards Protocol. Always run tests before any deployment!
