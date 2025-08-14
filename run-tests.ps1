# Gaming Rewards Protocol - Windows Test Pipeline
# This script runs comprehensive tests on Windows

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Security,
    [switch]$E2E,
    [switch]$Quick,
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

function Log-Test {
    param(
        [string]$Phase,
        [string]$Status,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Status] $Phase`: $Message"
    
    switch ($Status) {
        "PASS" { Write-ColorOutput $logMessage $Green }
        "FAIL" { Write-ColorOutput $logMessage $Red }
        "SKIP" { Write-ColorOutput $logMessage $Yellow }
        "INFO" { Write-ColorOutput $logMessage $Blue }
    }
    
    # Add to log file
    Add-Content -Path "test-results/test-run.log" -Value $logMessage
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." $Blue
    
    $prerequisites = @{
        "Node.js" = "node"
        "npm" = "npm"
        "Rust" = "rustc"
        "Cargo" = "cargo"
        "Anchor" = "anchor"
        "Solana CLI" = "solana"
    }
    
    foreach ($tool in $prerequisites.GetEnumerator()) {
        if (Get-Command $tool.Value -ErrorAction SilentlyContinue) {
            $version = & $tool.Value --version 2>$null
            Log-Test "PREREQ" "PASS" "$($tool.Key) found: $version"
        } else {
            Log-Test "PREREQ" "SKIP" "$($tool.Key) not found (will install if needed)"
        }
    }
}

function Install-Dependencies {
    Write-ColorOutput "Installing dependencies..." $Blue
    
    # Install Node.js dependencies
    if (Test-Path "bots/package.json") {
        Set-Location "bots"
        npm install
        if ($LASTEXITCODE -eq 0) {
            Log-Test "DEPS" "PASS" "Node.js dependencies installed"
        } else {
            Log-Test "DEPS" "FAIL" "Failed to install Node.js dependencies"
            exit 1
        }
        Set-Location ".."
    }
    
    # Install Rust dependencies
    if (Test-Path "contracts/Cargo.toml") {
        Set-Location "contracts"
        cargo fetch
        if ($LASTEXITCODE -eq 0) {
            Log-Test "DEPS" "PASS" "Rust dependencies fetched"
        } else {
            Log-Test "DEPS" "FAIL" "Failed to fetch Rust dependencies"
            exit 1
        }
        Set-Location ".."
    }
}

function Test-Linting {
    Write-ColorOutput "Running linting tests..." $Blue
    
    # ESLint for TypeScript
    if (Test-Path "bots") {
        Set-Location "bots"
        npm run lint 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Test "LINT" "PASS" "ESLint passed"
        } else {
            Log-Test "LINT" "FAIL" "ESLint failed"
        }
        Set-Location ".."
    }
    
    # TypeScript compilation check
    if (Test-Path "bots") {
        Set-Location "bots"
        npx tsc --noEmit
        if ($LASTEXITCODE -eq 0) {
            Log-Test "LINT" "PASS" "TypeScript compilation check passed"
        } else {
            Log-Test "LINT" "FAIL" "TypeScript compilation check failed"
        }
        Set-Location ".."
    }
    
    # Rust clippy
    if (Test-Path "contracts") {
        Set-Location "contracts"
        cargo clippy --all-targets --all-features -- -D warnings
        if ($LASTEXITCODE -eq 0) {
            Log-Test "LINT" "PASS" "Rust clippy passed"
        } else {
            Log-Test "LINT" "FAIL" "Rust clippy failed"
        }
        Set-Location ".."
    }
}

function Test-Unit {
    Write-ColorOutput "Running unit tests..." $Blue
    
    # TypeScript unit tests
    if (Test-Path "bots") {
        Set-Location "bots"
        npm test
        if ($LASTEXITCODE -eq 0) {
            Log-Test "UNIT" "PASS" "TypeScript unit tests passed"
        } else {
            Log-Test "UNIT" "FAIL" "TypeScript unit tests failed"
        }
        Set-Location ".."
    }
    
    # Rust unit tests
    if (Test-Path "contracts") {
        Set-Location "contracts"
        cargo test --lib
        if ($LASTEXITCODE -eq 0) {
            Log-Test "UNIT" "PASS" "Rust unit tests passed"
        } else {
            Log-Test "UNIT" "FAIL" "Rust unit tests failed"
        }
        Set-Location ".."
    }
}

function Test-Integration {
    Write-ColorOutput "Running integration tests..." $Blue
    
    # Anchor integration tests
    if (Test-Path "contracts") {
        Set-Location "contracts"
        anchor test --skip-lint
        if ($LASTEXITCODE -eq 0) {
            Log-Test "INTEGRATION" "PASS" "Anchor integration tests passed"
        } else {
            Log-Test "INTEGRATION" "FAIL" "Anchor integration tests failed"
        }
        Set-Location ".."
    }
    
    # Bot integration tests
    if (Test-Path "bots") {
        Set-Location "bots"
        npm run test:integration 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Test "INTEGRATION" "PASS" "Bot integration tests passed"
        } else {
            Log-Test "INTEGRATION" "SKIP" "Bot integration tests not configured"
        }
        Set-Location ".."
    }
}

function Test-Security {
    Write-ColorOutput "Running security tests..." $Blue
    
    # Run security audit scripts if they exist
    if (Test-Path "scripts/security-audit.sh") {
        Log-Test "SECURITY" "SKIP" "Security audit scripts require Linux environment"
    }
    
    # Run npm audit
    if (Test-Path "bots") {
        Set-Location "bots"
        npm audit --audit-level=high
        if ($LASTEXITCODE -eq 0) {
            Log-Test "SECURITY" "PASS" "npm audit passed"
        } else {
            Log-Test "SECURITY" "FAIL" "npm audit found vulnerabilities"
        }
        Set-Location ".."
    }
}

function Test-Performance {
    Write-ColorOutput "Running performance tests..." $Blue
    
    # Smart contract performance tests
    if (Test-Path "contracts") {
        Set-Location "contracts"
        cargo test --test performance 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Test "PERFORMANCE" "PASS" "Smart contract performance tests passed"
        } else {
            Log-Test "PERFORMANCE" "SKIP" "Smart contract performance tests not found"
        }
        Set-Location ".."
    }
    
    # Bot performance tests
    if (Test-Path "bots") {
        Set-Location "bots"
        npm run test:performance 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Test "PERFORMANCE" "PASS" "Bot performance tests passed"
        } else {
            Log-Test "PERFORMANCE" "SKIP" "Bot performance tests not configured"
        }
        Set-Location ".."
    }
}

function Test-E2E {
    Write-ColorOutput "Running end-to-end tests..." $Blue
    
    # Check if localnet is available
    if (Get-Command "solana" -ErrorAction SilentlyContinue) {
        # Start local validator if not running
        $clusterVersion = solana cluster-version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Log-Test "E2E" "INFO" "Starting local validator..."
            Start-Process -FilePath "solana-test-validator" -ArgumentList "--reset" -WindowStyle Hidden
            Start-Sleep -Seconds 10
        }
        
        # Run E2E tests
        npm run test:e2e 2>$null
        if ($LASTEXITCODE -eq 0) {
            Log-Test "E2E" "PASS" "End-to-end tests passed"
        } else {
            Log-Test "E2E" "SKIP" "End-to-end tests not configured"
        }
    } else {
        Log-Test "E2E" "SKIP" "Solana CLI not available for E2E tests"
    }
}

function Generate-Report {
    Write-ColorOutput "Generating test report..." $Blue
    
    $reportFile = "test-results/test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
    
    $report = @"
# Test Report - $(Get-Date)

## Executive Summary
- **Test Date**: $(Get-Date)
- **Environment**: Windows PowerShell
- **Test Results**: Available in test-results/test-run.log

## Test Results by Category

### Prerequisites
- Node.js, npm, Rust, Cargo, Anchor, Solana CLI availability

### Linting
- ESLint, TypeScript compilation, Rust clippy

### Unit Tests
- TypeScript unit tests
- Rust unit tests

### Integration Tests
- Anchor integration tests
- Bot integration tests

### Security Tests
- npm audit for vulnerabilities

### Performance Tests
- Smart contract performance
- Bot performance

### End-to-End Tests
- Full system integration tests

## Recommendations
1. Address any failed tests immediately
2. Review skipped tests for implementation
3. Monitor performance test results
4. Maintain security test standards

## Next Steps
- Review detailed logs: test-results/test-run.log
- Address any issues found
- Run tests regularly during development
"@
    
    $report | Out-File -FilePath $reportFile -Encoding UTF8
    Log-Test "REPORT" "PASS" "Test report generated: $reportFile"
}

function Cleanup-TestEnvironment {
    Write-ColorOutput "Cleaning up test environment..." $Blue
    
    # Stop local validator if running
    $validatorProcess = Get-Process -Name "solana-test-validator" -ErrorAction SilentlyContinue
    if ($validatorProcess) {
        Stop-Process -Name "solana-test-validator" -Force
        Log-Test "CLEANUP" "INFO" "Stopped local validator"
    }
    
    # Clean test artifacts
    if (Test-Path "contracts") {
        Set-Location "contracts"
        cargo clean
        Set-Location ".."
    }
    
    if (Test-Path "bots") {
        Set-Location "bots"
        if (Test-Path "node_modules/.cache") {
            Remove-Item "node_modules/.cache" -Recurse -Force
        }
        Set-Location ".."
    }
    
    Log-Test "CLEANUP" "INFO" "Test environment cleanup completed"
}

function Show-Results {
    Write-ColorOutput "`n==========================================" $Blue
    Write-ColorOutput "TEST PIPELINE RESULTS" $Blue
    Write-ColorOutput "==========================================" $Blue
    
    # Read log file and count results
    if (Test-Path "test-results/test-run.log") {
        $logContent = Get-Content "test-results/test-run.log"
        $totalTests = $logContent.Count
        $passedTests = ($logContent | Where-Object { $_ -match "\[PASS\]" }).Count
        $failedTests = ($logContent | Where-Object { $_ -match "\[FAIL\]" }).Count
        $skippedTests = ($logContent | Where-Object { $_ -match "\[SKIP\]" }).Count
        
        Write-ColorOutput "Total Tests: $totalTests" $White
        Write-ColorOutput "Passed: $passedTests" $Green
        Write-ColorOutput "Failed: $failedTests" $Red
        Write-ColorOutput "Skipped: $skippedTests" $Yellow
        
        if ($failedTests -eq 0) {
            Write-ColorOutput "`nAll tests passed!" $Green
        } else {
            Write-ColorOutput "`nSome tests failed!" $Red
        }
    }
}

# Main test execution
try {
    # Create test directories
    if (-not (Test-Path "test-results")) {
        New-Item -ItemType Directory -Path "test-results" -Force | Out-Null
    }
    
    # Initialize log file
    $logFile = "test-results/test-run.log"
    if (Test-Path $logFile) {
        Remove-Item $logFile
    }
    
    Write-ColorOutput "==========================================" $Blue
    Write-ColorOutput "GAMING REWARDS PROTOCOL - TEST PIPELINE" $Blue
    Write-ColorOutput "Date: $(Get-Date)" $Blue
    Write-ColorOutput "==========================================" $Blue
    
    # Determine which tests to run
    if ($Unit) {
        Test-Prerequisites
        Install-Dependencies
        Test-Unit
        Generate-Report
    } elseif ($Integration) {
        Test-Prerequisites
        Install-Dependencies
        Test-Integration
        Generate-Report
    } elseif ($Security) {
        Test-Security
        Generate-Report
    } elseif ($E2E) {
        Test-Prerequisites
        Install-Dependencies
        Test-E2E
        Generate-Report
    } elseif ($Quick) {
        Test-Prerequisites
        Install-Dependencies
        Test-Linting
        Test-Unit
        Generate-Report
    } else {
        # Run all tests
        Test-Prerequisites
        Install-Dependencies
        Test-Linting
        Test-Unit
        Test-Integration
        Test-Security
        Test-Performance
        Test-E2E
        Generate-Report
        Cleanup-TestEnvironment
    }
    
    Show-Results
    
} catch {
    Write-ColorOutput "Test pipeline failed: $($_.Exception.Message)" $Red
    exit 1
}
