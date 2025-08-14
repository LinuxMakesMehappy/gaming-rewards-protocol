#!/bin/bash

# Gaming Rewards Protocol - Security Audit Pipeline
# This script performs comprehensive security checks on the entire project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_LOG="$PROJECT_ROOT/audit/security-audit-$(date +%Y%m%d-%H%M%S).log"
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Create audit directory
mkdir -p "$PROJECT_ROOT/audit"

echo "==========================================" | tee -a "$AUDIT_LOG"
echo "GAMING REWARDS PROTOCOL - SECURITY AUDIT" | tee -a "$AUDIT_LOG"
echo "Date: $(date)" | tee -a "$AUDIT_LOG"
echo "==========================================" | tee -a "$AUDIT_LOG"

# Function to log issues
log_issue() {
    local severity=$1
    local message=$2
    local file=$3
    local line=$4
    
    case $severity in
        "CRITICAL")
            echo -e "${RED}[CRITICAL]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ((CRITICAL_ISSUES++))
            ;;
        "HIGH")
            echo -e "${YELLOW}[HIGH]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ((HIGH_ISSUES++))
            ;;
        "MEDIUM")
            echo -e "${BLUE}[MEDIUM]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ((MEDIUM_ISSUES++))
            ;;
        "LOW")
            echo -e "${GREEN}[LOW]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ((LOW_ISSUES++))
            ;;
    esac
}

# Function to check for hardcoded secrets
check_hardcoded_secrets() {
    echo "Checking for hardcoded secrets..." | tee -a "$AUDIT_LOG"
    
    # Check for private keys, API keys, etc.
    local secrets_found=0
    
    # Check for private keys
    if grep -r "private.*key\|secret.*key" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | grep -v "example\|template\|placeholder"; then
        log_issue "CRITICAL" "Hardcoded private keys found" "multiple" "0"
        ((secrets_found++))
    fi
    
    # Check for API keys
    if grep -r "api.*key\|token.*key" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | grep -v "example\|template\|placeholder"; then
        log_issue "HIGH" "Hardcoded API keys found" "multiple" "0"
        ((secrets_found++))
    fi
    
    # Check for database credentials
    if grep -r "password.*=.*[a-zA-Z0-9]\|database.*url.*=.*[a-zA-Z0-9]" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | grep -v "example\|template\|placeholder"; then
        log_issue "HIGH" "Hardcoded database credentials found" "multiple" "0"
        ((secrets_found++))
    fi
    
    if [ $secrets_found -eq 0 ]; then
        echo -e "${GREEN}✓ No hardcoded secrets found${NC}" | tee -a "$AUDIT_LOG"
    fi
}

# Function to check Rust smart contract security
check_rust_security() {
    echo "Checking Rust smart contract security..." | tee -a "$AUDIT_LOG"
    
    cd "$PROJECT_ROOT/contracts"
    
    # Check for unchecked arithmetic operations
    local unchecked_ops=$(grep -r "\.unwrap()\|\.expect(" src/ | grep -v "test\|example" | wc -l)
    if [ $unchecked_ops -gt 0 ]; then
        log_issue "HIGH" "Found $unchecked_ops unchecked operations" "contracts/src" "0"
    else
        echo -e "${GREEN}✓ All arithmetic operations are checked${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    # Check for proper error handling
    local error_handling=$(grep -r "Result<" src/ | wc -l)
    if [ $error_handling -gt 0 ]; then
        echo -e "${GREEN}✓ Error handling implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Missing error handling" "contracts/src" "0"
    fi
    
    # Check for access control patterns
    local access_controls=$(grep -r "require!\|has_one" src/ | wc -l)
    if [ $access_controls -gt 0 ]; then
        echo -e "${GREEN}✓ Access controls implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "Missing access controls" "contracts/src" "0"
    fi
    
    # Check for rate limiting
    local rate_limiting=$(grep -r "timestamp\|interval" src/ | wc -l)
    if [ $rate_limiting -gt 0 ]; then
        echo -e "${GREEN}✓ Rate limiting implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Missing rate limiting" "contracts/src" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to check TypeScript bot security
check_typescript_security() {
    echo "Checking TypeScript bot security..." | tee -a "$AUDIT_LOG"
    
    cd "$PROJECT_ROOT/bots"
    
    # Check for proper error handling
    local error_handling=$(grep -r "try\|catch\|throw" src/ | wc -l)
    if [ $error_handling -gt 0 ]; then
        echo -e "${GREEN}✓ Error handling implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Missing error handling" "bots/src" "0"
    fi
    
    # Check for input validation
    local input_validation=$(grep -r "validate\|sanitize\|check" src/ | wc -l)
    if [ $input_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Input validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Missing input validation" "bots/src" "0"
    fi
    
    # Check for rate limiting
    local rate_limiting=$(grep -r "rate.*limit\|throttle\|delay" src/ | wc -l)
    if [ $rate_limiting -gt 0 ]; then
        echo -e "${GREEN}✓ Rate limiting implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Missing rate limiting" "bots/src" "0"
    fi
    
    # Check for secure key handling
    local key_handling=$(grep -r "process\.env\|Keypair\.fromSecretKey" src/ | wc -l)
    if [ $key_handling -gt 0 ]; then
        echo -e "${GREEN}✓ Secure key handling implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "Insecure key handling" "bots/src" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to check dependency security
check_dependencies() {
    echo "Checking dependency security..." | tee -a "$AUDIT_LOG"
    
    # Check for known vulnerabilities in Node.js dependencies
    if command -v npm-audit &> /dev/null; then
        cd "$PROJECT_ROOT/bots"
        if npm audit --audit-level=high 2>/dev/null | grep -q "found"; then
            log_issue "HIGH" "High severity vulnerabilities in npm dependencies" "bots/package.json" "0"
        else
            echo -e "${GREEN}✓ No high severity npm vulnerabilities found${NC}" | tee -a "$AUDIT_LOG"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # Check for outdated dependencies
    cd "$PROJECT_ROOT/bots"
    if npm outdated 2>/dev/null | grep -q "WARN"; then
        log_issue "MEDIUM" "Outdated dependencies found" "bots/package.json" "0"
    else
        echo -e "${GREEN}✓ Dependencies are up to date${NC}" | tee -a "$AUDIT_LOG"
    fi
    cd "$PROJECT_ROOT"
}

# Function to check configuration security
check_configuration() {
    echo "Checking configuration security..." | tee -a "$AUDIT_LOG"
    
    # Check if .env file exists and is not committed
    if [ -f ".env" ]; then
        if git ls-files | grep -q ".env"; then
            log_issue "CRITICAL" ".env file is committed to git" ".env" "0"
        else
            echo -e "${GREEN}✓ .env file is properly excluded from git${NC}" | tee -a "$AUDIT_LOG"
        fi
    else
        log_issue "MEDIUM" ".env file not found (use env.example as template)" ".env" "0"
    fi
    
    # Check .gitignore for security exclusions
    if grep -q "\.env\|\.key\|secrets" .gitignore; then
        echo -e "${GREEN}✓ .gitignore properly excludes sensitive files${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" ".gitignore missing security exclusions" ".gitignore" "0"
    fi
    
    # Check for proper environment variable usage
    local env_vars=$(grep -r "process\.env\." "$PROJECT_ROOT/bots/src" | wc -l)
    if [ $env_vars -gt 0 ]; then
        echo -e "${GREEN}✓ Environment variables properly used${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Environment variables not properly used" "bots/src" "0"
    fi
}

# Function to check code quality and best practices
check_code_quality() {
    echo "Checking code quality and best practices..." | tee -a "$AUDIT_LOG"
    
    # Check for proper documentation
    local documentation=$(find . -name "*.md" -o -name "*.rs" -o -name "*.ts" | xargs grep -l "///\|//\|/\*" | wc -l)
    if [ $documentation -gt 0 ]; then
        echo -e "${GREEN}✓ Code documentation present${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "Missing code documentation" "multiple" "0"
    fi
    
    # Check for consistent error handling patterns
    local error_patterns=$(grep -r "Result<\|Error\|Exception" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | wc -l)
    if [ $error_patterns -gt 0 ]; then
        echo -e "${GREEN}✓ Consistent error handling patterns${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "Inconsistent error handling" "multiple" "0"
    fi
    
    # Check for security comments and TODO items
    local security_todos=$(grep -r "TODO.*security\|FIXME.*security\|HACK.*security" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | wc -l)
    if [ $security_todos -gt 0 ]; then
        log_issue "MEDIUM" "Security-related TODO items found" "multiple" "0"
    else
        echo -e "${GREEN}✓ No security-related TODO items${NC}" | tee -a "$AUDIT_LOG"
    fi
}

# Function to check for common security anti-patterns
check_anti_patterns() {
    echo "Checking for security anti-patterns..." | tee -a "$AUDIT_LOG"
    
    # Check for eval() usage
    if grep -r "eval(" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git; then
        log_issue "CRITICAL" "eval() usage found - potential code injection" "multiple" "0"
    else
        echo -e "${GREEN}✓ No eval() usage found${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    # Check for SQL injection patterns
    if grep -r "SELECT.*\$\{.*\}\|INSERT.*\$\{.*\}\|UPDATE.*\$\{.*\}" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git; then
        log_issue "HIGH" "Potential SQL injection patterns found" "multiple" "0"
    else
        echo -e "${GREEN}✓ No SQL injection patterns found${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    # Check for XSS patterns
    if grep -r "innerHTML.*=.*\$\{.*\}\|document\.write.*\$\{.*\}" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git; then
        log_issue "HIGH" "Potential XSS patterns found" "multiple" "0"
    else
        echo -e "${GREEN}✓ No XSS patterns found${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    # Check for hardcoded URLs
    if grep -r "http://\|https://" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git | grep -v "example\|placeholder"; then
        log_issue "MEDIUM" "Hardcoded URLs found" "multiple" "0"
    else
        echo -e "${GREEN}✓ No hardcoded URLs found${NC}" | tee -a "$AUDIT_LOG"
    fi
}

# Function to generate audit report
generate_report() {
    echo "" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
    echo "AUDIT SUMMARY" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
    echo "Critical Issues: $CRITICAL_ISSUES" | tee -a "$AUDIT_LOG"
    echo "High Issues: $HIGH_ISSUES" | tee -a "$AUDIT_LOG"
    echo "Medium Issues: $MEDIUM_ISSUES" | tee -a "$AUDIT_LOG"
    echo "Low Issues: $LOW_ISSUES" | tee -a "$AUDIT_LOG"
    echo "" | tee -a "$AUDIT_LOG"
    
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        echo -e "${RED}❌ CRITICAL ISSUES FOUND - IMMEDIATE ACTION REQUIRED${NC}" | tee -a "$AUDIT_LOG"
        exit 1
    elif [ $HIGH_ISSUES -gt 0 ]; then
        echo -e "${YELLOW}⚠️  HIGH ISSUES FOUND - REVIEW REQUIRED${NC}" | tee -a "$AUDIT_LOG"
        exit 2
    else
        echo -e "${GREEN}✅ NO CRITICAL OR HIGH ISSUES FOUND${NC}" | tee -a "$AUDIT_LOG"
        echo "Audit log saved to: $AUDIT_LOG" | tee -a "$AUDIT_LOG"
    fi
}

# Main audit execution
main() {
    check_hardcoded_secrets
    check_rust_security
    check_typescript_security
    check_dependencies
    check_configuration
    check_code_quality
    check_anti_patterns
    generate_report
}

# Run the audit
main "$@" 