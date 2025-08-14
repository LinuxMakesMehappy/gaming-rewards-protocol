#!/bin/bash

# Continuous Security Audit Pipeline
# Designed for automated execution in CI/CD or cron jobs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_DIR="$PROJECT_ROOT/audit"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
AUDIT_LOG="$AUDIT_DIR/continuous-audit-$TIMESTAMP.log"
SUMMARY_LOG="$AUDIT_DIR/audit-summary.log"
ALERT_LOG="$AUDIT_DIR/security-alerts.log"

# Create audit directory
mkdir -p "$AUDIT_DIR"

# Function to log with timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$AUDIT_LOG"
}

# Function to send alert (placeholder for integration)
send_alert() {
    local severity=$1
    local message=$2
    
    echo "[$severity] $message" >> "$ALERT_LOG"
    
    # Placeholder for alert integration (Slack, Discord, email, etc.)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"[$severity] $message\"}" \
    #     $SLACK_WEBHOOK_URL
}

# Function to check if audit should run
should_run_audit() {
    # Check if it's been more than 24 hours since last audit
    local last_audit="$AUDIT_DIR/last-audit.txt"
    if [ -f "$last_audit" ]; then
        local last_time=$(cat "$last_audit")
        local current_time=$(date +%s)
        local time_diff=$((current_time - last_time))
        local day_in_seconds=86400
        
        if [ $time_diff -lt $day_in_seconds ]; then
            log "INFO" "Audit ran recently, skipping..."
            return 1
        fi
    fi
    
    echo $(date +%s) > "$last_audit"
    return 0
}

# Function to run comprehensive audit
run_comprehensive_audit() {
    log "INFO" "Starting comprehensive security audit..."
    
    # Run all audit scripts
    local scripts=(
        "scripts/security-audit.sh"
        "scripts/rust-audit.sh"
        "scripts/typescript-audit.sh"
    )
    
    local total_issues=0
    local critical_issues=0
    local high_issues=0
    
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            log "INFO" "Running $script..."
            
            # Run script and capture output
            local script_output
            if script_output=$(bash "$PROJECT_ROOT/$script" 2>&1); then
                log "INFO" "$script completed successfully"
            else
                log "ERROR" "$script failed: $script_output"
                send_alert "ERROR" "Audit script $script failed"
            fi
            
            # Count issues from output
            local script_critical=$(echo "$script_output" | grep -c "\[CRITICAL\]" || true)
            local script_high=$(echo "$script_output" | grep -c "\[HIGH\]" || true)
            
            critical_issues=$((critical_issues + script_critical))
            high_issues=$((high_issues + script_high))
            total_issues=$((total_issues + script_critical + script_high))
            
        else
            log "WARNING" "Script $script not found"
        fi
    done
    
    # Generate summary
    echo "=== AUDIT SUMMARY - $(date) ===" >> "$SUMMARY_LOG"
    echo "Total Issues: $total_issues" >> "$SUMMARY_LOG"
    echo "Critical Issues: $critical_issues" >> "$SUMMARY_LOG"
    echo "High Issues: $high_issues" >> "$SUMMARY_LOG"
    echo "================================" >> "$SUMMARY_LOG"
    
    # Send alerts for critical issues
    if [ $critical_issues -gt 0 ]; then
        send_alert "CRITICAL" "Found $critical_issues critical security issues"
    fi
    
    if [ $high_issues -gt 0 ]; then
        send_alert "HIGH" "Found $high_issues high severity security issues"
    fi
    
    log "INFO" "Comprehensive audit completed"
    log "INFO" "Total issues: $total_issues (Critical: $critical_issues, High: $high_issues)"
}

# Function to check for new vulnerabilities
check_vulnerabilities() {
    log "INFO" "Checking for new vulnerabilities..."
    
    cd "$PROJECT_ROOT/bots"
    
    # Check npm vulnerabilities
    if command -v npm &> /dev/null; then
        local npm_audit_output
        if npm_audit_output=$(npm audit --audit-level=high 2>&1); then
            local vuln_count=$(echo "$npm_audit_output" | grep -c "found" || true)
            if [ $vuln_count -gt 0 ]; then
                log "WARNING" "Found $vuln_count high severity npm vulnerabilities"
                send_alert "HIGH" "Found $vuln_count new npm vulnerabilities"
            else
                log "INFO" "No high severity npm vulnerabilities found"
            fi
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to check for dependency updates
check_dependencies() {
    log "INFO" "Checking for dependency updates..."
    
    cd "$PROJECT_ROOT/bots"
    
    if command -v npm &> /dev/null; then
        local outdated_output
        if outdated_output=$(npm outdated 2>&1); then
            local outdated_count=$(echo "$outdated_output" | grep -c "WARN" || true)
            if [ $outdated_count -gt 0 ]; then
                log "INFO" "Found $outdated_count outdated dependencies"
                # Don't send alert for outdated deps, just log
            else
                log "INFO" "All dependencies are up to date"
            fi
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to check for configuration changes
check_configuration() {
    log "INFO" "Checking configuration security..."
    
    # Check if .env file is committed
    if git ls-files | grep -q ".env"; then
        log "CRITICAL" ".env file is committed to git"
        send_alert "CRITICAL" ".env file is committed to git"
    fi
    
    # Check for new secrets in recent commits
    local recent_secrets
    if recent_secrets=$(git log --since="1 day ago" --grep="password\|secret\|key" --oneline 2>/dev/null); then
        if [ -n "$recent_secrets" ]; then
            log "WARNING" "Recent commits contain potential secrets"
            send_alert "HIGH" "Recent commits contain potential secrets"
        fi
    fi
    
    # Check for new files with potential secrets
    local new_files_with_secrets
    if new_files_with_secrets=$(find . -name "*.env*" -o -name "*.key*" -o -name "*secret*" -newer "$AUDIT_DIR/last-audit.txt" 2>/dev/null); then
        if [ -n "$new_files_with_secrets" ]; then
            log "WARNING" "New files with potential secrets found"
            send_alert "HIGH" "New files with potential secrets found"
        fi
    fi
}

# Function to check for code quality issues
check_code_quality() {
    log "INFO" "Checking code quality..."
    
    # Check for TODO/FIXME items
    local todos
    if todos=$(grep -r "TODO\|FIXME\|HACK" . --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git 2>/dev/null | wc -l); then
        if [ $todos -gt 0 ]; then
            log "INFO" "Found $todos TODO/FIXME items"
        fi
    fi
    
    # Check for unused imports (basic check)
    cd "$PROJECT_ROOT/bots"
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit 2>&1 | grep -q "unused"; then
            log "INFO" "Found unused imports in TypeScript code"
        fi
    fi
    cd "$PROJECT_ROOT"
}

# Function to clean old audit logs
cleanup_old_logs() {
    log "INFO" "Cleaning up old audit logs..."
    
    # Keep only last 30 days of logs
    find "$AUDIT_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Keep only last 10 summary entries
    if [ -f "$SUMMARY_LOG" ]; then
        tail -n 50 "$SUMMARY_LOG" > "$SUMMARY_LOG.tmp" && mv "$SUMMARY_LOG.tmp" "$SUMMARY_LOG"
    fi
}

# Function to generate audit report
generate_report() {
    log "INFO" "Generating audit report..."
    
    local report_file="$AUDIT_DIR/audit-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Security Audit Report - $(date)

## Executive Summary
- **Audit Date**: $(date)
- **Project**: Gaming Rewards Protocol
- **Audit Type**: Continuous Security Audit

## Recent Issues
$(tail -n 20 "$SUMMARY_LOG" 2>/dev/null || echo "No recent issues found")

## Security Alerts
$(tail -n 10 "$ALERT_LOG" 2>/dev/null || echo "No security alerts")

## Recommendations
1. Review and address any critical/high severity issues
2. Update dependencies regularly
3. Monitor for new vulnerabilities
4. Maintain secure configuration practices

## Next Steps
- Schedule next audit: $(date -d "+1 day" '+%Y-%m-%d')
- Review security alerts: $ALERT_LOG
- Check detailed logs: $AUDIT_LOG
EOF
    
    log "INFO" "Audit report generated: $report_file"
}

# Main execution
main() {
    log "INFO" "Starting continuous security audit pipeline..."
    
    # Check if audit should run
    if ! should_run_audit; then
        exit 0
    fi
    
    # Run all checks
    run_comprehensive_audit
    check_vulnerabilities
    check_dependencies
    check_configuration
    check_code_quality
    cleanup_old_logs
    generate_report
    
    log "INFO" "Continuous audit pipeline completed successfully"
}

# Handle script arguments
case "${1:-}" in
    "force")
        # Force run audit regardless of timing
        rm -f "$AUDIT_DIR/last-audit.txt"
        main
        ;;
    "report")
        # Generate report only
        generate_report
        ;;
    "cleanup")
        # Cleanup only
        cleanup_old_logs
        ;;
    *)
        # Normal execution
        main
        ;;
esac 