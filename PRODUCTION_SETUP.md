Production Integration & Runbook
=================================

Date: 2025-12-16

Purpose
- A single-source production integration guide for The Mighty Verse. Non-destructive, configuration-first. Use this as the authoritative runbook for production deployments (web, services, workers, storage, Livepeer, and optional n8n).

High-level architecture
- Web frontend: Next.js (deployed to Vercel or containerized behind CDN)
- API / services: Node/Express services (upload service, others) deployed as containers or serverless functions
- Background workers: containerized or managed jobs (processing, transcoding orchestration)
- Storage: S3-compatible object store (AWS S3, Supabase Storage, or Backblaze B2)
- Database: PostgreSQL (managed) with RLS via Supabase where applicable
- Streaming: Livepeer Studio for transcoding + playback manifests
- Agents / Orchestration: MCP agents (Python) local orchestration; optional n8n for human-friendly workflows

Secrets & Vault
- Store all production secrets in a secret manager (Vault, AWS Secrets Manager, GCP Secret Manager, or Vercel environment variables).
- Never commit secrets into the repo. Use the provided `.env.production.sample` as a template only.

Env variables (required minimum)
- `DATABASE_URL` - Postgres connection URL (production)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` - for server-side Supabase access
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - object storage
- `LIVEPEER_API_KEY` - Livepeer Studio API key (rotate regularly, short-lived tokens recommended)
- `JWT_SECRET` - signing key for API tokens
- `MCP_AUTH_TOKEN` - token for MCP agent coordination

Storage & CDN
- Use S3-backed storage with CDN fronting (CloudFront, Cloudflare, or Fastly).
- Ensure objects have correct `Content-Type` and `Cache-Control` headers set on upload or via edge rules.
- Serve media via signed URLs (short TTL) for private assets; public assets may be cached via CDN.

Upload Pipeline (production)
1. Client requests `POST /api/upload/init` (server returns signed URL + asset record).
2. Client uploads file directly to S3 via signed URL (multipart for large files).
3. Client calls `POST /api/upload/complete` to mark as uploaded.
4. Background worker picks queued item, validates MIME and magic bytes, sanitizes (for Lottie), transcodes to MP4/WebM, generates posters, and updates DB with derived asset URLs.
5. CDN invalidation (if necessary) and notifications to MCP agents or analytics.

Media Transcoding & Fallbacks
- Transcode to H.264 MP4 (baseline) and WebM (optional) for browser compatibility.
- Generate posters (JPG/WEBP), small animated preview (GIF/APNG), and a low-res chunked preview for mobile.
- For Lottie (.json) assets: sanitize JSON, optionally render to video for older browsers.

Livepeer Integration
- Use `foundation/livepeer/orchestrator.ts` as the canonical integration.
- Use ephemeral API keys when possible. Protect keys server-side and never expose them to clients.
- Persist `livepeer_asset_id`, `livepeer_playback_id`, and playback URLs in the assets table.

MCP Agents & n8n
- MCP: The repo contains `agents/` Python agents (coordinator + agents). These are orchestration helpers and should run in a controlled environment with the `MCP_AUTH_TOKEN` set.
- n8n: optional orchestration UI. Keep disabled by default; if enabled, host behind VPN and use webhooks with auth.

Monitoring & Alerts
- Metrics: upload success rate, processing failures, transcoding queue depth, Livepeer ingest failures, playback errors.
- Logs: centralize to ELK/Datadog/CloudWatch/GCP Logging.
- Alerts: high error rate, queue depth > threshold, 5xx rates increase, Livepeer cost spikes.

CI/CD & Deployments
- Web: recommended deploy to Vercel for Next.js (use Vercel Production Team + environment variables).
- Services & Workers: build container images, push to registry, deploy via Docker Compose on managed hosts, or Kubernetes with a rolling update strategy. Use feature flags for new UI changes.
- Database migrations: run using safe, additive migrations. Keep destructive changes in multi-step migrations.

Rollback Strategy
- Keep previous container image available, use canary rollout and quick switch-back.
- Keep DB backups and run migrations in a way that allows backward compatibility for a safe rollback.

Runbook - Quick Commands
1. Deploy web (Vercel): ensure env vars set on Vercel, then run `vercel --prod`.
2. Deploy services (Docker host): build images and `docker-compose -f docker-compose.prod.yml up -d`.
3. Start worker: run as systemd service or `docker-compose` worker replica.

Security
- Enforce TLS everywhere. Use HSTS and strong TLS ciphers.
- Enforce RBAC and RLS on DB queries.
- Validate all uploads for mime-type and magic headers. Scan binaries.

Appendix
- See `infra/docker-compose.prod.yml` for a sample production compose.
- See `web/.env.production.sample` for environment variable templates.
- See `services/upload_service/production.md` for migrating the local upload scaffold to production.
