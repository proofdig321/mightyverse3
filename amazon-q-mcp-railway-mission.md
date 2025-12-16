# Amazon Q Mission: Deploy MCP to Railway & Run Production Smoke Tests

Mission ID: mv-mcp-railway-2025-12
Priority: High
Owner: Automation (Amazon Q) — human approval required for production changes

Objective
- Deploy the MCP coordinator service to Railway (production), validate the end-to-end data pipelines (upload → processing → playback), and run a full smoke-test suite. Keep `n8n` code in-repo (no deployment). Produce a final report with findings, logs, and remediation steps.

Preconditions
- Railway project created and accessible via `RAILWAY_API_KEY` in CI or runner.
- Container registry (Docker Hub / ECR / GitHub Packages) available with push access.
- Production secrets stored in Railway environment variables or a secrets manager.
- Team contact for emergency rollback is available.

Secrets / Env (to be set in Railway project)
- `MCP_AUTH_TOKEN` — coordinator secret
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — preferred server-side Supabase credentials (use `DATABASE_URL` only if you're connecting directly to Postgres)
- `DATABASE_URL` — Postgres (optional; used if not using Supabase server role)
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `LIVEPEER_API_KEY`
- `MCP_SYNC_ENDPOINT` (optional)

High-level Plan (atomic steps)
1. Build MCP Docker image and push to registry.
2. Create Railway service and configure environment variables.
3. Deploy MCP image to Railway; configure health probe.
4. Run smoke tests against MCP and upload pipelines (local upload service or S3-backed flow).
5. Validate MCP can reach internal services (DB, S3, Livepeer) and can process basic agent tasks.
6. Collect logs and produce report; if failures, run rollback steps.

Detailed Steps (commands and checks)

Step 1 — Build & push Docker image
1. Build image locally or in CI:
```
cd $(repo_root)
docker build -t your-registry/mightyverse-mcp:latest -f agents/Dockerfile .
docker push your-registry/mightyverse-mcp:latest
```
2. Verify image is available via `docker pull your-registry/mightyverse-mcp:latest`.

Step 2 — Railway service setup
Option A: Railway CLI (`railway up`) on current repo branch (quick)
```
railway login --apiKey $RAILWAY_API_KEY
railway init --project "mightyverse-mcp" --service "mcp"
railway link
railway up --service mcp --image your-registry/mightyverse-mcp:latest
```
Option B: Create service in Railway dashboard and set image to `your-registry/mightyverse-mcp:latest`.
Set environment variables in Railway UI (Production scope): `MCP_AUTH_TOKEN`, `DATABASE_URL`, S3 vars, `LIVEPEER_API_KEY`.

Step 3 — Configure health checks
- Ensure Railway health check endpoint (for example `/api/mcp/health` or `/api/system/health`) is exposed. If absent, configure container command to expose a minimal `/health` responder in `mcp_coordinator.py`.

Step 4 — Deploy and verify
1. Deploy via Railway UI or CLI. Monitor logs:
```
railway logs --service mcp --follow
```
2. Wait for service to be `Running` and health check to pass.

Step 5 — Smoke tests (scripted)
Run the following checks from a runner with network access to Railway service.

- Check MCP health (expects HTTP 200):
```
curl -fS "${MCP_URL}/api/mcp/health" || exit 1
```
- Supabase connectivity check (if using Supabase):
```
SUPABASE_URL="https://your-supabase-url" SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" ./scripts/check_supabase.sh
```
- Check MCP status endpoint (expects JSON):
```
curl -fS "${MCP_URL}/api/mcp/status"
```
- Trigger a simple agent task (dry-run):
```
curl -X POST "${MCP_URL}/api/mcp/execute" \
  -H 'Authorization: Bearer $MCP_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"task":"ping","payload":{}}'
```
- Validate upload pipeline (end-to-end):
  - Use `web` serverless API to init presign: `POST /api/upload/init`.
  - Upload small test file to returned presignedUrl and call `/api/upload/complete`.
  - Confirm asset appears in DB and MCP is notified (if `MCP_ENDPOINT` set).

Smoke-test script (example)
1. Run in CI or local runner with env:
```
MCP_URL="https://mcp-service.example.com"
MCP_AUTH_TOKEN=...
UPLOAD_API="https://web.example.com/api/upload"

# MCP health
curl -fs "$MCP_URL/api/mcp/health" || { echo 'MCP health failed'; exit 2; }

# Basic execute
curl -fs -X POST "$MCP_URL/api/mcp/execute" -H "Authorization: Bearer $MCP_AUTH_TOKEN" -H 'Content-Type: application/json' -d '{"task":"noop"}' || { echo 'MCP execute failed'; exit 3; }

# Upload test
curl -fs -X POST "$UPLOAD_API/init" -H 'Content-Type: application/json' -d '{"filename":"smoke.mp4","size":10,"contentType":"video/mp4"}'
```

Step 6 — Verify pipelines & Livepeer
- Check DB `assets` table for latest test asset and `livepeer_status` fields. Run `scripts/asset-health-check.js` against the playback id.

Logging & Diagnostics to collect
- `railway logs --service mcp --since 1h` (or via UI)
- `curl` output from health and execute endpoints
- `services/upload_service/data/assets.json` (if using local upload service)
- `scripts/processing_worker.js` logs

Rollback plan (if deployment causes issues)
1. Set Railway service to previous image tag (if stored) and redeploy.
2. If DB migration required and failed, restore DB from latest snapshot.
3. If MCP misbehaves, stop new deployment and re-link service to previous commit/tag.

Acceptance Criteria
- MCP service `Running` on Railway with passing health checks.
- Smoke tests pass: health, execute, upload pipeline, and playback validations.
- MCP logs show no critical errors for 15 minutes post-deploy.
- A final report (JSON + human summary) produced to `reports/mcp-deploy-TIMESTAMP.json` containing test outputs, logs, and artifacts.

Reporting requirements
- On completion or failure, Amazon Q must upload a ZIP containing logs, `assets.json` snapshot, smoke-test outputs, and a one-paragraph summary to a configured artifacts location (S3 or repo artifact storage).

Notes on `n8n`
- Do not deploy `n8n` to production as part of this mission. Keep `infra/n8n` and `infra/n8n/docker-compose.yml` in-repo for later enablement.
- Validate webhook endpoints referenced by `n8n` workflows are reachable from private/internal network when n8n is enabled.

End of mission
