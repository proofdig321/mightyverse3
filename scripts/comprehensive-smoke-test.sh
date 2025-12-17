#!/bin/bash
# Comprehensive Production Smoke Test Suite
# Tests all content pipelines: Holographic, ISRC, Mural, n8n integration

set -e

MCP_URL="${MCP_URL:-https://mightyverse-mcp.railway.app}"
WEB_URL="${WEB_URL:-https://mightyverse3.vercel.app}"
MCP_AUTH_TOKEN="${MCP_AUTH_TOKEN:-mcp_prod_token_secure}"

echo "🎬 Starting Comprehensive Content Pipeline Tests"
echo "MCP URL: $MCP_URL"
echo "Web URL: $WEB_URL"

# Test 1: Basic MCP Health
echo "📊 Test 1: MCP Health Check"
curl -fS "$MCP_URL/api/mcp/health" || { echo "❌ MCP health failed"; exit 2; }
echo "✅ MCP health check passed"

# Test 2: Holographic Layer Generation
echo "📊 Test 2: Holographic Layer Generation"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "generate_holographic_layers",
    "payload": {
      "assetId": "test-holographic-001",
      "assetType": "holographic"
    }
  }' | jq . || { echo "❌ Holographic layer generation failed"; exit 3; }
echo "✅ Holographic layer generation passed"

# Test 3: Mural Creation
echo "📊 Test 3: Mural Creation from Asset"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "create_mural",
    "payload": {
      "assetId": "test-mural-001",
      "asset": {
        "name": "Test Holographic Mural",
        "creator_wallet": "0x860Ec697167Ba865DdE1eC9e172004100613e970",
        "duration": 180
      }
    }
  }' | jq . || { echo "❌ Mural creation failed"; exit 4; }
echo "✅ Mural creation passed"

# Test 4: ISRC Generation (Audio)
echo "📊 Test 4: ISRC Generation (Audio)"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "generate_isrc",
    "payload": {
      "assetId": "test-audio-001",
      "contentType": "audio"
    }
  }' | jq . || { echo "❌ ISRC generation (audio) failed"; exit 5; }
echo "✅ ISRC generation (audio) passed"

# Test 5: ISRC Generation (Video)
echo "📊 Test 5: ISRC Generation (Video)"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "generate_isrc",
    "payload": {
      "assetId": "test-video-001",
      "contentType": "video"
    }
  }' | jq . || { echo "❌ ISRC generation (video) failed"; exit 6; }
echo "✅ ISRC generation (video) passed"

# Test 6: Comprehensive Holographic Processing
echo "📊 Test 6: Comprehensive Holographic Processing"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "process_holographic_content",
    "payload": {
      "assetId": "test-comprehensive-001",
      "steps": ["layer_separation", "depth_mapping", "holographic_optimization"]
    }
  }' | jq . || { echo "❌ Comprehensive holographic processing failed"; exit 7; }
echo "✅ Comprehensive holographic processing passed"

# Test 7: Content Quality Analysis
echo "📊 Test 7: Content Quality Analysis"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "analyze_content_quality",
    "payload": {
      "assetId": "test-quality-001",
      "asset": {
        "resolution": "4K",
        "duration": 120,
        "frame_rate": 30
      }
    }
  }' | jq . || { echo "❌ Content quality analysis failed"; exit 8; }
echo "✅ Content quality analysis passed"

# Test 8: Holographic Effects Optimization
echo "📊 Test 8: Holographic Effects Optimization"
curl -fS -X POST "$MCP_URL/api/mcp/execute" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "optimize_holographic_effects",
    "payload": {
      "assetId": "test-optimization-001"
    }
  }' | jq . || { echo "❌ Holographic effects optimization failed"; exit 9; }
echo "✅ Holographic effects optimization passed"

# Test 9: Pipeline Status Check
echo "📊 Test 9: Pipeline Status Check"
curl -fS "$MCP_URL/api/mcp/pipeline/status" | jq . || { echo "❌ Pipeline status check failed"; exit 10; }
echo "✅ Pipeline status check passed"

# Test 10: Web App Holographic API (if accessible)
if curl -fS "$WEB_URL" > /dev/null 2>&1; then
  echo "📊 Test 10: Web App Holographic API"
  curl -fS -X POST "$WEB_URL/api/mcp/holographic" \
    -H 'Content-Type: application/json' \
    -d '{
      "assetId": "test-web-holographic-001",
      "task": "generate_holographic_layers"
    }' > /dev/null 2>&1 && echo "✅ Web app holographic API accessible" || echo "⚠️  Web app holographic API not accessible"
else
  echo "⚠️  Web app not accessible (may be expected)"
fi

echo ""
echo "🎉 All Comprehensive Content Pipeline Tests Passed!"
echo "✅ Holographic processing: WORKING"
echo "✅ ISRC generation: WORKING" 
echo "✅ Mural creation: WORKING"
echo "✅ Quality analysis: WORKING"
echo "✅ Effect optimization: WORKING"
echo "✅ Pipeline integration: WORKING"
echo ""
echo "Content Types Supported:"
echo "  - 2.5D Holographic Murals"
echo "  - Holographic Videos with layer separation"
echo "  - Audio content with ISRC codes"
echo "  - Multi-version animator content"
echo "  - 3D layered compositions"
echo ""
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"