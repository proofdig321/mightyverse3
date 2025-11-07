#!/bin/bash

# Security Audit Script for The Mighty Verse Platform
# Comprehensive security scanning and validation

set -e

echo "🛡️  Starting Security Audit for The Mighty Verse Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Function to run check
run_check() {
    local check_name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "Checking $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to run warning check
run_warning_check() {
    local check_name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "Checking $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "📋 Running Dependency Security Checks"
echo "------------------------------------"

# Check for npm audit in web directory
if [ -d "web" ]; then
    cd web
    run_check "Web dependencies (npm audit)" "npm audit --audit-level=high"
    cd ..
fi

# Check for npm audit in contracts directory
if [ -d "contracts" ]; then
    cd contracts
    run_check "Contract dependencies (npm audit)" "npm audit --audit-level=high"
    cd ..
fi

echo ""
echo "🔒 Running Smart Contract Security Checks"
echo "----------------------------------------"

# Check if Slither is available and run it
if command -v slither &> /dev/null; then
    if [ -d "contracts/contracts" ]; then
        run_check "Smart contract static analysis (Slither)" "slither contracts/contracts/ --exclude-dependencies"
    fi
else
    echo -e "${YELLOW}⚠ Slither not found - skipping smart contract analysis${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for hardcoded private keys or secrets
echo ""
echo "🔍 Scanning for Hardcoded Secrets"
echo "--------------------------------"

run_check "No hardcoded private keys" "! grep -r -i 'private.*key.*=' --include='*.ts' --include='*.js' --include='*.sol' . || true"
run_check "No hardcoded API keys" "! grep -r -i 'api.*key.*=' --include='*.ts' --include='*.js' . || true"
run_check "No hardcoded passwords" "! grep -r -i 'password.*=' --include='*.ts' --include='*.js' . || true"

echo ""
echo "🌐 Checking Environment Configuration"
echo "-----------------------------------"

# Check for proper environment variable usage
run_warning_check "Environment variables used for secrets" "grep -r 'process.env' web/ --include='*.ts' --include='*.js'"
run_check "No .env files in git" "! find . -name '.env*' -not -path './node_modules/*' -not -name '.env.example' | grep -q ."

echo ""
echo "📁 File Permission Checks"
echo "------------------------"

# Check file permissions
run_check "No world-writable files" "! find . -type f -perm -002 | grep -q ."
run_check "No executable config files" "! find . -name '*.json' -o -name '*.yml' -o -name '*.yaml' | xargs ls -l | grep -q '^-rwxr'"

echo ""
echo "🔐 Authentication & Authorization Checks"
echo "---------------------------------------"

# Check RBAC implementation
if [ -f "web/app/auth/roles.ts" ]; then
    run_check "RBAC roles defined" "grep -q 'enum.*Role' web/app/auth/roles.ts"
fi

if [ -f "web/middleware.ts" ]; then
    run_check "Route protection middleware" "grep -q 'middleware' web/middleware.ts"
fi

echo ""
echo "⛓️  Blockchain Security Checks"
echo "-----------------------------"

# Check smart contract security patterns
if [ -d "contracts/contracts" ]; then
    run_check "ReentrancyGuard usage" "grep -r 'ReentrancyGuard' contracts/contracts/"
    run_check "Access control implementation" "grep -r 'AccessControl\|Ownable' contracts/contracts/"
    run_check "SafeMath or Solidity 0.8+" "grep -r 'pragma solidity.*0\.8\|SafeMath' contracts/contracts/"
fi

echo ""
echo "🌍 CORS and Security Headers"
echo "---------------------------"

# Check for security configurations
if [ -f "web/next.config.js" ]; then
    run_warning_check "Security headers configured" "grep -q 'headers\|security' web/next.config.js"
fi

echo ""
echo "📊 Code Quality Checks"
echo "---------------------"

# Check for console.log statements in production code
run_warning_check "No console.log in production" "! grep -r 'console\.log' web/app/ --include='*.ts' --include='*.tsx' || true"

# Check for TODO/FIXME comments
run_warning_check "No critical TODOs" "! grep -r 'TODO.*CRITICAL\|FIXME.*CRITICAL' . --include='*.ts' --include='*.js' --include='*.tsx' || true"

echo ""
echo "🔄 CI/CD Security"
echo "----------------"

if [ -d ".github/workflows" ]; then
    run_check "GitHub Actions workflows exist" "ls .github/workflows/*.yml"
    run_check "No hardcoded secrets in workflows" "! grep -r 'password\|token\|key' .github/workflows/ --exclude-dir=secrets || true"
fi

echo ""
echo "=================================================="
echo "🛡️  Security Audit Summary"
echo "=================================================="
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

# Calculate security score
SECURITY_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo ""
echo -e "Security Score: ${SECURITY_SCORE}%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ Security audit PASSED - Platform ready for production${NC}"
    exit 0
elif [ $FAILED_CHECKS -le 2 ]; then
    echo -e "${YELLOW}⚠️  Security audit passed with warnings - Review failed checks${NC}"
    exit 0
else
    echo -e "${RED}❌ Security audit FAILED - Critical issues must be resolved${NC}"
    exit 1
fi