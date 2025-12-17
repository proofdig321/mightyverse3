#!/bin/bash

echo "🚂 Railway MCP Deployment"
echo "========================"

# Create new Railway service for MCP only
echo "1. Creating MCP service..."

# Railway service configuration
cat > railway-mcp.toml << EOF
[build]
builder = "dockerfile"
dockerfilePath = "agents/Dockerfile"

[deploy]
startCommand = "python agents/mcp_coordinator.py"
healthcheckPath = "/api/mcp/health"
healthcheckTimeout = 300

[environments.production.variables]
MCP_AUTH_TOKEN = "mcp_prod_token_$(date +%s)"
SUPABASE_URL = "https://sroy6olz8li3u7o3cvummq.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3k2b2x6OGxpM3U3bzNjdnVtbXEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0MzQ3Mjk0LCJleHAiOjIwNDk5MjMyOTR9.sb_secret_tm9zq4aF_8rllEOsIorrbA_BQXTrPGy"
LIVEPEER_API_KEY = "99764289-df40-4cba-ab77-3105df4bf7a9"
PORT = "8000"
EOF

echo "✅ Railway configuration created"
echo ""
echo "📋 Manual Railway Setup Required:"
echo "1. Go to Railway dashboard"
echo "2. Create new service: 'mcp-coordinator'"
echo "3. Connect to GitHub repo: proofdig321/mightyverse3"
echo "4. Set root directory to: /agents"
echo "5. Add environment variables from PRODUCTION_ENV_VARS.md"
echo "6. Deploy service"
echo ""
echo "🔗 Service will be available at: https://mcp-coordinator-production.up.railway.app"