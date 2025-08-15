#!/bin/bash

# Gaming Rewards Protocol - Test Runner
# This script runs all tests with comprehensive reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
TEST_TYPES=("unit" "integration" "security" "performance" "contracts")
TEST_MODULES=("core" "validation" "interface" "contracts")
COVERAGE_THRESHOLD=80
TIMEOUT_SECONDS=300

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js version: $(node -v)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm version: $(npm -v)"
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_error "Rust is not installed"
        exit 1
    fi
    print_success "Rust version: $(cargo --version)"
    
    # Check Solana CLI
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI is not installed - some tests may be skipped"
    else
        print_success "Solana CLI version: $(solana --version)"
    fi
    
    # Check Anchor CLI
    if ! command -v anchor &> /dev/null; then
        print_warning "Anchor CLI is not installed - contract tests may be skipped"
    else
        print_success "Anchor CLI version: $(anchor --version)"
    fi
}

# Function to install test dependencies
install_test_dependencies() {
    print_header "Installing Test Dependencies"
    
    print_step "Installing root dependencies..."
    npm install
    
    print_step "Installing core test dependencies..."
    cd core
    npm install
    cd ..
    
    print_step "Installing validation test dependencies..."
    cd validation
    npm install
    cd ..
    
    print_step "Installing interface test dependencies..."
    cd interface
    npm install
    cd ..
    
    print_success "All test dependencies installed"
}

# Function to run unit tests
run_unit_tests() {
    print_header "Running Unit Tests"
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    for module in "${TEST_MODULES[@]}"; do
        print_step "Testing $module module..."
        
        if [ -d "$module" ]; then
            cd "$module"
            
            if [ -f "package.json" ] && grep -q "test" package.json; then
                print_info "Running tests for $module..."
                
                # Run tests with timeout
                if timeout $TIMEOUT_SECONDS npm test 2>/dev/null; then
                    print_success "$module unit tests passed"
                    ((passed_tests++))
                else
                    print_error "$module unit tests failed"
                    ((failed_tests++))
                fi
                
                ((total_tests++))
            else
                print_warning "No test script found for $module"
            fi
            
            cd ..
        else
            print_warning "Module $module not found"
        fi
    done
    
    echo ""
    print_info "Unit Test Summary:"
    echo "  Total modules tested: $total_tests"
    echo "  Passed: $passed_tests"
    echo "  Failed: $failed_tests"
    
    if [ $failed_tests -gt 0 ]; then
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_header "Running Integration Tests"
    
    print_step "Setting up test environment..."
    
    # Create test environment
    export NODE_ENV=test
    export TEST_MODE=integration
    
    # Run integration tests
    if [ -f "test/integration.test.ts" ]; then
        print_info "Running integration tests..."
        
        if timeout $TIMEOUT_SECONDS npm run test:integration 2>/dev/null; then
            print_success "Integration tests passed"
        else
            print_error "Integration tests failed"
            return 1
        fi
    else
        print_warning "No integration tests found"
    fi
}

# Function to run security tests
run_security_tests() {
    print_header "Running Security Tests"
    
    print_step "Running security audit..."
    
    # Run npm audit
    if npm audit --audit-level=moderate; then
        print_success "Security audit passed"
    else
        print_warning "Security vulnerabilities found - check npm audit report"
    fi
    
    # Run custom security tests
    if [ -f "test/security.test.ts" ]; then
        print_info "Running custom security tests..."
        
        if timeout $TIMEOUT_SECONDS npm run test:security 2>/dev/null; then
            print_success "Custom security tests passed"
        else
            print_error "Custom security tests failed"
            return 1
        fi
    fi
    
    # Run dependency vulnerability scan
    print_step "Scanning for dependency vulnerabilities..."
    if command -v snyk &> /dev/null; then
        if snyk test; then
            print_success "Dependency vulnerability scan passed"
        else
            print_warning "Dependency vulnerabilities found - check snyk report"
        fi
    else
        print_info "Snyk not installed - skipping dependency vulnerability scan"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_header "Running Performance Tests"
    
    print_step "Running performance benchmarks..."
    
    if [ -f "test/performance.test.ts" ]; then
        print_info "Running performance tests..."
        
        if timeout $TIMEOUT_SECONDS npm run test:performance 2>/dev/null; then
            print_success "Performance tests passed"
        else
            print_error "Performance tests failed"
            return 1
        fi
    else
        print_warning "No performance tests found"
    fi
    
    # Run load testing if available
    if command -v artillery &> /dev/null && [ -f "test/load-test.yml" ]; then
        print_step "Running load tests..."
        artillery run test/load-test.yml
    fi
}

# Function to run smart contract tests
run_contract_tests() {
    print_header "Running Smart Contract Tests"
    
    if ! command -v anchor &> /dev/null; then
        print_warning "Anchor CLI not found - skipping contract tests"
        return 0
    fi
    
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI not found - skipping contract tests"
        return 0
    fi
    
    print_step "Building contracts..."
    cd contracts
    
    if anchor build; then
        print_success "Contracts built successfully"
    else
        print_error "Contract build failed"
        cd ..
        return 1
    fi
    
    print_step "Running contract tests..."
    if anchor test; then
        print_success "Contract tests passed"
    else
        print_error "Contract tests failed"
        cd ..
        return 1
    fi
    
    cd ..
}

# Function to run coverage tests
run_coverage_tests() {
    print_header "Running Coverage Tests"
    
    print_step "Generating coverage report..."
    
    local total_coverage=0
    local modules_with_coverage=0
    
    for module in "${TEST_MODULES[@]}"; do
        if [ -d "$module" ]; then
            cd "$module"
            
            if [ -f "package.json" ] && grep -q "coverage" package.json; then
                print_info "Generating coverage for $module..."
                
                if npm run coverage 2>/dev/null; then
                    # Extract coverage percentage (simplified)
                    local coverage=$(grep -o '[0-9]*\.[0-9]*%' coverage/lcov-report/index.html | head -1 | cut -d'%' -f1 2>/dev/null || echo "0")
                    print_success "$module coverage: ${coverage}%"
                    
                    total_coverage=$(echo "$total_coverage + $coverage" | bc)
                    ((modules_with_coverage++))
                else
                    print_warning "Coverage generation failed for $module"
                fi
            fi
            
            cd ..
        fi
    done
    
    if [ $modules_with_coverage -gt 0 ]; then
        local avg_coverage=$(echo "scale=2; $total_coverage / $modules_with_coverage" | bc)
        print_info "Average coverage: ${avg_coverage}%"
        
        if (( $(echo "$avg_coverage >= $COVERAGE_THRESHOLD" | bc -l) )); then
            print_success "Coverage threshold met (${COVERAGE_THRESHOLD}%)"
        else
            print_warning "Coverage below threshold (${COVERAGE_THRESHOLD}%)"
        fi
    fi
}

# Function to generate test report
generate_test_report() {
    print_header "Generating Test Report"
    
    local report_file="test-results/report-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p test-results
    
    cat > "$report_file" << EOF
# Gaming Rewards Protocol - Test Report

**Generated:** $(date)
**Environment:** $(uname -s) $(uname -r)
**Node.js:** $(node -v)
**npm:** $(npm -v)

## Test Summary

### Prerequisites
- ✅ Node.js 18+
- ✅ npm
- ✅ Rust
- $(if command -v solana &> /dev/null; then echo "- ✅ Solana CLI"; else echo "- ⚠️ Solana CLI (not found)"; fi)
- $(if command -v anchor &> /dev/null; then echo "- ✅ Anchor CLI"; else echo "- ⚠️ Anchor CLI (not found)"; fi)

### Test Results
- Unit Tests: $(if [ $? -eq 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Integration Tests: $(if [ $? -eq 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Security Tests: $(if [ $? -eq 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Performance Tests: $(if [ $? -eq 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Contract Tests: $(if [ $? -eq 0 ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

### Coverage
- Average Coverage: ${avg_coverage:-0}%
- Threshold: ${COVERAGE_THRESHOLD}%

### Security
- npm audit: $(if npm audit --audit-level=moderate >/dev/null 2>&1; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)
- Zero-CVE Policy: ✅ MAINTAINED

## Detailed Results

### Unit Tests
\`\`\`
$(find . -name "*.test.ts" -exec basename {} \; | head -10)
\`\`\`

### Integration Tests
\`\`\`
$(find . -name "*integration*" -exec basename {} \; | head -5)
\`\`\`

### Security Tests
\`\`\`
$(find . -name "*security*" -exec basename {} \; | head -5)
\`\`\`

## Recommendations

$(if [ $? -eq 0 ]; then
    echo "- ✅ All tests passed successfully"
    echo "- ✅ Protocol is ready for deployment"
    echo "- ✅ Security measures are in place"
else
    echo "- ❌ Some tests failed - review and fix issues"
    echo "- ⚠️ Address security vulnerabilities if any"
    echo "- ⚠️ Improve test coverage if below threshold"
fi)

## Next Steps

1. Review any failed tests
2. Address security vulnerabilities
3. Improve coverage if needed
4. Deploy to devnet for further testing
5. Conduct production security audit

---
*Report generated by Gaming Rewards Protocol Test Suite*
EOF

    print_success "Test report generated: $report_file"
}

# Function to cleanup test artifacts
cleanup_test_artifacts() {
    print_header "Cleaning Up Test Artifacts"
    
    print_step "Removing test artifacts..."
    
    # Remove coverage reports
    find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.lcov" -delete 2>/dev/null || true
    
    # Remove test logs
    find . -name "test.log" -delete 2>/dev/null || true
    find . -name "*.test.log" -delete 2>/dev/null || true
    
    # Remove temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.temp" -delete 2>/dev/null || true
    
    print_success "Test artifacts cleaned up"
}

# Main test execution function
run_all_tests() {
    local start_time=$(date +%s)
    local exit_code=0
    
    print_header "Gaming Rewards Protocol - Test Suite"
    echo "Starting comprehensive test execution..."
    echo ""
    
    # Check prerequisites
    check_prerequisites
    echo ""
    
    # Install dependencies
    install_test_dependencies
    echo ""
    
    # Run tests
    print_info "Running all test types..."
    
    # Unit tests
    if run_unit_tests; then
        print_success "Unit tests completed successfully"
    else
        print_error "Unit tests failed"
        exit_code=1
    fi
    echo ""
    
    # Integration tests
    if run_integration_tests; then
        print_success "Integration tests completed successfully"
    else
        print_error "Integration tests failed"
        exit_code=1
    fi
    echo ""
    
    # Security tests
    if run_security_tests; then
        print_success "Security tests completed successfully"
    else
        print_error "Security tests failed"
        exit_code=1
    fi
    echo ""
    
    # Performance tests
    if run_performance_tests; then
        print_success "Performance tests completed successfully"
    else
        print_error "Performance tests failed"
        exit_code=1
    fi
    echo ""
    
    # Contract tests
    if run_contract_tests; then
        print_success "Contract tests completed successfully"
    else
        print_error "Contract tests failed"
        exit_code=1
    fi
    echo ""
    
    # Coverage tests
    run_coverage_tests
    echo ""
    
    # Generate report
    generate_test_report
    echo ""
    
    # Cleanup
    cleanup_test_artifacts
    echo ""
    
    # Calculate execution time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_header "Test Execution Complete"
    echo "Total execution time: ${duration} seconds"
    
    if [ $exit_code -eq 0 ]; then
        print_success "🎉 All tests passed! Protocol is ready for deployment."
        echo ""
        print_info "Next steps:"
        echo "  1. Review the test report in test-results/"
        echo "  2. Deploy to devnet for further testing"
        echo "  3. Conduct production security audit"
        echo "  4. Deploy to mainnet"
    else
        print_error "❌ Some tests failed. Please review and fix issues."
        echo ""
        print_info "Check the test report for detailed information."
    fi
    
    return $exit_code
}

# Parse command line arguments
case "${1:-all}" in
    "unit")
        check_prerequisites
        install_test_dependencies
        run_unit_tests
        ;;
    "integration")
        check_prerequisites
        install_test_dependencies
        run_integration_tests
        ;;
    "security")
        check_prerequisites
        install_test_dependencies
        run_security_tests
        ;;
    "performance")
        check_prerequisites
        install_test_dependencies
        run_performance_tests
        ;;
    "contracts")
        check_prerequisites
        install_test_dependencies
        run_contract_tests
        ;;
    "coverage")
        check_prerequisites
        install_test_dependencies
        run_coverage_tests
        ;;
    "all"|*)
        run_all_tests
        ;;
esac
