# Gaming Rewards Protocol - Code Validation Script
# This script validates the code structure without requiring dependencies

param(
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-FileExists {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        Write-ColorOutput "✅ $Description found: $FilePath" $Green
        return $true
    } else {
        Write-ColorOutput "❌ $Description missing: $FilePath" $Red
        return $false
    }
}

function Test-FileContent {
    param([string]$FilePath, [string]$SearchTerm, [string]$Description)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $SearchTerm) {
            Write-ColorOutput "✅ $Description found in $FilePath" $Green
            return $true
        } else {
            Write-ColorOutput "⚠️  $Description not found in $FilePath" $Yellow
            return $false
        }
    } else {
        Write-ColorOutput "❌ File not found: $FilePath" $Red
        return $false
    }
}

function Test-RustFile {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        
        # Check for common Rust issues
        $issues = @()
        
        if ($content -match "TODO") {
            $issues += "Contains TODO comments"
        }
        
        if ($content -match "FIXME") {
            $issues += "Contains FIXME comments"
        }
        
        if ($content -match "unimplemented!") {
            $issues += "Contains unimplemented! macro"
        }
        
        if ($content -match "panic!") {
            $issues += "Contains panic! macro"
        }
        
        if ($issues.Count -eq 0) {
            Write-ColorOutput "✅ $Description validated: $FilePath" $Green
            return $true
        } else {
            Write-ColorOutput "⚠️  $Description has issues: $($issues -join ', ')" $Yellow
            return $false
        }
    } else {
        Write-ColorOutput "❌ File not found: $FilePath" $Red
        return $false
    }
}

function Test-TypeScriptFile {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        
        # Check for common TypeScript issues
        $issues = @()
        
        if ($content -match "TODO") {
            $issues += "Contains TODO comments"
        }
        
        if ($content -match "FIXME") {
            $issues += "Contains FIXME comments"
        }
        
        if ($content -match "any") {
            $issues += "Contains 'any' type"
        }
        
        if ($content -match "console\.log") {
            $issues += "Contains console.log (should use logger)"
        }
        
        if ($issues.Count -eq 0) {
            Write-ColorOutput "✅ $Description validated: $FilePath" $Green
            return $true
        } else {
            Write-ColorOutput "⚠️  $Description has issues: $($issues -join ', ')" $Yellow
            return $false
        }
    } else {
        Write-ColorOutput "❌ File not found: $FilePath" $Red
        return $false
    }
}

# Main validation
Write-ColorOutput "==========================================" $Blue
Write-ColorOutput "GAMING REWARDS PROTOCOL - CODE VALIDATION" $Blue
Write-ColorOutput "Date: $(Get-Date)" $Blue
Write-ColorOutput "==========================================" $Blue

$totalChecks = 0
$passedChecks = 0
$failedChecks = 0
$warnings = 0

# Test project structure
Write-ColorOutput "`nTesting Project Structure..." $Blue

$structureChecks = @(
    @{ Path = "contracts/Cargo.toml"; Description = "Rust Cargo.toml" },
    @{ Path = "contracts/src/lib.rs"; Description = "Rust lib.rs" },
    @{ Path = "contracts/src/accounts.rs"; Description = "Rust accounts.rs" },
    @{ Path = "contracts/src/constants.rs"; Description = "Rust constants.rs" },
    @{ Path = "contracts/src/errors.rs"; Description = "Rust errors.rs" },
    @{ Path = "contracts/src/events.rs"; Description = "Rust events.rs" },
    @{ Path = "contracts/src/instructions/"; Description = "Rust instructions directory" },
    @{ Path = "bots/package.json"; Description = "Node.js package.json" },
    @{ Path = "bots/tsconfig.json"; Description = "TypeScript config" },
    @{ Path = "bots/src/index.ts"; Description = "Bot main file" },
    @{ Path = "setup.ps1"; Description = "Windows setup script" },
    @{ Path = "run-tests.ps1"; Description = "Windows test script" },
    @{ Path = "env.example"; Description = "Environment template" },
    @{ Path = "README.md"; Description = "README file" }
)

foreach ($check in $structureChecks) {
    $totalChecks++
    if (Test-FileExists $check.Path $check.Description) {
        $passedChecks++
    } else {
        $failedChecks++
    }
}

# Test Rust files
Write-ColorOutput "`nTesting Rust Files..." $Blue

$rustFiles = @(
    @{ Path = "contracts/src/lib.rs"; Description = "Main library" },
    @{ Path = "contracts/src/accounts.rs"; Description = "Account definitions" },
    @{ Path = "contracts/src/constants.rs"; Description = "Constants" },
    @{ Path = "contracts/src/errors.rs"; Description = "Error definitions" },
    @{ Path = "contracts/src/events.rs"; Description = "Event definitions" },
    @{ Path = "contracts/src/instructions/initialize_treasury.rs"; Description = "Initialize treasury" },
    @{ Path = "contracts/src/instructions/harvest_and_rebalance.rs"; Description = "Harvest and rebalance" },
    @{ Path = "contracts/src/instructions/claim_reward.rs"; Description = "Claim reward" },
    @{ Path = "contracts/src/instructions/slash_oracle.rs"; Description = "Slash oracle" }
)

foreach ($file in $rustFiles) {
    $totalChecks++
    if (Test-RustFile $file.Path $file.Description) {
        $passedChecks++
    } else {
        $warnings++
    }
}

# Test TypeScript files
Write-ColorOutput "`nTesting TypeScript Files..." $Blue

$typescriptFiles = @(
    @{ Path = "bots/src/index.ts"; Description = "Bot main file" },
    @{ Path = "bots/src/services/yield-harvester.ts"; Description = "Yield harvester" },
    @{ Path = "bots/src/services/game-event-detector.ts"; Description = "Game event detector" },
    @{ Path = "bots/src/utils/logger.ts"; Description = "Logger utility" },
    @{ Path = "bots/src/utils/security-manager.ts"; Description = "Security manager" }
)

foreach ($file in $typescriptFiles) {
    $totalChecks++
    if (Test-TypeScriptFile $file.Path $file.Description) {
        $passedChecks++
    } else {
        $warnings++
    }
}

# Test security features
Write-ColorOutput "`nTesting Security Features..." $Blue

$securityChecks = @(
    @{ File = "contracts/src/constants.rs"; Term = "CRITICAL.*Update.*addresses"; Description = "Security warnings" },
    @{ File = "contracts/src/constants.rs"; Term = "MAX_CLAIM_AMOUNT"; Description = "Claim amount limits" },
    @{ File = "contracts/src/constants.rs"; Term = "MAX_HARVEST_AMOUNT"; Description = "Harvest amount limits" },
    @{ File = "contracts/src/instructions/claim_reward.rs"; Term = "transfer.*claim_amount"; Description = "USDC transfer implementation" },
    @{ File = "contracts/src/instructions/harvest_and_rebalance.rs"; Term = "jupiter.*swap"; Description = "Jupiter integration" },
    @{ File = "bots/src/services/game-event-detector.ts"; Term = "ORACLE_PRIVATE_KEY"; Description = "Oracle key validation" },
    @{ File = "env.example"; Term = "ORACLE_PRIVATE_KEY"; Description = "Environment variables" }
)

foreach ($check in $securityChecks) {
    $totalChecks++
    if (Test-FileContent $check.File $check.Term $check.Description) {
        $passedChecks++
    } else {
        $failedChecks++
    }
}

# Test Windows compatibility
Write-ColorOutput "`nTesting Windows Compatibility..." $Blue

$windowsChecks = @(
    @{ File = "setup.ps1"; Term = "PowerShell"; Description = "PowerShell setup script" },
    @{ File = "run-tests.ps1"; Term = "PowerShell"; Description = "PowerShell test script" },
    @{ File = "package.json"; Term = "powershell.*-ExecutionPolicy"; Description = "Windows npm scripts" }
)

foreach ($check in $windowsChecks) {
    $totalChecks++
    if (Test-FileContent $check.File $check.Term $check.Description) {
        $passedChecks++
    } else {
        $failedChecks++
    }
}

# Summary
Write-ColorOutput "`n==========================================" $Blue
Write-ColorOutput "VALIDATION SUMMARY" $Blue
Write-ColorOutput "==========================================" $Blue
Write-ColorOutput "Total Checks: $totalChecks" $White
Write-ColorOutput "Passed: $passedChecks" $Green
Write-ColorOutput "Failed: $failedChecks" $Red
Write-ColorOutput "Warnings: $warnings" $Yellow

$successRate = [math]::Round(($passedChecks / $totalChecks) * 100, 1)
Write-ColorOutput "Success Rate: $successRate%" $White

if ($failedChecks -eq 0) {
    Write-ColorOutput "`nAll critical checks passed!" $Green
    Write-ColorOutput "The code structure is ready for development." $Green
} else {
    Write-ColorOutput "`n⚠️  Some checks failed. Please review the issues above." $Yellow
}

if ($warnings -gt 0) {
    Write-ColorOutput "`nThere are $warnings warnings to address for production readiness." $Yellow
}

Write-ColorOutput "`nNext steps:" $Blue
Write-ColorOutput "1. Install dependencies: npm run setup" $White
Write-ColorOutput "2. Run tests: npm run test:all" $White
Write-ColorOutput "3. Update placeholder addresses in constants.rs" $White
Write-ColorOutput "4. Configure environment variables" $White
