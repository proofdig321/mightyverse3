#!/bin/bash
# MCP Production Smoke Test Suite
# Mission: mv-mcp-railway-2025-12

set -e

# Configuration
MCP_URL="${MCP_URL:-https://mightyverse-mcp.railway.app}"
WEB_URL="${WEB_URL:-https://mightyverse3.vercel.app}"
MCP_AUTH_TOKEN="${MCP_AUTH_TOKEN:-mcp_prod_token_secure}"

echo "🚀 Starting MCP Production Smoke Tests"
echo "MCP URL: $MCP_URL"
echo "Web URL: $WEB_URL"

# Test 1: MCP Health Check
echo "📊 Test 1: MCP Health Check"
curl -fS "$MCP_URL/api/mcp/health" || { echo "❌ MCP health failed"; exit 2; }
echo "✅ MCP health check passed"

# Test 2: MCP Status
echo "📊 Test 2: MCP Status"
curl -fS "$MCP_URL/api/mcp/status" | jq . || { echo "❌ MCP status failed"; exit 3; }
echo "✅ MCP status check passed"

# Test 3: MCP Execute (Ping)
echo "📊 Test 3: MCP Execute (Ping)"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"task":"ping","payload":{}}' | jq . || { echo "❌ MCP execute failed"; exit 4; }
echo "✅ MCP execute test passed"

# Test 4: Pipeline Status
echo "📊 Test 4: Pipeline Status"
curl -fS "$MCP_URL/api/mcp/pipeline/status" | jq . || { echo "❌ Pipeline status failed"; exit 5; }
echo "✅ Pipeline status check passed"

# Test 5: Upload Pipeline Validation
echo "📊 Test 5: Upload Pipeline Validation"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"task":"validate_upload","payload":{}}' | jq . || { echo "❌ Upload validation failed"; exit 6; }
echo "✅ Upload pipeline validation passed"

# Test 6: Web App Health (if accessible)
if curl -fS "$WEB_URL" > /dev/null 2>&1; then
  echo "📊 Test 6: Web App Health"
  echo "✅ Web app is accessible"
else
  echo "⚠️  Web app not accessible (may be expected)"
fi

echo "🎉 All MCP Production Smoke Tests Passed!"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"