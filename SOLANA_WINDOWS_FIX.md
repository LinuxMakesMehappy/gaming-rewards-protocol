# 🔧 Solana Windows Fix - Complete Solution

## 🎯 **Problem**
Solana test validator fails on Windows with `libssl-3-x64.dll was not found` error.

## ✅ **Solution: Install Missing Dependencies**

### **Step 1: Download Required Binaries**

#### **1.1 Protocol Buffers (protoc)**
- **Download**: https://github.com/protocolbuffers/protobuf/releases/download/v25.3/protoc-25.3-win64.zip
- **Extract to**: `C:\Program Files\protoc\`

#### **1.2 OpenSSL for Windows**
- **Download**: https://slproweb.com/download/Win64OpenSSL-3_2_1.exe
- **Install to**: `C:\Program Files\OpenSSL-Win64\`

### **Step 2: Download Required DLLs**

#### **2.1 Core DLLs**
- **libssl-3-x64.dll**: https://www.dllme.com/dll/files/libssl-3-x64
- **libcrypto-3-x64.dll**: https://www.dllme.com/dll/files/libcrypto-3-x64
- **libclang.dll**: https://www.dllme.com/dll/files/libclang
- **clang.dll**: https://www.dllme.com/dll/files/clang

#### **2.2 Installation**
1. **Download all DLLs**
2. **Place in**: `C:\Windows\System32\`

### **Step 3: Set Environment Variables**

#### **3.1 System Environment Variables**
```cmd
OPENSSL_INCLUDE_DIR=C:\Program Files\OpenSSL-Win64\include
OPENSSL_LIB=C:\Program Files\OpenSSL-Win64\lib
OPENSSL_LIB_DIR=C:\Program Files\OpenSSL-Win64\lib\VC\x64\MT
PROTOC=C:\Program Files\protoc\bin\protoc
LIBCLANG_PATH=C:\Windows\System32\libclang.dll
PATH=C:\Program Files\OpenSSL-Win64\bin
```

#### **3.2 How to Set (Windows 10/11)**
1. **Right-click Start** → "System"
2. **Advanced system settings** → "Environment Variables"
3. **System variables** → "New"
4. **Add each variable** above

### **Step 4: Alternative Quick Fix**

#### **4.1 Copy DLLs to Solana Directory**
```cmd
# Copy DLLs directly to Solana bin directory
copy "C:\Windows\System32\libssl-3-x64.dll" "C:\Users\twizt\.local\share\solana\install\active_release\bin\"
copy "C:\Windows\System32\libcrypto-3-x64.dll" "C:\Users\twizt\.local\share\solana\install\active_release\bin\"
copy "C:\Windows\System32\libclang.dll" "C:\Users\twizt\.local\share\solana\install\active_release\bin\"
copy "C:\Windows\System32\clang.dll" "C:\Users\twizt\.local\share\solana\install\active_release\bin\"
```

#### **4.2 Test Validator**
```cmd
C:\Users\twizt\.local\share\solana\install\active_release\bin\solana-test-validator.exe
```

## 🚀 **Quick Installation Script**

### **Option 1: Manual Installation**
1. **Download OpenSSL**: https://slproweb.com/download/Win64OpenSSL-3_2_1.exe
2. **Install OpenSSL** to `C:\Program Files\OpenSSL-Win64\`
3. **Download DLLs** from dllme.com
4. **Copy DLLs** to `C:\Windows\System32\`
5. **Set environment variables**

### **Option 2: Use WSL (Windows Subsystem for Linux)**
```bash
# Install WSL with Ubuntu
wsl --install

# In WSL, install Solana
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Start validator in WSL
solana-test-validator
```

## 🎯 **Expected Results**

### **Before Fix**
```
Error: The code execution cannot proceed because libssl-3-x64.dll was not found.
```

### **After Fix**
```
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: [some address]
JSON RPC URL: http://127.0.0.1:8899
```

## 💡 **Pro Tips**

1. **Restart PowerShell** after setting environment variables
2. **Run as Administrator** if you get permission errors
3. **Use WSL** as a reliable alternative
4. **Check DLL versions** match your Solana version

## 🔍 **Troubleshooting**

### **Still Getting DLL Errors?**
1. **Verify DLLs** are in `C:\Windows\System32\`
2. **Check environment variables** are set correctly
3. **Restart computer** after installation
4. **Try WSL** as alternative

### **Permission Issues?**
1. **Run PowerShell as Administrator**
2. **Check Windows Defender** isn't blocking DLLs
3. **Verify file permissions** on System32

## 🎉 **Success Checklist**

- [ ] **OpenSSL installed** in Program Files
- [ ] **DLLs copied** to System32
- [ ] **Environment variables** set
- [ ] **PowerShell restarted**
- [ ] **Validator starts** without errors

**This solution is based on community fixes from [GitHub issue #34793](https://github.com/solana-labs/solana/issues/34793)**

**Ready to fix your Solana validator!** 🚀
