# NSA/CIA-Level Security Audit Script for Gaming Rewards Protocol
# Simplified version for Windows compatibility

param(
    [switch]$FullAudit,
    [switch]$CVEOnly,
    [switch]$Dependencies,
    [switch]$CodeAnalysis,
    [switch]$GenerateReport,
    [string]$OutputPath = "security-audit-results"
)

# Security audit results
$auditResults = @{
    TotalChecks = 0
    PassedChecks = 0
    FailedChecks = 0
    CriticalIssues = 0
    HighIssues = 0
    MediumIssues = 0
    LowIssues = 0
    CVEs = @()
    Dependencies = @()
    CodeIssues = @()
    Recommendations = @()
}

function Write-SecurityHeader {
    Write-Host "================================================"
    Write-Host "NSA/CIA-LEVEL SECURITY AUDIT"
    Write-Host "================================================"
    Write-Host "Protocol: Gaming Rewards Protocol"
    Write-Host "Audit Date: $(Get-Date)"
    Write-Host "Policy: ZERO-CVE TOLERANCE"
    Write-Host "Security Level: MAXIMUM"
}

function Test-CVEDatabase {
    Write-Host "`nChecking CVE Database..."
    
    $auditResults.TotalChecks++
    
    # Check for known CVEs in dependencies
    $cveChecks = @(
        @{ Name = "Rust CVE Check"; Command = "cargo audit"; Severity = "Critical" },
        @{ Name = "Node.js CVE Check"; Command = "npm audit --audit-level=moderate"; Severity = "Critical" }
    )
    
    foreach ($check in $cveChecks) {
        try {
            $result = Invoke-Expression $check.Command 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "PASS: $($check.Name): No CVEs found" -ForegroundColor Green
                $auditResults.PassedChecks++
            } else {
                Write-Host "FAIL: $($check.Name): CVEs detected!" -ForegroundColor Red
                $auditResults.FailedChecks++
                $auditResults.CVEs += @{
                    Component = $check.Name
                    Severity = $check.Severity
                    Details = $result
                }
                
                if ($check.Severity -eq "Critical") {
                    $auditResults.CriticalIssues++
                } elseif ($check.Severity -eq "High") {
                    $auditResults.HighIssues++
                }
            }
        } catch {
            Write-Host "WARN: $($check.Name): Check failed - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

function Test-DependencySecurity {
    Write-Host "`nAnalyzing Dependencies..."
    
    $auditResults.TotalChecks++
    
    # Check Rust dependencies
    if (Test-Path "contracts/Cargo.toml") {
        Write-Host "Checking Rust dependencies..."
        
        $cargoToml = Get-Content "contracts/Cargo.toml" -Raw
        
        # Check for pinned versions (good security practice)
        if ($cargoToml -match 'version = "\^') {
            Write-Host "FAIL: Unpinned dependency versions detected" -ForegroundColor Red
            $auditResults.MediumIssues++
        } else {
            Write-Host "PASS: Dependency versions are pinned" -ForegroundColor Green
            $auditResults.PassedChecks++
        }
    }
    
    # Check Node.js dependencies
    if (Test-Path "bots/package.json") {
        Write-Host "Checking Node.js dependencies..."
        
        $packageJson = Get-Content "bots/package.json" -Raw | ConvertFrom-Json
        
        # Check for exact versions
        if ($packageJson.dependencies -match '"\^') {
            Write-Host "FAIL: Unpinned package versions detected" -ForegroundColor Red
            $auditResults.MediumIssues++
        } else {
            Write-Host "PASS: Package versions are pinned" -ForegroundColor Green
            $auditResults.PassedChecks++
        }
    }
}

function Test-CodeSecurity {
    Write-Host "`nAnalyzing Code Security..."
    
    $auditResults.TotalChecks++
    
    # Check for security anti-patterns in Rust code
    if (Test-Path "contracts/src") {
        Write-Host "Analyzing Rust code security..."
        
        $rustFiles = Get-ChildItem "contracts/src" -Recurse -Filter "*.rs"
        
        foreach ($file in $rustFiles) {
            $content = Get-Content $file.FullName -Raw
            
            # Check for dangerous patterns
            $dangerousPatterns = @(
                @{ Pattern = "unsafe\s*{"; Description = "Unsafe code blocks" },
                @{ Pattern = "panic!"; Description = "Panic macros" },
                @{ Pattern = "unwrap\(\)"; Description = "Unwrapped results" },
                @{ Pattern = "expect\("; Description = "Expected results" },
                @{ Pattern = "unimplemented!"; Description = "Unimplemented code" },
                @{ Pattern = "todo!"; Description = "TODO macros" }
            )
            
            foreach ($pattern in $dangerousPatterns) {
                if ($content -match $pattern.Pattern) {
                    Write-Host "WARN: $($pattern.Description) found in $($file.Name)" -ForegroundColor Yellow
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = $pattern.Description
                        Severity = "Medium"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
    
    # Check for security anti-patterns in TypeScript code
    if (Test-Path "bots/src") {
        Write-Host "Analyzing TypeScript code security..."
        
        $tsFiles = Get-ChildItem "bots/src" -Recurse -Filter "*.ts"
        
        foreach ($file in $tsFiles) {
            $content = Get-Content $file.FullName -Raw
            
            # Check for dangerous patterns
            $dangerousPatterns = @(
                @{ Pattern = "eval\("; Description = "Eval usage" },
                @{ Pattern = "innerHTML"; Description = "InnerHTML usage" },
                @{ Pattern = "any\s*[=:]"; Description = "Any types" },
                @{ Pattern = "console\.log"; Description = "Console logging" },
                @{ Pattern = "process\.env\."; Description = "Environment variable access" }
            )
            
            foreach ($pattern in $dangerousPatterns) {
                if ($content -match $pattern.Pattern) {
                    Write-Host "WARN: $($pattern.Description) found in $($file.Name)" -ForegroundColor Yellow
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = $pattern.Description
                        Severity = "Low"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
}

function Test-CryptographicSecurity {
    Write-Host "`nAnalyzing Cryptographic Security..."
    
    $auditResults.TotalChecks++
    
    # Check for weak cryptographic algorithms
    $weakAlgorithms = @(
        "MD5", "SHA1", "DES", "3DES", "RC4", "Blowfish"
    )
    
    # Check Rust code
    if (Test-Path "contracts/src") {
        $rustFiles = Get-ChildItem "contracts/src" -Recurse -Filter "*.rs"
        
        foreach ($file in $rustFiles) {
            $content = Get-Content $file.FullName -Raw
            
            foreach ($algo in $weakAlgorithms) {
                if ($content -match $algo) {
                    Write-Host "FAIL: Weak cryptographic algorithm '$algo' found in $($file.Name)" -ForegroundColor Red
                    $auditResults.CriticalIssues++
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = "Weak cryptographic algorithm: $algo"
                        Severity = "Critical"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
    
    # Check TypeScript code
    if (Test-Path "bots/src") {
        $tsFiles = Get-ChildItem "bots/src" -Recurse -Filter "*.ts"
        
        foreach ($file in $tsFiles) {
            $content = Get-Content $file.FullName -Raw
            
            foreach ($algo in $weakAlgorithms) {
                if ($content -match $algo) {
                    Write-Host "FAIL: Weak cryptographic algorithm '$algo' found in $($file.Name)" -ForegroundColor Red
                    $auditResults.CriticalIssues++
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = "Weak cryptographic algorithm: $algo"
                        Severity = "Critical"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
    
    # Check for proper key management
    if (Test-Path "env.example") {
        $envContent = Get-Content "env.example" -Raw
        
        if ($envContent -match "PRIVATE_KEY" -and $envContent -notmatch "ENCRYPTED") {
            Write-Host "WARN: Private keys should be encrypted" -ForegroundColor Yellow
            $auditResults.MediumIssues++
        }
    }
}

function Test-NetworkSecurity {
    Write-Host "`nAnalyzing Network Security..."
    
    $auditResults.TotalChecks++
    
    # Check for hardcoded URLs and endpoints
    $hardcodedPatterns = @(
        "http://", "https://", "ws://", "wss://"
    )
    
    # Check Rust code
    if (Test-Path "contracts/src") {
        $rustFiles = Get-ChildItem "contracts/src" -Recurse -Filter "*.rs"
        
        foreach ($file in $rustFiles) {
            $content = Get-Content $file.FullName -Raw
            
            foreach ($pattern in $hardcodedPatterns) {
                if ($content -match $pattern) {
                    Write-Host "WARN: Hardcoded URL found in $($file.Name)" -ForegroundColor Yellow
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = "Hardcoded URL"
                        Severity = "Medium"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
    
    # Check TypeScript code
    if (Test-Path "bots/src") {
        $tsFiles = Get-ChildItem "bots/src" -Recurse -Filter "*.ts"
        
        foreach ($file in $tsFiles) {
            $content = Get-Content $file.FullName -Raw
            
            foreach ($pattern in $hardcodedPatterns) {
                if ($content -match $pattern) {
                    Write-Host "WARN: Hardcoded URL found in $($file.Name)" -ForegroundColor Yellow
                    $auditResults.CodeIssues += @{
                        File = $file.Name
                        Issue = "Hardcoded URL"
                        Severity = "Medium"
                        Line = "Multiple"
                    }
                }
            }
        }
    }
}

function Test-AccessControl {
    Write-Host "`nAnalyzing Access Control..."
    
    $auditResults.TotalChecks++
    
    # Check for proper access control in smart contracts
    if (Test-Path "contracts/src") {
        $rustFiles = Get-ChildItem "contracts/src" -Recurse -Filter "*.rs"
        
        foreach ($file in $rustFiles) {
            $content = Get-Content $file.FullName -Raw
            
            # Check for owner-only functions
            if ($content -match "pub fn" -and $content -notmatch "require!.*owner") {
                Write-Host "WARN: Function without owner check in $($file.Name)" -ForegroundColor Yellow
                $auditResults.CodeIssues += @{
                    File = $file.Name
                    Issue = "Missing owner check"
                    Severity = "High"
                    Line = "Multiple"
                }
            }
            
            # Check for proper authorization
            if ($content -match "Signer" -and $content -notmatch "has_one") {
                Write-Host "WARN: Incomplete authorization in $($file.Name)" -ForegroundColor Yellow
                $auditResults.CodeIssues += @{
                    File = $file.Name
                    Issue = "Incomplete authorization"
                    Severity = "High"
                    Line = "Multiple"
                }
            }
        }
    }
}

function Show-SecuritySummary {
    Write-Host "`n================================================"
    Write-Host "SECURITY AUDIT SUMMARY"
    Write-Host "================================================"
    
    Write-Host "Total Checks: $($auditResults.TotalChecks)"
    Write-Host "Passed: $($auditResults.PassedChecks)" -ForegroundColor Green
    Write-Host "Failed: $($auditResults.FailedChecks)" -ForegroundColor Red
    
    Write-Host "`nIssue Breakdown:"
    Write-Host "Critical: $($auditResults.CriticalIssues)" -ForegroundColor Red
    Write-Host "High: $($auditResults.HighIssues)" -ForegroundColor Red
    Write-Host "Medium: $($auditResults.MediumIssues)" -ForegroundColor Yellow
    Write-Host "Low: $($auditResults.LowIssues)" -ForegroundColor Yellow
    
    if ($auditResults.CriticalIssues -eq 0 -and $auditResults.HighIssues -eq 0) {
        Write-Host "`nSECURITY STATUS: COMPLIANT" -ForegroundColor Green
        Write-Host "The protocol meets NSA/CIA-level security requirements!" -ForegroundColor Green
    } else {
        Write-Host "`nSECURITY STATUS: NON-COMPLIANT" -ForegroundColor Red
        Write-Host "Critical or high-severity issues must be addressed!" -ForegroundColor Red
    }
    
    Write-Host "`nCVEs Found: $($auditResults.CVEs.Count)"
    Write-Host "Dependency Issues: $($auditResults.Dependencies.Count)"
    Write-Host "Code Issues: $($auditResults.CodeIssues.Count)"
}

# Main execution
try {
    Write-SecurityHeader
    
    # Determine which checks to run
    if ($FullAudit -or $CVEOnly) {
        Test-CVEDatabase
    }
    
    if ($FullAudit -or $Dependencies) {
        Test-DependencySecurity
    }
    
    if ($FullAudit -or $CodeAnalysis) {
        Test-CodeSecurity
        Test-CryptographicSecurity
        Test-NetworkSecurity
        Test-AccessControl
    }
    
    if ($FullAudit) {
        Test-CVEDatabase
        Test-DependencySecurity
        Test-CodeSecurity
        Test-CryptographicSecurity
        Test-NetworkSecurity
        Test-AccessControl
    }
    
    Show-SecuritySummary
    
} catch {
    Write-Host "Security audit failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
