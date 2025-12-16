#!/bin/bash

echo "🔍 Mighty Verse Quick Health Check"
echo "=================================="

# Check if web server is running
echo -n "Web Server: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check system health endpoint
echo -n "System Health API: "
if curl -s http://localhost:3000/api/system/health > /dev/null 2>&1; then
    echo "✅ Available"
    curl -s http://localhost:3000/api/system/health | jq -r '.status // "unknown"' | sed 's/^/   Status: /'
else
    echo "❌ Unavailable"
fi

# Check IPFS gateway
echo -n "IPFS Gateway: "
if curl -s -I https://gateway.pinata.cloud/ipfs/QmTest 2>/dev/null | head -1 | grep -q "200\|404"; then
    echo "✅ Accessible"
else
    echo "⚠️ Issues detected"
fi

# Check environment variables
echo -n "Environment: "
if [ -f "web/.env.local" ]; then
    echo "✅ Config found"
else
    echo "⚠️ No .env.local found"
fi

echo ""
echo "🏁 Health check completed"