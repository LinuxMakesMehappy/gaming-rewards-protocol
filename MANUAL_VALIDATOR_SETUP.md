# 🔧 Manual Solana Validator Setup

## ✅ **Current Status**
- ✅ Solana CLI installed (v1.17.0)
- ✅ Keypair created with passphrase
- ✅ Basic tests passing (12/12)
- ⚠️ Validator needs manual startup

## 🚀 **Manual Validator Startup**

### **Option 1: Command Prompt (Recommended)**
1. **Open Command Prompt** (not PowerShell)
2. **Navigate to project:**
   ```cmd
   cd /d D:\Kiro\project_13
   ```
3. **Start validator:**
   ```cmd
   C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
   ```
4. **Keep this window open** - validator must stay running

### **Option 2: PowerShell as Administrator**
1. **Right-click PowerShell** → "Run as Administrator"
2. **Navigate to project:**
   ```powershell
   cd D:\Kiro\project_13
   ```
3. **Start validator:**
   ```powershell
   C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
   ```

### **Option 3: Windows Terminal**
1. **Open Windows Terminal**
2. **Use Command Prompt tab** (not PowerShell)
3. **Follow Option 1 steps**

## 🎯 **Test Connection**
Once validator is running, in your **current PowerShell window:**
```powershell
$env:SOLANA_RPC_URL="http://localhost:8899"
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana.exe balance
```

**Expected output:** `0 SOL`

## 🎉 **Run Full Tests**
```powershell
npm test
```

## 💡 **Why This Works**
- **Command Prompt** handles the validator better than PowerShell
- **Administrator rights** can help with port binding
- **Separate window** keeps validator running

## 🎯 **Expected Results**
- ✅ All 56 tests passing
- ✅ Smart contract validation
- ✅ Full protocol testing

**Try Option 1 first - it usually works best!** 🚀
