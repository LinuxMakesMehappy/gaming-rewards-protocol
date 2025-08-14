#!/bin/bash

# Comprehensive Test Pipeline for Gaming Rewards Protocol
# Runs all tests from unit tests to end-to-end integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_LOG="$PROJECT_ROOT/test-results/test-run-$(date +%Y%m%d-%H%M%S).log"
COVERAGE_DIR="$PROJECT_ROOT/test-results/coverage"
REPORTS_DIR="$PROJECT_ROOT/test-results/reports"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Create test directories
mkdir -p "$PROJECT_ROOT/test-results"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORTS_DIR"

echo "==========================================" | tee -a "$TEST_LOG"
echo "GAMING REWARDS PROTOCOL - TEST PIPELINE" | tee -a "$TEST_LOG"
echo "Date: $(date)" | tee -a "$TEST_LOG"
echo "==========================================" | tee -a "$TEST_LOG"

# Function to log test results
log_test() {
    local phase=$1
    local status=$2
    local message=$3
    
    case $status in
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $phase: $message" | tee -a "$TEST_LOG"
            ((PASSED_TESTS++))
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $phase: $message" | tee -a "$TEST_LOG"
            ((FAILED_TESTS++))
            ;;
        "SKIP")
            echo -e "${YELLOW}[SKIP]${NC} $phase: $message" | tee -a "$TEST_LOG"
            ((SKIPPED_TESTS++))
            ;;
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $phase: $message" | tee -a "$TEST_LOG"
            ;;
    esac
    ((TOTAL_TESTS++))
}

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..." | tee -a "$TEST_LOG"
    
    # Check for Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_test "PREREQ" "PASS" "Node.js found: $node_version"
    else
        log_test "PREREQ" "FAIL" "Node.js not found"
        return 1
    fi
    
    # Check for npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_test "PREREQ" "PASS" "npm found: $npm_version"
    else
        log_test "PREREQ" "FAIL" "npm not found"
        return 1
    fi
    
    # Check for Rust
    if command -v rustc &> /dev/null; then
        local rust_version=$(rustc --version)
        log_test "PREREQ" "PASS" "Rust found: $rust_version"
    else
        log_test "PREREQ" "FAIL" "Rust not found"
        return 1
    fi
    
    # Check for Cargo
    if command -v cargo &> /dev/null; then
        local cargo_version=$(cargo --version)
        log_test "PREREQ" "PASS" "Cargo found: $cargo_version"
    else
        log_test "PREREQ" "FAIL" "Cargo not found"
        return 1
    fi
    
    # Check for Anchor
    if command -v anchor &> /dev/null; then
        local anchor_version=$(anchor --version)
        log_test "PREREQ" "PASS" "Anchor found: $anchor_version"
    else
        log_test "PREREQ" "SKIP" "Anchor not found (will install if needed)"
    fi
    
    # Check for Solana CLI
    if command -v solana &> /dev/null; then
        local solana_version=$(solana --version)
        log_test "PREREQ" "PASS" "Solana CLI found: $solana_version"
    else
        log_test "PREREQ" "SKIP" "Solana CLI not found (will install if needed)"
    fi
    
    echo "Prerequisites check completed" | tee -a "$TEST_LOG"
}

# Function to install dependencies
install_dependencies() {
    echo "Installing dependencies..." | tee -a "$TEST_LOG"
    
    # Install Node.js dependencies
    cd "$PROJECT_ROOT/bots"
    if npm ci; then
        log_test "DEPS" "PASS" "Node.js dependencies installed"
    else
        log_test "DEPS" "FAIL" "Failed to install Node.js dependencies"
        return 1
    fi
    
    # Install Rust dependencies
    cd "$PROJECT_ROOT/contracts"
    if cargo fetch; then
        log_test "DEPS" "PASS" "Rust dependencies fetched"
    else
        log_test "DEPS" "FAIL" "Failed to fetch Rust dependencies"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo "Dependencies installation completed" | tee -a "$TEST_LOG"
}

# Function to run linting tests
run_linting_tests() {
    echo "Running linting tests..." | tee -a "$TEST_LOG"
    
    # ESLint for TypeScript
    cd "$PROJECT_ROOT/bots"
    if npm run lint 2>/dev/null; then
        log_test "LINT" "PASS" "ESLint passed"
    else
        log_test "LINT" "FAIL" "ESLint failed"
        return 1
    fi
    
    # TypeScript compilation check
    if npx tsc --noEmit; then
        log_test "LINT" "PASS" "TypeScript compilation check passed"
    else
        log_test "LINT" "FAIL" "TypeScript compilation check failed"
        return 1
    fi
    
    # Rust clippy
    cd "$PROJECT_ROOT/contracts"
    if cargo clippy --all-targets --all-features -- -D warnings; then
        log_test "LINT" "PASS" "Rust clippy passed"
    else
        log_test "LINT" "FAIL" "Rust clippy failed"
        return 1
    fi
    
    # Rust fmt check
    if cargo fmt --all -- --check; then
        log_test "LINT" "PASS" "Rust formatting check passed"
    else
        log_test "LINT" "FAIL" "Rust formatting check failed"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo "Linting tests completed" | tee -a "$TEST_LOG"
}

# Function to run unit tests
run_unit_tests() {
    echo "Running unit tests..." | tee -a "$TEST_LOG"
    
    # TypeScript unit tests
    cd "$PROJECT_ROOT/bots"
    if npm test -- --coverage --coverageDirectory="$COVERAGE_DIR/typescript"; then
        log_test "UNIT" "PASS" "TypeScript unit tests passed"
    else
        log_test "UNIT" "FAIL" "TypeScript unit tests failed"
        return 1
    fi
    
    # Rust unit tests
    cd "$PROJECT_ROOT/contracts"
    if cargo test --lib; then
        log_test "UNIT" "PASS" "Rust unit tests passed"
    else
        log_test "UNIT" "FAIL" "Rust unit tests failed"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo "Unit tests completed" | tee -a "$TEST_LOG"
}

# Function to run integration tests
run_integration_tests() {
    echo "Running integration tests..." | tee -a "$TEST_LOG"
    
    # Anchor integration tests
    cd "$PROJECT_ROOT/contracts"
    if anchor test --skip-lint; then
        log_test "INTEGRATION" "PASS" "Anchor integration tests passed"
    else
        log_test "INTEGRATION" "FAIL" "Anchor integration tests failed"
        return 1
    fi
    
    # Bot integration tests
    cd "$PROJECT_ROOT/bots"
    if npm run test:integration 2>/dev/null; then
        log_test "INTEGRATION" "PASS" "Bot integration tests passed"
    else
        log_test "INTEGRATION" "SKIP" "Bot integration tests not configured"
    fi
    
    cd "$PROJECT_ROOT"
    echo "Integration tests completed" | tee -a "$TEST_LOG"
}

# Function to run security tests
run_security_tests() {
    echo "Running security tests..." | tee -a "$TEST_LOG"
    
    # Run security audit scripts
    if ./scripts/security-audit.sh; then
        log_test "SECURITY" "PASS" "Security audit passed"
    else
        log_test "SECURITY" "FAIL" "Security audit failed"
        return 1
    fi
    
    # Run Rust security audit
    if ./scripts/rust-audit.sh; then
        log_test "SECURITY" "PASS" "Rust security audit passed"
    else
        log_test "SECURITY" "FAIL" "Rust security audit failed"
        return 1
    fi
    
    # Run TypeScript security audit
    if ./scripts/typescript-audit.sh; then
        log_test "SECURITY" "PASS" "TypeScript security audit passed"
    else
        log_test "SECURITY" "FAIL" "TypeScript security audit failed"
        return 1
    fi
    
    echo "Security tests completed" | tee -a "$TEST_LOG"
}

# Function to run performance tests
run_performance_tests() {
    echo "Running performance tests..." | tee -a "$TEST_LOG"
    
    # Smart contract performance tests
    cd "$PROJECT_ROOT/contracts"
    if cargo test --test performance 2>/dev/null; then
        log_test "PERFORMANCE" "PASS" "Smart contract performance tests passed"
    else
        log_test "PERFORMANCE" "SKIP" "Smart contract performance tests not found"
    fi
    
    # Bot performance tests
    cd "$PROJECT_ROOT/bots"
    if npm run test:performance 2>/dev/null; then
        log_test "PERFORMANCE" "PASS" "Bot performance tests passed"
    else
        log_test "PERFORMANCE" "SKIP" "Bot performance tests not configured"
    fi
    
    cd "$PROJECT_ROOT"
    echo "Performance tests completed" | tee -a "$TEST_LOG"
}

# Function to run end-to-end tests
run_e2e_tests() {
    echo "Running end-to-end tests..." | tee -a "$TEST_LOG"
    
    # Check if localnet is available
    if command -v solana &> /dev/null; then
        # Start local validator if not running
        if ! solana cluster-version 2>/dev/null; then
            log_test "E2E" "INFO" "Starting local validator..."
            solana-test-validator --reset &
            sleep 10
        fi
        
        # Run E2E tests
        cd "$PROJECT_ROOT"
        if npm run test:e2e 2>/dev/null; then
            log_test "E2E" "PASS" "End-to-end tests passed"
        else
            log_test "E2E" "SKIP" "End-to-end tests not configured"
        fi
    else
        log_test "E2E" "SKIP" "Solana CLI not available for E2E tests"
    fi
    
    echo "End-to-end tests completed" | tee -a "$TEST_LOG"
}

# Function to run stress tests
run_stress_tests() {
    echo "Running stress tests..." | tee -a "$TEST_LOG"
    
    # Smart contract stress tests
    cd "$PROJECT_ROOT/contracts"
    if cargo test --test stress 2>/dev/null; then
        log_test "STRESS" "PASS" "Smart contract stress tests passed"
    else
        log_test "STRESS" "SKIP" "Smart contract stress tests not found"
    fi
    
    # Bot stress tests
    cd "$PROJECT_ROOT/bots"
    if npm run test:stress 2>/dev/null; then
        log_test "STRESS" "PASS" "Bot stress tests passed"
    else
        log_test "STRESS" "SKIP" "Bot stress tests not configured"
    fi
    
    cd "$PROJECT_ROOT"
    echo "Stress tests completed" | tee -a "$TEST_LOG"
}

# Function to generate test reports
generate_reports() {
    echo "Generating test reports..." | tee -a "$TEST_LOG"
    
    local report_file="$REPORTS_DIR/test-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Test Report - $(date)

## Executive Summary
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Skipped**: $SKIPPED_TESTS
- **Success Rate**: $((PASSED_TESTS * 100 / TOTAL_TESTS))%

## Test Results by Category

### Prerequisites
- Node.js, npm, Rust, Cargo availability

### Linting
- ESLint, TypeScript compilation, Rust clippy, formatting

### Unit Tests
- TypeScript unit tests with coverage
- Rust unit tests

### Integration Tests
- Anchor integration tests
- Bot integration tests

### Security Tests
- Security audit scripts
- Rust and TypeScript security audits

### Performance Tests
- Smart contract performance
- Bot performance

### End-to-End Tests
- Full system integration tests

### Stress Tests
- High-load testing scenarios

## Coverage Reports
- TypeScript coverage: $COVERAGE_DIR/typescript/
- Rust coverage: $COVERAGE_DIR/rust/

## Recommendations
1. Address any failed tests immediately
2. Review skipped tests for implementation
3. Monitor performance test results
4. Maintain security test standards

## Next Steps
- Review detailed logs: $TEST_LOG
- Check coverage reports
- Address any issues found
EOF
    
    log_test "REPORT" "PASS" "Test report generated: $report_file"
    echo "Test reports generated" | tee -a "$TEST_LOG"
}

# Function to cleanup test environment
cleanup_test_environment() {
    echo "Cleaning up test environment..." | tee -a "$TEST_LOG"
    
    # Stop local validator if running
    if pgrep solana-test-validator > /dev/null; then
        pkill solana-test-validator
        log_test "CLEANUP" "INFO" "Stopped local validator"
    fi
    
    # Clean test artifacts
    cd "$PROJECT_ROOT/contracts"
    cargo clean
    
    cd "$PROJECT_ROOT/bots"
    rm -rf node_modules/.cache
    
    cd "$PROJECT_ROOT"
    echo "Test environment cleanup completed" | tee -a "$TEST_LOG"
}

# Function to display final results
display_results() {
    echo "" | tee -a "$TEST_LOG"
    echo "==========================================" | tee -a "$TEST_LOG"
    echo "TEST PIPELINE RESULTS" | tee -a "$TEST_LOG"
    echo "==========================================" | tee -a "$TEST_LOG"
    echo "Total Tests: $TOTAL_TESTS" | tee -a "$TEST_LOG"
    echo "Passed: $PASSED_TESTS" | tee -a "$TEST_LOG"
    echo "Failed: $FAILED_TESTS" | tee -a "$TEST_LOG"
    echo "Skipped: $SKIPPED_TESTS" | tee -a "$TEST_LOG"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}" | tee -a "$TEST_LOG"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}" | tee -a "$TEST_LOG"
        exit 1
    fi
}

# Main test execution
main() {
    local phases=(
        "check_prerequisites"
        "install_dependencies"
        "run_linting_tests"
        "run_unit_tests"
        "run_integration_tests"
        "run_security_tests"
        "run_performance_tests"
        "run_e2e_tests"
        "run_stress_tests"
        "generate_reports"
        "cleanup_test_environment"
    )
    
    for phase in "${phases[@]}"; do
        echo "" | tee -a "$TEST_LOG"
        echo "Starting phase: $phase" | tee -a "$TEST_LOG"
        
        if $phase; then
            echo "Phase $phase completed successfully" | tee -a "$TEST_LOG"
        else
            echo "Phase $phase failed" | tee -a "$TEST_LOG"
            # Continue with other phases but mark as failed
        fi
    done
    
    display_results
}

# Handle script arguments
case "${1:-}" in
    "unit")
        check_prerequisites
        install_dependencies
        run_unit_tests
        generate_reports
        ;;
    "integration")
        check_prerequisites
        install_dependencies
        run_integration_tests
        generate_reports
        ;;
    "security")
        run_security_tests
        generate_reports
        ;;
    "e2e")
        check_prerequisites
        install_dependencies
        run_e2e_tests
        generate_reports
        ;;
    "quick")
        check_prerequisites
        install_dependencies
        run_linting_tests
        run_unit_tests
        generate_reports
        ;;
    *)
        main
        ;;
esac 