# Simplified Test Pipeline for Gaming Rewards Protocol
# Focuses on contract tests and security checks

param(
    [switch]$ContractsOnly,
    [switch]$SecurityOnly,
    [switch]$Quick
)

$ErrorActionPreference = "Continue"
$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    Warnings = @()
    Errors = @()
}

function Write-TestHeader {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "SIMPLIFIED TEST PIPELINE" -ForegroundColor Cyan
    Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Rust
    try {
        $rustVersion = rustc --version 2>$null
        if ($rustVersion) {
            Write-Host "[PASS] Rust found: $rustVersion" -ForegroundColor Green
            $testResults.PassedTests++
        } else {
            Write-Host "[FAIL] Rust not found" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Errors += "Rust not installed"
        }
    } catch {
        Write-Host "[FAIL] Rust not found" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Errors += "Rust not installed"
    }
    
    # Check Cargo
    try {
        $cargoVersion = cargo --version 2>$null
        if ($cargoVersion) {
            Write-Host "[PASS] Cargo found: $cargoVersion" -ForegroundColor Green
            $testResults.PassedTests++
        } else {
            Write-Host "[FAIL] Cargo not found" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Errors += "Cargo not installed"
        }
    } catch {
        Write-Host "[FAIL] Cargo not found" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Errors += "Cargo not installed"
    }
    
    $testResults.TotalTests += 2
}

function Test-ContractStructure {
    Write-Host "Testing contract structure..." -ForegroundColor Yellow
    
    $requiredFiles = @(
        "contracts/src/lib.rs",
        "contracts/src/accounts.rs",
        "contracts/src/constants.rs",
        "contracts/src/errors.rs",
        "contracts/src/instructions/",
        "contracts/Cargo.toml",
        "contracts/Anchor.toml"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "[PASS] Found: $file" -ForegroundColor Green
            $testResults.PassedTests++
        } else {
            Write-Host "[FAIL] Missing: $file" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Errors += "Missing file: $file"
        }
        $testResults.TotalTests++
    }
}

function Test-ContractCompilation {
    Write-Host "Testing contract compilation..." -ForegroundColor Yellow
    
    if (Test-Path "contracts") {
        Push-Location "contracts"
        try {
            Write-Host "Running cargo check..." -ForegroundColor Yellow
            $output = cargo check 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[PASS] Contract compilation successful" -ForegroundColor Green
                $testResults.PassedTests++
            } else {
                Write-Host "[FAIL] Contract compilation failed" -ForegroundColor Red
                Write-Host $output -ForegroundColor Red
                $testResults.FailedTests++
                $testResults.Errors += "Contract compilation failed"
            }
        } catch {
            Write-Host "[FAIL] Contract compilation error" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Errors += "Contract compilation error"
        }
        finally {
            Pop-Location
        }
        $testResults.TotalTests++
    } else {
        Write-Host "[FAIL] Contracts directory not found" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Errors += "Contracts directory not found"
        $testResults.TotalTests++
    }
}

function Test-SecurityChecks {
    Write-Host "Running security checks..." -ForegroundColor Yellow
    
    # Check for placeholder addresses
    $placeholderFiles = @(
        "contracts/src/constants.rs"
    )
    
    foreach ($file in $placeholderFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match "11111111111111111111111111111111") {
                Write-Host "[WARN] Placeholder addresses found in $file" -ForegroundColor Yellow
                $testResults.Warnings += "Placeholder addresses in $file"
            } else {
                Write-Host "[PASS] No placeholder addresses in $file" -ForegroundColor Green
                $testResults.PassedTests++
            }
            $testResults.TotalTests++
        }
    }
    
    # Check for unsafe code patterns
    $unsafePatterns = @(
        "unsafe\s*{",
        "unsafe\s+fn",
        "unsafe\s+trait"
    )
    
    $rustFiles = Get-ChildItem -Path "contracts/src" -Filter "*.rs" -Recurse
    foreach ($file in $rustFiles) {
        $content = Get-Content $file.FullName -Raw
        foreach ($pattern in $unsafePatterns) {
            if ($content -match $pattern) {
                Write-Host "[WARN] Unsafe code pattern found in $($file.Name)" -ForegroundColor Yellow
                $testResults.Warnings += "Unsafe code in $($file.Name)"
            }
        }
    }
}

function Test-BotStructure {
    Write-Host "Testing bot structure..." -ForegroundColor Yellow
    
    $requiredFiles = @(
        "bots/src/index.ts",
        "bots/src/services/",
        "bots/package.json",
        "bots/tsconfig.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "[PASS] Found: $file" -ForegroundColor Green
            $testResults.PassedTests++
        } else {
            Write-Host "[FAIL] Missing: $file" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Errors += "Missing file: $file"
        }
        $testResults.TotalTests++
    }
}

function Test-Configuration {
    Write-Host "Testing configuration..." -ForegroundColor Yellow
    
    if (Test-Path "env.example") {
        Write-Host "[PASS] Environment template found" -ForegroundColor Green
        $testResults.PassedTests++
    } else {
        Write-Host "[FAIL] Environment template missing" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Errors += "Missing env.example"
    }
    $testResults.TotalTests++
    
    if (Test-Path "package.json") {
        Write-Host "[PASS] Root package.json found" -ForegroundColor Green
        $testResults.PassedTests++
    } else {
        Write-Host "[FAIL] Root package.json missing" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Errors += "Missing root package.json"
    }
    $testResults.TotalTests++
}

function Show-Results {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Total Tests: $($testResults.TotalTests)" -ForegroundColor White
    Write-Host "Passed: $($testResults.PassedTests)" -ForegroundColor Green
    Write-Host "Failed: $($testResults.FailedTests)" -ForegroundColor Red
    
    if ($testResults.Warnings.Count -gt 0) {
        Write-Host "Warnings: $($testResults.Warnings.Count)" -ForegroundColor Yellow
        foreach ($warning in $testResults.Warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    
    if ($testResults.Errors.Count -gt 0) {
        Write-Host "Errors: $($testResults.Errors.Count)" -ForegroundColor Red
        foreach ($err in $testResults.Errors) {
            Write-Host "  - $err" -ForegroundColor Red
        }
    }
    
    $successRate = if ($testResults.TotalTests -gt 0) { 
        [math]::Round(($testResults.PassedTests / $testResults.TotalTests) * 100, 2) 
    } else { 0 }
    
    Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    
    if ($testResults.FailedTests -eq 0) {
        Write-Host "STATUS: ALL TESTS PASSED" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "STATUS: SOME TESTS FAILED" -ForegroundColor Red
        exit 1
    }
}

# Main execution
Write-TestHeader

if ($SecurityOnly) {
    Test-SecurityChecks
} elseif ($ContractsOnly) {
    Test-Prerequisites
    Test-ContractStructure
    Test-ContractCompilation
    Test-SecurityChecks
} elseif ($Quick) {
    Test-Prerequisites
    Test-ContractStructure
    Test-BotStructure
    Test-Configuration
} else {
    Test-Prerequisites
    Test-ContractStructure
    Test-ContractCompilation
    Test-SecurityChecks
    Test-BotStructure
    Test-Configuration
}

Show-Results
