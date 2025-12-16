# Amazon Q Delegation Playbook — Mighty Verse
Date: 2025-12-16

Purpose
- This document contains a step-by-step, authoritative playbook an automated Amazon Q agent (or human operator) can follow to finish the remaining production integration tasks for the Mighty Verse project. Actions are ordered, safe (non-breaking where possible), and include commands, file references, verification checks, and acceptance criteria.

Preconditions / Assumptions
- You have repository access and appropriate permissions to the production Vercel project and object storage.
- Production secrets are stored in Vercel environment variables or a secrets manager (do not modify `web/.env.local` in repo).
- Node 18+ and Python 3.10+ are available on the runner executing tasks.

Quick inventory (files & locations to scan)
- MCP agent code: `agents/mcp_coordinator.py`, `agents/*.py`
- Upload scaffold: `services/upload_service/index.js`, `scripts/processing_worker.js`
- Serverless upload APIs (web): `web/pages/api/upload/*`
- Livepeer orchestrator: `foundation/livepeer/orchestrator.ts`
- Deck player: `web/components/DeckPlayer/DeckPlayer.tsx`
- Dashboards: `web/app/admin/page.tsx`, `web/app/animator/page.tsx` and related components
- Production docs: `PRODUCTION_SETUP.md`, `infra/docker-compose.prod.yml`, `web/.env.production.sample`

High-level goals (ordered)
1. Verify/rotate secrets and ensure Vercel production env is correct.
2. Validate upload pipeline end-to-end (presign → upload → complete → processing → playback-ready assets).
3. Verify MCP integration endpoints and ensure agents are reachable from the platform (or stubbed where necessary).
4. Consolidate/validate dashboards (admin vs demo/animator) without breaking live routes.
5. Add monitoring, e2e tests, and final acceptance checks.

Detailed Steps

Step A — Secrets & Vercel environment (safe, immediate)
1. In Vercel dashboard, confirm the following are set in Production scope (matching `web/VERCEL_ENV_VARS.md`):
   - `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase), `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `LIVEPEER_API_KEY`, `JWT_SECRET`, `MCP_ENDPOINT`, `MCP_AUTH_TOKEN`, `UPLOAD_SERVICE_URL` (if you use the dedicated service).
2. Rotate any secrets that are present in repo files (example: if `web/.env.local` contains real keys, rotate them immediately).
3. Ensure `NEXT_PUBLIC_DEBUG` is disabled in production.

Verification:
- Confirm `vercel env ls` (or check Vercel UI) shows required variables. Acceptance: all required keys present and `NEXT_PUBLIC_DEBUG` != "true".

Step B — Start local test environment (dev-like check)
1. Start upload scaffold service (local worker uses filesystem queues):
```bash
cd services/upload_service
npm ci
npm start &
```
2. Start the processing worker in another terminal (or as background process):
```bash
node scripts/processing_worker.js &
```
3. Start Next.js locally to exercise serverless API routes (if testing serverless presign fallback):
```bash
cd web
npm ci
npm run dev
```

Step C — Upload flow test (init → PUT → complete → process)
1. Request a presigned URL from the web API (S3 presign if env configured, otherwise proxied to local upload service):
```bash
curl -s -X POST http://localhost:3000/api/upload/init \
  -H 'Content-Type: application/json' \
  -d '{"filename":"test.mp4","size":12345,"contentType":"video/mp4"}' | jq
```
2. If returned `presignedUrl`, upload a small file:
```bash
# create a tiny test file
echo 'test' > /tmp/test.mp4
curl -X PUT "<presignedUrl>" --upload-file /tmp/test.mp4 -H 'Content-Type: video/mp4'
```
3. Call the upload complete endpoint (web or service):
```bash
curl -s -X POST http://localhost:3000/api/upload/complete \
  -H 'Content-Type: application/json' \
  -d '{"assetId":"<assetId-from-init>", "key":"<s3-key-if-any>", "bucket":"<bucket-if-any>"}' | jq
```
4. Wait for processing worker to pick job and generate derived assets. Confirm by listing assets:
```bash
curl -s http://localhost:4001/api/assets | jq
```

Verification:
- `assets` record moves to `status: ready` and has `derived` fields (poster, transcoded). Acceptance: derived files present under `services/upload_service/uploads/<assetId>/` and `/api/assets` shows `status: ready`.

Step D — Playback verification
1. For transcoded assets, fetch the `transcoded` URL and verify headers:
```bash
curl -I http://localhost:4001/uploads/<assetId>/transcoded.mp4
```
2. Check `Content-Type` is `video/mp4` (or expected). If using Livepeer, run `scripts/asset-health-check.js` to validate playback endpoints.

Acceptance: Player can fetch the file without CORS or 403 errors; `Content-Type` correct and browser console shows no playback error.

Step E — MCP integration verification
1. Confirm MCP endpoints configured in Vercel `MCP_ENDPOINT` and `MCP_AUTH_TOKEN`.
2. From the web server or upload complete, an event should be POSTed to `MCP_ENDPOINT` (see `web/pages/api/upload/complete.js`).
3. To exercise locally, run the coordinator in dry-run mode:
```bash
python3 agents/mcp_coordinator.py
```
4. Check logs for registered agents and ability to `POST` back to agent endpoints.

Step F — Dashboard consolidation (safe, non-breaking plan)
1. Inventory dashboard files and features (initial candidate files):
   - `web/app/admin/page.tsx`
   - `web/app/animator/page.tsx`
   - widgets under `web/components/*` referenced by dashboards
2. Create a canonical dashboard component `web/components/CanonicalDashboard/index.tsx` that implements shared layout and widgets.
3. Replace `admin/page.tsx` and `animator/page.tsx` to `import` and compose `CanonicalDashboard`, passing view-specific props or feature flags.
4. Keep legacy routes as aliases until QA passes; toggle new UI behind a feature flag.

Verification:
- Staging deployment shows both routes working. Acceptance: no route 404s, and shared widgets are identical between routes unless intentionally different by props.

Step G — E2E tests (Playwright recommended)
1. Create tests under `web/tests/upload.spec.ts` that:
   - Call `/api/upload/init` to get presigned URL
   - Upload asset using presigned URL
   - Call `/api/upload/complete`
   - Wait/poll until asset `status: ready`
   - Visit dashboard asset page and assert video element `readyState` and no console errors
2. Run tests in CI: `npx playwright test` (see repo `playwright.config.ts`).

Step H — Monitoring & Alerts
1. Add simple metrics: upload success/fail, processor error count, queue depth, Livepeer ingest errors.
2. Wire to existing monitoring (Sentry, Datadog, or CloudWatch). Configure alerts for thresholds.

Operational Notes & Troubleshooting
- If presign fails: ensure `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` correspond to an IAM user with `s3:PutObject` and `s3:PutObjectAcl` privileges.
- If playback fails: check CORS on bucket, `Content-Type` headers, signed URL TTL, and Livepeer `livepeer_status` in DB.
- If MCP notify fails: verify `MCP_AUTH_TOKEN` and reachability of `MCP_ENDPOINT` from the web runtime.

Minimal Acceptance Criteria (Project Complete)
- Upload pipeline works end-to-end for standard formats (MP4, WebM, Lottie where supported).
- Newly uploaded animation shows poster and plays in dashboard (desktop + mobile) with no console network or player errors.
- Admin and animator dashboards converge to canonical implementation with feature-flagged switchover path.
- MCP agents receive and acknowledge upload_complete events and can execute basic tasks.
- Production secrets rotated and stored in Vercel; no sensitive keys in repo.
- Playwright E2E tests pass in CI for the upload→process→playback path.

Appendix — Useful Commands
- Start upload service:
```bash
cd services/upload_service
npm ci
npm start
```
- Start processing worker:
```bash
node scripts/processing_worker.js
```
- Start Next.js locally:
```bash
cd web
npm ci
npm run dev
```
- Run MCP coordinator (example):
```bash
python3 agents/mcp_coordinator.py
```
- Inspect assets:
```bash
curl http://localhost:4001/api/assets | jq
```

Contacts & Escalation
- Repo owners / senior engineers: see `AGENTS.md` for agent contacts and owner roles.
- For Livepeer/streaming costs: contact platform owner and review `foundation/livepeer/orchestrator.ts`.

End of playbook — proceed with Step A then Step B and report back any blockers with logs from the upload service (`services/upload_service/data/assets.json`), worker output, and web server console.
