#!/bin/bash

echo "🚂 Railway CLI Deployment Script"
echo "================================"
echo "Mission: mv-mcp-railway-2025-12"
echo ""

set -e

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

echo "📋 Railway Deployment Steps:"
echo ""

# Step 1: Initialize project
echo "1️⃣ Initializing Railway project..."
if [ ! -f "railway.json" ]; then
    railway init --name "mightyverse-mcp"
else
    echo "   Project already initialized"
fi

# Step 2: Link to service
echo ""
echo "2️⃣ Linking to Railway service..."
railway link

# Step 3: Set environment variables
echo ""
echo "3️⃣ Setting environment variables..."
echo "⚠️  You need to set these variables manually in Railway dashboard:"
echo ""
echo "Required Variables:"
echo "  MCP_AUTH_TOKEN=<your-secure-token>"
echo "  DATABASE_URL=<postgres-connection-string>"
echo "  S3_BUCKET=<bucket-name>"
echo "  S3_REGION=<aws-region>"
echo "  S3_ACCESS_KEY_ID=<access-key>"
echo "  S3_SECRET_ACCESS_KEY=<secret-key>"
echo "  LIVEPEER_API_KEY=<livepeer-key>"
echo "  PORT=8000"
echo ""

read -p "Press Enter after setting environment variables in Railway dashboard..."

# Step 4: Deploy from Dockerfile
echo ""
echo "4️⃣ Deploying from Dockerfile..."
railway up --detach

echo ""
echo "5️⃣ Monitoring deployment..."
echo "Waiting for deployment to complete..."

# Wait for deployment
sleep 30

# Get service URL
SERVICE_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo ""
    echo "✅ Deployment completed!"
    echo "🌐 Service URL: $SERVICE_URL"
    echo ""
    
    # Run smoke tests
    echo "6️⃣ Running production smoke tests..."
    export MCP_URL="$SERVICE_URL"
    
    if ./scripts/enhanced-smoke-tests.sh; then
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "✅ All smoke tests passed"
        echo "🌐 MCP Coordinator: $SERVICE_URL"
        echo ""
        echo "📊 Next steps:"
        echo "  - Monitor logs: railway logs --follow"
        echo "  - Check health: curl $SERVICE_URL/api/mcp/health"
        echo "  - View dashboard: railway open"
    else
        echo ""
        echo "⚠️  Deployment completed but some tests failed"
        echo "🔍 Check logs: railway logs --follow"
        echo "🌐 Service URL: $SERVICE_URL"
    fi
else
    echo ""
    echo "⚠️  Deployment status unclear"
    echo "🔍 Check Railway dashboard for deployment status"
    echo "📋 Run: railway status"
fi

echo ""
echo "📋 Useful Railway Commands:"
echo "  railway logs --follow    # View live logs"
echo "  railway status          # Check deployment status"
echo "  railway open            # Open Railway dashboard"
echo "  railway rollback        # Rollback if needed"
echo ""
echo "🏁 Mission mv-mcp-railway-2025-12 deployment script completed"