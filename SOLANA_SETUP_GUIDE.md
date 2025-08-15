# 🚀 Solana Setup Guide - Gaming Rewards Protocol

## ✅ **Current Status**

Great news! We've successfully:
- ✅ **Installed Solana CLI** (version 1.17.0)
- ✅ **Created a keypair** for testing
- ✅ **Configured Solana** to use localhost
- ✅ **All basic tests passing** (12/12)

## 🔧 **Next Steps: Start Local Validator**

### **Step 1: Start Solana Test Validator**

Open a **new PowerShell window** and run:

```powershell
# Navigate to your project
cd D:\Kiro\project_13

# Start the local validator (this will run continuously)
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
```

**Expected Output:**
```
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Genesis Hash: 4uhcVJrU6wqKJ5yJDEUvPjAqSckC13qk7rE4xwPxtf7V
Version: 1.17.0
Shred Version: 0x00000000
Gossip Address: 127.0.0.1:1024
TPU Address: 127.0.0.1:1027
JSON RPC URL: http://127.0.0.1:8899
WebSocket URL: ws://127.0.0.1:8900/
```

### **Step 2: Test the Connection**

In a **second PowerShell window**, run:

```powershell
# Set environment variable
$env:SOLANA_RPC_URL="http://localhost:8899"

# Test connection
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana.exe balance

# Expected output: "0 SOL"
```

### **Step 3: Run Full Test Suite**

Once the validator is running, in your **main PowerShell window**:

```powershell
# Set environment variable
$env:SOLANA_RPC_URL="http://localhost:8899"

# Run all tests
npm test

# Or run specific test categories
npm run test:coverage
```

## 🎯 **What You Should See**

### **✅ Working Tests (Already Confirmed)**
```
✅ Basic Test Suite (12/12 passing)
├── Configuration validation
├── Data generation and validation
├── Steam ID format validation
├── Reward amount validation
├── Fraud score validation
├── Mock data generation
├── Performance testing utilities
└── Security testing utilities
```

### **⏳ Tests That Will Work Once Validator is Running**
```
✅ Core & Contract Tests (Should pass with local validator)
├── Smart contract initialization
├── User registration
├── Achievement processing
├── Staking operations
├── Emergency controls
└── Security features
```

## 🛠️ **Troubleshooting**

### **Validator Won't Start**
```powershell
# Try with different options
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe --rpc-port 8899 --no-bpf-jit

# Or check if port is in use
netstat -an | findstr :8899
```

### **Connection Refused**
```powershell
# Wait longer for validator to start (can take 30+ seconds)
Start-Sleep -Seconds 30

# Check if validator is running
Get-Process | Where-Object {$_.ProcessName -like "*solana*"}
```

### **Permission Issues**
```powershell
# Run PowerShell as Administrator
# Or try running from a different directory
cd C:\temp
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
```

## 📊 **Expected Test Results**

Once everything is set up correctly, you should see:

```
✅ All Tests Passing
├── Basic Tests: 12/12 ✅
├── Core Tests: 26/26 ✅
├── Contract Tests: 18/18 ✅
└── Total: 56/56 ✅

Coverage Report:
├── Statements: >80%
├── Branches: >70%
├── Functions: >85%
└── Lines: >80%
```

## 🎉 **Success Checklist**

- [ ] **Solana CLI installed** ✅
- [ ] **Keypair created** ✅
- [ ] **Configuration set** ✅
- [ ] **Local validator running** ⏳
- [ ] **Connection tested** ⏳
- [ ] **All tests passing** ⏳

## 🚀 **Next Actions**

1. **Start the validator** in a new PowerShell window
2. **Test the connection** in a second window
3. **Run the full test suite** in your main window
4. **Review test results** and coverage report

## 💡 **Pro Tips**

- **Keep the validator running** while testing - it needs to stay active
- **Use separate PowerShell windows** for validator and testing
- **Wait 30+ seconds** after starting validator before testing
- **Check the validator logs** if tests fail: `test-ledger/validator.log`

## 🎯 **What This Enables**

With the local validator running, you can:
- ✅ **Test smart contracts** on-chain
- ✅ **Validate transactions** and state changes
- ✅ **Test Jupiter integration** with real Solana environment
- ✅ **Run end-to-end tests** of the complete protocol
- ✅ **Debug contract issues** with full logging

**Ready to start the validator and run the full test suite!** 🚀
