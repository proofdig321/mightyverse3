#!/bin/bash

echo "🚀 MCP Railway Deployment Script"
echo "================================"

# Mission: mv-mcp-railway-2025-12
# Deploy MCP coordinator to Railway with smoke tests

set -e

# Configuration
REGISTRY="ghcr.io/proofdig321"
IMAGE_NAME="mightyverse-mcp"
TAG="latest"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$TAG"

echo "📦 Step 1: Building Docker image..."
docker build -t $FULL_IMAGE -f agents/Dockerfile .

echo "🔐 Step 2: Pushing to registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u proofdig321 --password-stdin
docker push $FULL_IMAGE

echo "🚂 Step 3: Railway deployment preparation..."
echo "Image ready: $FULL_IMAGE"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "1. Go to Railway dashboard"
echo "2. Create new service 'mcp'"
echo "3. Set image to: $FULL_IMAGE"
echo "4. Configure environment variables:"
echo "   - MCP_AUTH_TOKEN=<secure_token>"
echo "   - DATABASE_URL=<postgres_url>"
echo "   - PORT=8000"
echo ""
echo "✅ Build complete. Ready for Railway deployment."