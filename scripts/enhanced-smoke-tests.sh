#!/bin/bash

echo "🧪 Enhanced MCP Production Smoke Tests"
echo "======================================"
echo "Mission: mv-mcp-railway-2025-12"
echo ""

set -e

# Configuration
MCP_URL="${MCP_URL:-http://localhost:8000}"
MCP_AUTH_TOKEN="${MCP_AUTH_TOKEN:-test-token}"
UPLOAD_API="${UPLOAD_API:-http://localhost:3000/api/upload}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEST_RESULTS_DIR="/tmp/mcp-smoke-tests-$TIMESTAMP"

mkdir -p $TEST_RESULTS_DIR

echo "🔧 Test Configuration:"
echo "  MCP URL: $MCP_URL"
echo "  Upload API: $UPLOAD_API"
echo "  Results Dir: $TEST_RESULTS_DIR"
echo ""

# Test Results Tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local output_file="$TEST_RESULTS_DIR/${test_name}.json"
    
    echo "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if eval "$test_command" > "$output_file" 2>&1; then
        echo "✅ $test_name - PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "❌ $test_name - FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "   Error details in: $output_file"
        return 1
    fi
}

echo "🚀 Starting Enhanced Smoke Test Suite..."
echo "========================================"
echo ""

# Test 1: Basic Health Check
echo "1️⃣  Health Check Test"
echo "-------------------"
run_test "health_check" "curl -fs '$MCP_URL/api/mcp/health'"
echo ""

# Test 2: Status Endpoint
echo "2️⃣  Status Endpoint Test"
echo "----------------------"
run_test "status_check" "curl -fs '$MCP_URL/api/mcp/status'"
echo ""

# Test 3: Root Endpoint
echo "3️⃣  Root Endpoint Test"
echo "--------------------"
run_test "root_endpoint" "curl -fs '$MCP_URL/'"
echo ""

# Test 4: Execute Ping (No Auth)
echo "4️⃣  Execute Ping Test (No Auth)"
echo "-----------------------------"
run_test "execute_ping_noauth" "curl -fs -X POST '$MCP_URL/api/mcp/execute' -H 'Content-Type: application/json' -d '{\"task\":\"ping\",\"payload\":{}}'"
echo ""

# Test 5: Execute Ping (With Auth)
echo "5️⃣  Execute Ping Test (With Auth)"
echo "-------------------------------"
run_test "execute_ping_auth" "curl -fs -X POST '$MCP_URL/api/mcp/execute' -H 'Authorization: Bearer $MCP_AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"task\":\"ping\",\"payload\":{}}'"
echo ""

# Test 6: Execute Noop Task
echo "6️⃣  Execute Noop Task Test"
echo "------------------------"
run_test "execute_noop" "curl -fs -X POST '$MCP_URL/api/mcp/execute' -H 'Authorization: Bearer $MCP_AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"task\":\"noop\"}'"
echo ""

# Test 6.5: Pipeline Status Check
echo "6️⃣.5️⃣  Pipeline Status Test"
echo "-------------------------"
run_test "pipeline_status" "curl -fs '$MCP_URL/api/mcp/pipeline/status'"
echo ""

# Test 6.6: Upload Pipeline Validation
echo "6️⃣.6️⃣  Upload Pipeline Validation"
echo "------------------------------"
run_test "validate_upload" "curl -fs -X POST '$MCP_URL/api/mcp/execute' -H 'Authorization: Bearer $MCP_AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"task\":\"validate_upload\"}'"
echo ""

# Test 7: Upload Pipeline Init (if available)
echo "7️⃣  Upload Pipeline Test"
echo "----------------------"
if run_test "upload_init" "curl -fs -X POST '$UPLOAD_API/init' -H 'Content-Type: application/json' -d '{\"filename\":\"smoke.mp4\",\"size\":10,\"contentType\":\"video/mp4\"}'"; then
    echo "   Upload pipeline is accessible"
else
    echo "   Upload pipeline not available (may be expected in some environments)"
fi
echo ""

# Test 8: Response Time Test
echo "8️⃣  Response Time Test"
echo "--------------------"
echo "Measuring response times..."
for i in {1..3}; do
    start_time=$(date +%s%N)
    if curl -fs "$MCP_URL/api/mcp/health" > /dev/null; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))
        echo "   Attempt $i: ${response_time}ms"
        echo "{\"attempt\": $i, \"response_time_ms\": $response_time, \"status\": \"success\"}" >> "$TEST_RESULTS_DIR/response_times.json"
    else
        echo "   Attempt $i: FAILED"
        echo "{\"attempt\": $i, \"response_time_ms\": null, \"status\": \"failed\"}" >> "$TEST_RESULTS_DIR/response_times.json"
    fi
done
echo ""

# Test 9: Concurrent Requests Test
echo "9️⃣  Concurrent Requests Test"
echo "---------------------------"
echo "Testing concurrent request handling..."
for i in {1..5}; do
    curl -fs "$MCP_URL/api/mcp/health" > "$TEST_RESULTS_DIR/concurrent_$i.json" &
done
wait
echo "✅ Concurrent requests completed"
echo ""

# Generate Test Summary
echo "📊 Test Summary"
echo "==============="
echo "Total Tests: $TESTS_TOTAL"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo "Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
echo ""

# Generate JSON Report
cat > "$TEST_RESULTS_DIR/summary.json" << EOF
{
  "mission_id": "mv-mcp-railway-2025-12",
  "test_suite": "enhanced_smoke_tests",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mcp_url": "$MCP_URL",
  "results": {
    "total_tests": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "success_rate": $(( TESTS_PASSED * 100 / TESTS_TOTAL ))
  },
  "test_details": {
    "health_check": "$([ -f "$TEST_RESULTS_DIR/health_check.json" ] && echo "passed" || echo "failed")",
    "status_check": "$([ -f "$TEST_RESULTS_DIR/status_check.json" ] && echo "passed" || echo "failed")",
    "execute_ping": "$([ -f "$TEST_RESULTS_DIR/execute_ping_auth.json" ] && echo "passed" || echo "failed")",
    "upload_pipeline": "$([ -f "$TEST_RESULTS_DIR/upload_init.json" ] && echo "passed" || echo "failed")"
  },
  "artifacts_location": "$TEST_RESULTS_DIR"
}
EOF

echo "📄 Detailed Results: $TEST_RESULTS_DIR/"
echo "📋 Summary Report: $TEST_RESULTS_DIR/summary.json"
echo ""

# Final Status
if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 ALL SMOKE TESTS PASSED!"
    echo "✅ MCP service is healthy and ready for production"
    exit 0
else
    echo "⚠️  SOME TESTS FAILED"
    echo "❌ Review failed tests before proceeding to production"
    exit 1
fi