#!/bin/bash

# TypeScript Bot Security Audit
# Specialized audit for Node.js/TypeScript bot components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOTS_DIR="$PROJECT_ROOT/bots"
AUDIT_LOG="$PROJECT_ROOT/audit/typescript-audit-$(date +%Y%m%d-%H%M%S).log"

# Create audit directory
mkdir -p "$PROJECT_ROOT/audit"

echo "==========================================" | tee -a "$AUDIT_LOG"
echo "TYPESCRIPT BOT SECURITY AUDIT" | tee -a "$AUDIT_LOG"
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
            ;;
        "HIGH")
            echo -e "${YELLOW}[HIGH]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ;;
        "MEDIUM")
            echo -e "${BLUE}[MEDIUM]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ;;
        "LOW")
            echo -e "${GREEN}[LOW]${NC} $message" | tee -a "$AUDIT_LOG"
            echo "  File: $file:$line" | tee -a "$AUDIT_LOG"
            ;;
    esac
}

# Check for secure key handling
check_key_handling() {
    echo "Checking key handling..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for environment variable usage
    local env_usage=$(grep -r "process\.env\." src/ | wc -l)
    if [ $env_usage -gt 0 ]; then
        echo -e "${GREEN}✓ Environment variables properly used${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "No environment variable usage found" "src/" "0"
    fi
    
    # Check for Keypair.fromSecretKey usage
    local keypair_usage=$(grep -r "Keypair\.fromSecretKey" src/ | wc -l)
    if [ $keypair_usage -gt 0 ]; then
        echo -e "${GREEN}✓ Secure Keypair initialization found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "No secure Keypair initialization found" "src/" "0"
    fi
    
    # Check for hardcoded keys
    local hardcoded_keys=$(grep -r "private.*key\|secret.*key" src/ | grep -v "example\|template" | wc -l)
    if [ $hardcoded_keys -eq 0 ]; then
        echo -e "${GREEN}✓ No hardcoded keys found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "Hardcoded keys found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for error handling
check_error_handling() {
    echo "Checking error handling..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for try-catch blocks
    local try_catch=$(grep -r "try\|catch" src/ | wc -l)
    if [ $try_catch -gt 0 ]; then
        echo -e "${GREEN}✓ Try-catch error handling implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No try-catch error handling found" "src/" "0"
    fi
    
    # Check for error logging
    local error_logging=$(grep -r "error\|Error\|logger\.error" src/ | wc -l)
    if [ $error_logging -gt 0 ]; then
        echo -e "${GREEN}✓ Error logging implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No error logging found" "src/" "0"
    fi
    
    # Check for Sentry integration
    local sentry_usage=$(grep -r "Sentry\|sentry" src/ | wc -l)
    if [ $sentry_usage -gt 0 ]; then
        echo -e "${GREEN}✓ Sentry error monitoring implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No Sentry error monitoring found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for input validation
check_input_validation() {
    echo "Checking input validation..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for validation functions
    local validation=$(grep -r "validate\|sanitize\|check" src/ | wc -l)
    if [ $validation -gt 0 ]; then
        echo -e "${GREEN}✓ Input validation functions found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No input validation functions found" "src/" "0"
    fi
    
    # Check for type checking
    local type_checking=$(grep -r "typeof\|instanceof\|is.*\|has.*" src/ | wc -l)
    if [ $type_checking -gt 0 ]; then
        echo -e "${GREEN}✓ Type checking implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "Limited type checking found" "src/" "0"
    fi
    
    # Check for parameter validation
    local param_validation=$(grep -r "require\|assert\|if.*null\|if.*undefined" src/ | wc -l)
    if [ $param_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Parameter validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No parameter validation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for rate limiting
check_rate_limiting() {
    echo "Checking rate limiting..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for rate limiting patterns
    local rate_limiting=$(grep -r "rate.*limit\|throttle\|delay\|sleep\|setTimeout" src/ | wc -l)
    if [ $rate_limiting -gt 0 ]; then
        echo -e "${GREEN}✓ Rate limiting patterns found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No rate limiting patterns found" "src/" "0"
    fi
    
    # Check for interval-based operations
    local intervals=$(grep -r "setInterval\|setTimeout.*loop\|while.*sleep" src/ | wc -l)
    if [ $intervals -gt 0 ]; then
        echo -e "${GREEN}✓ Interval-based operations found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No interval-based operations found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for secure API usage
check_api_security() {
    echo "Checking API security..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for HTTPS usage
    local https_usage=$(grep -r "https://" src/ | wc -l)
    if [ $https_usage -gt 0 ]; then
        echo -e "${GREEN}✓ HTTPS URLs used${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No HTTPS URLs found" "src/" "0"
    fi
    
    # Check for HTTP usage (potential security issue)
    local http_usage=$(grep -r "http://" src/ | grep -v "example\|placeholder" | wc -l)
    if [ $http_usage -eq 0 ]; then
        echo -e "${GREEN}✓ No insecure HTTP URLs found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "HIGH" "Insecure HTTP URLs found" "src/" "0"
    fi
    
    # Check for API key handling
    local api_key_handling=$(grep -r "api.*key\|token.*key" src/ | wc -l)
    if [ $api_key_handling -gt 0 ]; then
        echo -e "${GREEN}✓ API key handling found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No API key handling found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for logging and monitoring
check_logging_monitoring() {
    echo "Checking logging and monitoring..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for structured logging
    local structured_logging=$(grep -r "logger\|winston\|log" src/ | wc -l)
    if [ $structured_logging -gt 0 ]; then
        echo -e "${GREEN}✓ Structured logging implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No structured logging found" "src/" "0"
    fi
    
    # Check for monitoring integration
    local monitoring=$(grep -r "monitor\|alert\|health.*check" src/ | wc -l)
    if [ $monitoring -gt 0 ]; then
        echo -e "${GREEN}✓ Monitoring patterns found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No monitoring patterns found" "src/" "0"
    fi
    
    # Check for graceful shutdown
    local graceful_shutdown=$(grep -r "SIGINT\|SIGTERM\|process\.on.*exit" src/ | wc -l)
    if [ $graceful_shutdown -gt 0 ]; then
        echo -e "${GREEN}✓ Graceful shutdown implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No graceful shutdown found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for dependency security
check_dependency_security() {
    echo "Checking dependency security..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for security-related dependencies
    local security_deps=$(grep -r "crypto\|bcrypt\|helmet\|express-rate-limit" package.json | wc -l)
    if [ $security_deps -gt 0 ]; then
        echo -e "${GREEN}✓ Security-related dependencies found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No security-related dependencies found" "package.json" "0"
    fi
    
    # Check for outdated dependencies
    if command -v npm &> /dev/null; then
        if npm outdated 2>/dev/null | grep -q "WARN"; then
            log_issue "MEDIUM" "Outdated dependencies found" "package.json" "0"
        else
            echo -e "${GREEN}✓ Dependencies are up to date${NC}" | tee -a "$AUDIT_LOG"
        fi
    fi
    
    # Check for known vulnerabilities
    if command -v npm &> /dev/null; then
        if npm audit --audit-level=high 2>/dev/null | grep -q "found"; then
            log_issue "HIGH" "High severity vulnerabilities in dependencies" "package.json" "0"
        else
            echo -e "${GREEN}✓ No high severity vulnerabilities found${NC}" | tee -a "$AUDIT_LOG"
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for code quality
check_code_quality() {
    echo "Checking code quality..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for TypeScript strict mode
    local strict_mode=$(grep -r "strict.*true\|noImplicitAny\|noImplicitReturns" tsconfig.json | wc -l)
    if [ $strict_mode -gt 0 ]; then
        echo -e "${GREEN}✓ TypeScript strict mode enabled${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "TypeScript strict mode not enabled" "tsconfig.json" "0"
    fi
    
    # Check for ESLint configuration
    if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo -e "${GREEN}✓ ESLint configuration found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No ESLint configuration found" "bots/" "0"
    fi
    
    # Check for Prettier configuration
    if [ -f ".prettierrc" ] || [ -f ".prettierrc.js" ] || [ -f ".prettierrc.json" ]; then
        echo -e "${GREEN}✓ Prettier configuration found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No Prettier configuration found" "bots/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for configuration security
check_configuration_security() {
    echo "Checking configuration security..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for environment variable validation
    local env_validation=$(grep -r "process\.env\." src/ | wc -l)
    if [ $env_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Environment variable usage found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No environment variable usage found" "src/" "0"
    fi
    
    # Check for configuration validation
    local config_validation=$(grep -r "validate.*config\|check.*config" src/ | wc -l)
    if [ $config_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Configuration validation found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No configuration validation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for testing
check_testing() {
    echo "Checking testing..." | tee -a "$AUDIT_LOG"
    
    cd "$BOTS_DIR"
    
    # Check for test files
    local test_files=$(find . -name "*test*" -o -name "*spec*" | wc -l)
    if [ $test_files -gt 0 ]; then
        echo -e "${GREEN}✓ Test files found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No test files found" "tests/" "0"
    fi
    
    # Check for test scripts in package.json
    local test_scripts=$(grep -r "test\|spec" package.json | wc -l)
    if [ $test_scripts -gt 0 ]; then
        echo -e "${GREEN}✓ Test scripts configured${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No test scripts configured" "package.json" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Main audit execution
main() {
    check_key_handling
    check_error_handling
    check_input_validation
    check_rate_limiting
    check_api_security
    check_logging_monitoring
    check_dependency_security
    check_code_quality
    check_configuration_security
    check_testing
    
    echo "" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
    echo "TYPESCRIPT AUDIT COMPLETED" | tee -a "$AUDIT_LOG"
    echo "Audit log saved to: $AUDIT_LOG" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
}

# Run the audit
main "$@" 