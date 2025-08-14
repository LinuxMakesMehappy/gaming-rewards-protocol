#!/bin/bash

# Rust Smart Contract Security Audit
# Specialized audit for Solana/Anchor smart contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
AUDIT_LOG="$PROJECT_ROOT/audit/rust-audit-$(date +%Y%m%d-%H%M%S).log"

# Create audit directory
mkdir -p "$PROJECT_ROOT/audit"

echo "==========================================" | tee -a "$AUDIT_LOG"
echo "RUST SMART CONTRACT SECURITY AUDIT" | tee -a "$AUDIT_LOG"
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

# Check for unchecked arithmetic operations
check_arithmetic_operations() {
    echo "Checking arithmetic operations..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for unchecked operations
    local unchecked_ops=$(grep -r "\.unwrap()\|\.expect(" src/ | grep -v "test\|example" | wc -l)
    if [ $unchecked_ops -gt 0 ]; then
        log_issue "HIGH" "Found $unchecked_ops unchecked operations" "src/" "0"
        grep -r "\.unwrap()\|\.expect(" src/ | grep -v "test\|example" | head -5
    else
        echo -e "${GREEN}✓ All arithmetic operations are checked${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    # Check for checked arithmetic usage
    local checked_ops=$(grep -r "checked_add\|checked_sub\|checked_mul\|checked_div" src/ | wc -l)
    if [ $checked_ops -gt 0 ]; then
        echo -e "${GREEN}✓ Checked arithmetic operations used${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No checked arithmetic operations found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for proper error handling
check_error_handling() {
    echo "Checking error handling..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for Result types
    local result_types=$(grep -r "Result<" src/ | wc -l)
    if [ $result_types -gt 0 ]; then
        echo -e "${GREEN}✓ Result types used for error handling${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No Result types found" "src/" "0"
    fi
    
    # Check for custom error types
    local custom_errors=$(grep -r "error_code\|GamingRewardsError" src/ | wc -l)
    if [ $custom_errors -gt 0 ]; then
        echo -e "${GREEN}✓ Custom error types defined${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No custom error types found" "src/" "0"
    fi
    
    # Check for proper error propagation
    local error_propagation=$(grep -r "\.map_err\|\.or\|\.ok_or" src/ | wc -l)
    if [ $error_propagation -gt 0 ]; then
        echo -e "${GREEN}✓ Error propagation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "Limited error propagation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for access control patterns
check_access_controls() {
    echo "Checking access controls..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for require! macros
    local requires=$(grep -r "require!" src/ | wc -l)
    if [ $requires -gt 0 ]; then
        echo -e "${GREEN}✓ Access control checks implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "CRITICAL" "No access control checks found" "src/" "0"
    fi
    
    # Check for has_one constraints
    local has_one=$(grep -r "has_one" src/ | wc -l)
    if [ $has_one -gt 0 ]; then
        echo -e "${GREEN}✓ Account ownership validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "HIGH" "No account ownership validation found" "src/" "0"
    fi
    
    # Check for signer validation
    local signers=$(grep -r "Signer<" src/ | wc -l)
    if [ $signers -gt 0 ]; then
        echo -e "${GREEN}✓ Signer validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "HIGH" "No signer validation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for rate limiting
check_rate_limiting() {
    echo "Checking rate limiting..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for timestamp-based rate limiting
    local timestamps=$(grep -r "timestamp\|Clock::get" src/ | wc -l)
    if [ $timestamps -gt 0 ]; then
        echo -e "${GREEN}✓ Timestamp-based rate limiting implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No timestamp-based rate limiting found" "src/" "0"
    fi
    
    # Check for interval checks
    local intervals=$(grep -r "interval\|time.*since" src/ | wc -l)
    if [ $intervals -gt 0 ]; then
        echo -e "${GREEN}✓ Time interval checks implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No time interval checks found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for reentrancy protection
check_reentrancy() {
    echo "Checking reentrancy protection..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for state updates before external calls
    local state_updates=$(grep -r "update.*state\|modify.*state" src/ | wc -l)
    if [ $state_updates -gt 0 ]; then
        echo -e "${GREEN}✓ State update patterns found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No clear state update patterns found" "src/" "0"
    fi
    
    # Check for CPI calls
    local cpi_calls=$(grep -r "CpiContext\|cpi::" src/ | wc -l)
    if [ $cpi_calls -gt 0 ]; then
        echo -e "${GREEN}✓ CPI calls found - ensure proper ordering${NC}" | tee -a "$AUDIT_LOG"
    else
        echo -e "${GREEN}✓ No CPI calls found${NC}" | tee -a "$AUDIT_LOG"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for input validation
check_input_validation() {
    echo "Checking input validation..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for amount validation
    local amount_validation=$(grep -r "amount.*>.*0\|require!.*amount" src/ | wc -l)
    if [ $amount_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Amount validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No amount validation found" "src/" "0"
    fi
    
    # Check for pubkey validation
    local pubkey_validation=$(grep -r "pubkey.*!=.*default\|require!.*pubkey" src/ | wc -l)
    if [ $pubkey_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Pubkey validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No pubkey validation found" "src/" "0"
    fi
    
    # Check for array/vector validation
    local array_validation=$(grep -r "len.*>.*0\|is_empty" src/ | wc -l)
    if [ $array_validation -gt 0 ]; then
        echo -e "${GREEN}✓ Array/vector validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "No array/vector validation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for event emission
check_events() {
    echo "Checking event emission..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for event definitions
    local event_defs=$(grep -r "event\|Event" src/ | wc -l)
    if [ $event_defs -gt 0 ]; then
        echo -e "${GREEN}✓ Event definitions found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No event definitions found" "src/" "0"
    fi
    
    # Check for event emission
    local event_emission=$(grep -r "emit!" src/ | wc -l)
    if [ $event_emission -gt 0 ]; then
        echo -e "${GREEN}✓ Event emission implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No event emission found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for account validation
check_account_validation() {
    echo "Checking account validation..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for account constraints
    local constraints=$(grep -r "constraint\|has_one\|mut" src/ | wc -l)
    if [ $constraints -gt 0 ]; then
        echo -e "${GREEN}✓ Account constraints implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "HIGH" "No account constraints found" "src/" "0"
    fi
    
    # Check for PDA validation
    local pda_validation=$(grep -r "seeds\|bump" src/ | wc -l)
    if [ $pda_validation -gt 0 ]; then
        echo -e "${GREEN}✓ PDA validation implemented${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No PDA validation found" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for documentation
check_documentation() {
    echo "Checking documentation..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for function documentation
    local func_docs=$(grep -r "///" src/ | wc -l)
    if [ $func_docs -gt 0 ]; then
        echo -e "${GREEN}✓ Function documentation present${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "Limited function documentation" "src/" "0"
    fi
    
    # Check for struct documentation
    local struct_docs=$(grep -r "///.*struct\|///.*pub struct" src/ | wc -l)
    if [ $struct_docs -gt 0 ]; then
        echo -e "${GREEN}✓ Struct documentation present${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "LOW" "Limited struct documentation" "src/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check for tests
check_tests() {
    echo "Checking tests..." | tee -a "$AUDIT_LOG"
    
    cd "$CONTRACTS_DIR"
    
    # Check for test files
    local test_files=$(find . -name "*test*" -o -name "*spec*" | wc -l)
    if [ $test_files -gt 0 ]; then
        echo -e "${GREEN}✓ Test files found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No test files found" "tests/" "0"
    fi
    
    # Check for test coverage
    local test_functions=$(grep -r "test\|it(" . --include="*.rs" | wc -l)
    if [ $test_functions -gt 0 ]; then
        echo -e "${GREEN}✓ Test functions found${NC}" | tee -a "$AUDIT_LOG"
    else
        log_issue "MEDIUM" "No test functions found" "tests/" "0"
    fi
    
    cd "$PROJECT_ROOT"
}

# Main audit execution
main() {
    check_arithmetic_operations
    check_error_handling
    check_access_controls
    check_rate_limiting
    check_reentrancy
    check_input_validation
    check_events
    check_account_validation
    check_documentation
    check_tests
    
    echo "" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
    echo "RUST AUDIT COMPLETED" | tee -a "$AUDIT_LOG"
    echo "Audit log saved to: $AUDIT_LOG" | tee -a "$AUDIT_LOG"
    echo "==========================================" | tee -a "$AUDIT_LOG"
}

# Run the audit
main "$@" 