# 🚀 Quick Start: Solana Validator

## ✅ **Current Status**
- ✅ Solana CLI installed (v1.17.0)
- ✅ Keypair created with passphrase
- ✅ Basic tests passing (12/12)
- ⏳ Validator needs to be started

## 🔧 **Start Validator (3 Simple Steps)**

### **Step 1: Open New PowerShell Window**
Open a **new PowerShell window** (keep this one open for testing)

### **Step 2: Start Validator**
In the new window, run:
```powershell
cd D:\Kiro\project_13
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
```

**You should see output like:**
```
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: [some address]
JSON RPC URL: http://127.0.0.1:8899
```

### **Step 3: Test Connection**
In your **current PowerShell window**, run:
```powershell
$env:SOLANA_RPC_URL="http://localhost:8899"
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana.exe balance
```

**Expected output:** `0 SOL`

## 🎯 **Run Full Tests**
Once validator is running and connection works:
```powershell
npm test
```

## 💡 **Pro Tips**
- **Keep validator window open** - it needs to stay running
- **Wait 30 seconds** after starting validator before testing
- **Use separate windows** for validator and testing

## 🎉 **What You'll Get**
- ✅ All 56 tests passing
- ✅ Smart contract testing
- ✅ Full protocol validation
- ✅ Coverage reports

**Ready when you are!** 🚀
