#!/bin/bash

echo "🧪 MCP Production Smoke Tests"
echo "============================"

# Configuration
MCP_URL="${MCP_URL:-http://localhost:8000}"
MCP_AUTH_TOKEN="${MCP_AUTH_TOKEN:-test-token}"
UPLOAD_API="${UPLOAD_API:-http://localhost:3000/api/upload}"

echo "Testing MCP at: $MCP_URL"
echo ""

# Test 1: Health Check
echo "1. Health Check..."
if curl -fs "$MCP_URL/api/mcp/health" > /tmp/health.json; then
    echo "✅ Health check passed"
    cat /tmp/health.json | jq .
else
    echo "❌ Health check failed"
    exit 1
fi

echo ""

# Test 2: Status Endpoint
echo "2. Status Check..."
if curl -fs "$MCP_URL/api/mcp/status" > /tmp/status.json; then
    echo "✅ Status check passed"
    cat /tmp/status.json | jq .
else
    echo "❌ Status check failed"
    exit 2
fi

echo ""

# Test 3: Execute Ping
echo "3. Execute Ping..."
if curl -fs -X POST "$MCP_URL/api/mcp/execute" \
    -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"task":"ping","payload":{}}' > /tmp/execute.json; then
    echo "✅ Execute ping passed"
    cat /tmp/execute.json | jq .
else
    echo "❌ Execute ping failed"
    exit 3
fi

echo ""

# Test 4: Upload Pipeline (if available)
echo "4. Upload Pipeline Test..."
if curl -fs -X POST "$UPLOAD_API/init" \
    -H "Content-Type: application/json" \
    -d '{"filename":"smoke.mp4","size":10,"contentType":"video/mp4"}' > /tmp/upload.json 2>/dev/null; then
    echo "✅ Upload pipeline accessible"
    cat /tmp/upload.json | jq .
else
    echo "⚠️  Upload pipeline not available (expected in local testing)"
fi

echo ""
echo "🏁 Smoke tests completed successfully"
echo "📊 Results saved to /tmp/*.json"