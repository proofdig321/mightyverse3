# PRODUCTION ENVIRONMENT VARIABLES

## Vercel Web App
```bash
NEXT_PUBLIC_SUPABASE_URL=https://sroy6olz8li3u7o3cvummq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3k2b2x6OGxpM3U3bzNjdnVtbXEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDM0NzI5NCwiZXhwIjoyMDQ5OTIzMjk0fQ.sb_publishable_SROY6Olz8Li3u7o3CVummQ_7snImEKa
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3k2b2x6OGxpM3U3bzNjdnVtbXEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0MzQ3Mjk0LCJleHAiOjIwNDk5MjMyOTR9.sb_secret_tm9zq4aF_8rllEOsIorrbA_BQXTrPGy
LIVEPEER_API_KEY=99764289-df40-4cba-ab77-3105df4bf7a9
JWT_SECRET=production_jwt_secret_256_bit_change_me
NEXT_PUBLIC_DEBUG=false
```

## Railway MCP Service
```bash
MCP_AUTH_TOKEN=mcp_production_token_secure_256_bit
SUPABASE_URL=https://sroy6olz8li3u7o3cvummq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3k2b2x6OGxpM3U3bzNjdnVtbXEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0MzQ3Mjk0LCJleHAiOjIwNDk5MjMyOTR9.sb_secret_tm9zq4aF_8rllEOsIorrbA_BQXTrPGy
LIVEPEER_API_KEY=99764289-df40-4cba-ab77-3105df4bf7a9
PORT=8000
```

## MCP Server Location
- **Source**: `/agents/mcp_coordinator.py`
- **Dockerfile**: `/agents/Dockerfile`
- **Requirements**: `/agents/requirements.txt`
- **Deploy Script**: `/scripts/deploy-mcp-railway.sh`