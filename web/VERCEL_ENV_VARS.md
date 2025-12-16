Vercel environment variables for production
=========================================

Set these environment variables in the Vercel project (Production scope) before deploying.

- `DATABASE_URL` - Postgres connection string
- `SUPABASE_URL` - Supabase project URL (optional)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)
- `S3_BUCKET` - Object storage bucket name
- `S3_REGION` - S3 region
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `LIVEPEER_API_KEY` - Livepeer Studio API key
- `JWT_SECRET` - JWT signing secret
- `MCP_ENDPOINT` - URL for MCP orchestration endpoint (e.g., https://mcp.example.com/api/execute)
- `MCP_AUTH_TOKEN` - Auth token used to call MCP
- `UPLOAD_SERVICE_URL` - (optional) internal upload service URL, e.g., https://upload.example.com

Notes:
- Prefixes `NEXT_PUBLIC_` are exposed client-side; only set non-sensitive vars as `NEXT_PUBLIC_...`.
- Rotate keys immediately if secrets were committed to the repo.
