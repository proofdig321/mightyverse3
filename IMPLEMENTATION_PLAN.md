# Implementation Plan — Production Readiness for Campaigns & Streaming

This runbook summarizes the steps to deploy the enterprise-ready Campaign/Stream system safely.

## Required environment variables
- DATABASE_URL — Postgres connection string (enables persistence and outbox)
- APP_API_KEY — API key for admin endpoints and WS token (enable strict auth)
- WS_BROADCAST_URL — WebSocket broadcast endpoint used by outbox worker (optional)
- WS_BROADCAST_TOKEN — Token appended to WS connections (if used)
- REDIS_URL — Redis for pub/sub (optional, recommended for scaling)
- OUTBOX_MAX_RETRIES — Max retries before moving to DLQ (default 5)
- OUTBOX_BACKOFF_BASE_MS — Base backoff in ms (default 1000)
- OUTBOX_METRICS — 'true' to enable /metrics (default enabled)

## Deployment steps
1. Run DB migrations (review migrations in `db/migrations`):
   - `20251106_add_campaigns.sql` (creates campaigns, stream_sessions, placements, outbox)
   - `20251106_add_outbox_dlq.sql` (adds DLQ table)
   - `20251106_add_indexes.sql` (adds indexes)

2. Start Redis (optional) for scalable pub/sub.
3. Start WS broadcast server (or managed gateway) and provide `WS_BROADCAST_URL` to workers.
4. Start outbox worker(s) with appropriate env vars; ensure `OUTBOX_METRICS_PORT` is reachable by Prometheus.
5. Smoke test: create a campaign via API, create a stream, schedule a placement, verify outbox row and delivery via WS or Redis.

## Monitoring & Ops
- Scrape `/metrics` from outbox workers. Alert on `outbox_failed_total` or `outbox_moved_dlq_total` spikes.
- Monitor DB replication lag, placement delivery latency, and stream startup latency.

## DLQ handling
- Inspect `outbox_dlq` for events moved there. Reprocess via a safe admin job that re-inserts into `outbox` after fixing root cause.

## Rollout plan
1. Canary: run one instance with DB + Redis in a staging environment, enable metrics and DLQ monitoring.
2. Smoke test flows end-to-end, then increase traffic.
3. Gradual rollout to pre-production and production with health checks.
# Enterprise Stream Campaigns — Implementation Plan & Runbook

Purpose
- Provide a single, executable runbook and implementation checklist for the enterprise-grade campaign → stream integration, Deck (2.5D) player, PinningService, Livepeer orchestrator, Agent SDK, DB migrations, tests, duplication scan, and PR automation.
- This file is read-only guidance; all production-critical steps require human approval per `AGENTS.md`.

Scope
- Non-destructive scaffolds added and/or planned:
  - `foundation/pinning/index.ts` — Multi-provider IPFS service (exists)
  - `foundation/livepeer/orchestrator.ts` — Stream management (exists)
  - `foundation/agent-sdk/index.ts` — Enterprise agent framework (exists)
  - `services/campaigns/orchestrator.ts` — Campaign execution engine (added)
  - `web/components/DeckPlayer/DeckPlayer.tsx` — Deck player component (added)
  - `db/migrations/20251106_add_campaigns.sql` — Additive migration (added)
  - `scripts/find_agent_duplicates.sh` — Duplicate-content scanner (added)
  - `scripts/create_branch_and_pr.sh` — PR helper script (added)

Prereqs (run in dev container / Amazon Q)
- Ensure git & gh configured, push permission, and appropriate Node/TS toolchain installed.
- Required env vars (CI/Local):
  - `PINATA_JWT` / `PINATA_API_KEY` / `PINATA_SECRET_KEY` (for Pinata)
  - `LIVEPEER_API_KEY` (if using Livepeer)
  - `IPFS_GATEWAY` (optional)
  - DB connection (for migrations)
- Do NOT embed secrets in repo. Use secret manager (AWS Secrets Manager) for production.

Quick commands (run in repo root)
- Preflight
```
git status
gh auth status
git remote -v
node -v
npm -v
```

- Create branch, commit scaffolds, push & open draft PR
```
bash scripts/create_branch_and_pr.sh
# or run manually:
git checkout -b feature/enterprise-stream-campaigns
git add foundation/ services/ web/components/ db/migrations scripts/
git commit -m "chore: add enterprise stream campaigns scaffolds (pinning, livepeer, agent-sdk, deck player)"
git push --set-upstream origin feature/enterprise-stream-campaigns
gh pr create --draft --title "Enterprise: Stream Campaigns + Deck Player" --body "Draft PR — requires human approvals per AGENTS.md" --base main
```

Run tests & duplication scan
```
npm ci
npx jest --runInBand
bash scripts/find_agent_duplicates.sh . ./agent-dup-report.txt
```

Human-in-loop checklist (MUST before enabling production behavior)
- [ ] PR has an explicit approval checklist referencing `AGENTS.md`.
- [ ] Secrets are stored in AWS Secrets Manager, not repo.
- [ ] Livepeer keys rotated and set as short-lived tokens.
- [ ] Pinning provider keys provisioned and validated.
- [ ] DB migration reviewed and backed up; run in canary DB first.
- [ ] Feature flags added for Deck/CampaignOrchestrator switch.
- [ ] Admin approval flow present for campaign "go-live" action.
- [ ] QA: E2E simulation (upload creative → pin → schedule → simulate stream) passed.
- [ ] Security: SCA run; critical/high vulnerabilities remediated.

Rollout plan (phased)
1. Add DB objects + pinning/library code; deploy to staging (feature flag off). Validate pin health.
2. Deploy AgentSDK and migrate agents to use PinningService (dry-run mode).
3. Deploy CampaignOrchestrator in dry-run mode (logs only); simulate scheduling.
4. Deploy DeckPlayer to admin preview UI; enable preview & simulate streams.
5. Enable scheduled execution in canary streams; manual approvals required.
6. Monitor for 72h, promote to full production via feature flag.

Observability & SLOs
- Instrument AgentSDK, LivepeerOrchestrator, CampaignOrchestrator with OpenTelemetry.
- Dashboards: agent job success rate, outbox queue depth, pin health (per provider), stream ingest errors, placement execution latency.
- SLO examples: agent job success >= 99.5%, pin availability >= 99.9%, Livepeer ingest success >= 99%.

Risks & mitigations
- Pin loss: replicate across Pinata + self-hosted + Filecoin; automated re-pin jobs.
- Duplicate placements/mints: persistent idempotency keys + admin man-gate before mint.
- Livepeer cost spikes: per-sponsor quotas + transcoding presets by budget.
- Secret leaks: rotate & revoke keys immediately; audit IAM access.

Priority backlog (top items)
1. Secrets manager & key rotation — urgent.
2. PinningService replication & health automation.
3. AgentSDK: idempotency, tracing, structured logs.
4. CampaignOrchestrator + outbox implementation.
5. DeckPlayer: clock-sync, WebSocket placement delivery, 2.5D rendering & fallback.
6. LivepeerOrchestrator: ingest token rotation + recording persistence + manifest pinning.
7. Admin UI: Schedule builder + preview/simulate + approval checklist.
8. CI: integration tests & canary workflow.

Next steps for operator
1. Review the `foundation/*` files already present; replace stub idempotency with DB/Redis backed implementations.
2. Run the duplication scan and fix duplicate agent code if any.
3. Run the PR script above to create a draft PR and run CI.
4. Perform human-in-loop approvals from Platform Lead / DevOps.

Contact
- Platform Lead: Bhekithemba Simelane
- Repo Owner: owner@example.com

End of runbook.
# Enterprise Stream Campaigns — Implementation Plan & Runbook

## Purpose
- Provide a single, executable runbook and implementation checklist for the enterprise-grade campaign → stream integration, Deck (2.5D) player, PinningService, Livepeer orchestrator, Agent SDK, DB migrations, tests, duplication scan, and PR automation.  
- This file is read-only guidance; all production-critical steps require human approval per AGENTS.md.

## Scope
- Non-destructive scaffolds added:
  - foundation/pinning/index.ts (+ tests)
  - foundation/livepeer/orchestrator.ts
  - foundation/agent-sdk/index.ts
  - services/campaigns/orchestrator.ts
  - web/components/DeckPlayer/DeckPlayer.tsx (+ tests)
  - db/migrations/20251106_add_campaigns.sql
  - scripts/find_agent_duplicates.sh
  - scripts/create_branch_and_pr.sh
- Backwards-compatible: Additive DB migrations, feature-flagged runtime behavior recommended.

## Prereqs (run in dev container / Amazon Q)
- Ensure git & gh configured, push permission, and appropriate Node/TS toolchain installed.
- Required env vars (CI/Local):
  - PINNER_TYPE (pinata|infura|self)
  - PINATA_API_KEY, PINATA_API_SECRET (if PINNER_TYPE=pinata)
  - LIVEPEER_API_KEY (if using Livepeer)
  - IPFS_GATEWAY (optional)
  - DB connection (for migrations)
- Do NOT embed secrets in repo. Use secret manager (AWS Secrets Manager) for production.

## Files to add (high level)
- foundation/pinning/index.ts — PinningService wrapper (Pinata/Infura/self), health checks.
- foundation/pinning/__tests__/pinning.test.ts — Jest unit tests (axios mocked).
- foundation/livepeer/orchestrator.ts — Livepeer token & recording orchestration.
- foundation/agent-sdk/index.ts — Agent base with idempotency scaffolding & logger.
- services/campaigns/orchestrator.ts — Campaign scheduling & placement execution skeleton.
- db/migrations/20251106_add_campaigns.sql — Add campaigns, placements, stream_sessions, outbox.
- web/components/DeckPlayer/DeckPlayer.tsx — Deck player skeleton (HLS + overlay timeline).
- web/components/DeckPlayer/__tests__/DeckPlayer.test.tsx — RTL timing test (fake timers).
- scripts/find_agent_duplicates.sh — Duplicate-content scan for agents folder.
- scripts/create_branch_and_pr.sh — Commit + push + create draft PR (gh).

## Recommended branch / PR
- Branch: feature/enterprise-stream-campaigns
- PR: Draft PR "Enterprise: Stream Campaigns + Deck Player" (human reviewers listed below)

## Quick commands (run in repo root)
- Preflight
```bash
git status
gh auth status
git remote -v
node -v
npm -v
```

Create branch, commit scaffolds, push & open draft PR (script)
```bash
bash scripts/create_branch_and_pr.sh
# or run manually:
git checkout -b feature/enterprise-stream-campaigns
git add foundation/ services/ web/components/ db/migrations scripts/
git commit -m "chore: add enterprise stream campaigns scaffolds (pinning, livepeer, agent-sdk, deck player)"
git push --set-upstream origin feature/enterprise-stream-campaigns
gh pr create --draft --title "Enterprise: Stream Campaigns + Deck Player" --body "Draft PR — requires human approvals per AGENTS.md" --base main
```

Run tests locally (optional)
```bash
# install deps as required (example)
npm ci
# run jest
npx jest --runInBand
# run duplication scan
bash scripts/find_agent_duplicates.sh . ./agent-dup-report.txt
```

## Human-in-loop checklist (MUST before enabling production behavior)

- [ ] PR has an explicit approval checklist referencing AGENTS.md.
- [ ] Secrets are stored in AWS Secrets Manager, not repo.
- [ ] Livepeer keys rotated and set as short-lived tokens.
- [ ] Pinning provider keys provisioned and validated.
- [ ] DB migration reviewed and backed up; run in canary DB first.
- [ ] Feature flags added for Deck/CampaignOrchestrator switch.
- [ ] Admin approval flow present for campaign "go-live" action.
- [ ] QA: E2E simulation (upload creative → pin → schedule → simulate stream) passed.
- [ ] Security: SCA run; critical/high vulnerabilities remediated.

## Testing & QA plan

Unit tests: run jest for pinning and DeckPlayer.
Contract tests: Pact / contract harness for Agent ↔ Foundation APIs.
Integration (CI): mocked IPFS & Livepeer endpoints; run schedule simulation.
E2E (staging): real Livepeer account + S3 recording; verify manifest pinned & playback URLs served.

## Rollout plan (phased)

1. Add DB objects + pinning/library code; deploy to staging (feature flag off). Validate pin health.
2. Deploy AgentSDK and migrate agents to use PinningService (dry-run mode).
3. Deploy CampaignOrchestrator in dry-run mode (logs only); simulate scheduling.
4. Deploy DeckPlayer to admin preview UI; enable preview & simulate streams.
5. Enable scheduled execution in canary streams; manual approvals required.
6. Monitor for 72h, promote to full production via feature flag.

## Observability & SLOs

Instrument AgentSDK, LivepeerOrchestrator, CampaignOrchestrator with OpenTelemetry.
Dashboards: agent job success rate, outbox queue depth, pin health (per provider), stream ingest errors, placement execution latency.
SLO examples: agent job success >= 99.5%, pin availability >= 99.9%, Livepeer ingest success >= 99%.

## Risks & mitigations

Pin loss: replicate across Pinata + self-hosted + Filecoin; automated re-pin jobs.
Duplicate placements/mints: persistent idempotency keys + admin man-gate before mint.
Livepeer cost spikes: per-sponsor quotas + transcoding presets by budget.
Secret leaks: rotate & revoke keys immediately; audit IAM access.

## Priority backlog (top items)

1. Secrets manager & key rotation — urgent.
2. PinningService replication & health automation.
3. AgentSDK: idempotency, tracing, structured logs.
4. CampaignOrchestrator + outbox implementation.
5. DeckPlayer: clock-sync, WebSocket placement delivery, 2.5D rendering & fallback.
6. LivepeerOrchestrator: ingest token rotation + recording persistence + manifest pinning.
7. Admin UI: Schedule builder + preview/simulate + approval checklist.
8. CI: integration tests & canary workflow.

## Contacts & reviewers (suggested)

- Platform Lead: Bhekithemba Simelane
- DevOps Multisig: DevOps Admins (GnosisSafe)
- Repo Owner: owner@example.com
- QA Lead: (assign)

## Acceptance criteria for merge

- All unit tests passing or skipped intentionally with rationale.
- CI workflow added to run tests on PR.
- Human approval met (checklist completed and signed by Platform Lead).
- Secrets not in PR.

## Notes / Constraints

- Per AGENTS.md: Agents are assistants; no automatic production deploys or approvals of minting/ad placement without explicit human sign-off.
- This file is intended to be executed by you in Amazon Q / Codespaces. I will not perform remote pushes or direct production changes.

## Next steps for you to run (minimum)

1. Copy this file to /workspaces/The-Mighty-Verse-2/IMPLEMENTATION_PLAN.md
2. Place scaffold files (or run the provided script to generate them).
3. Run bash scripts/create_branch_and_pr.sh to create a draft PR.
4. Validate tests locally and run duplication scan.
5. Open the PR, complete the human-in-loop checklist, and merge after approvals.

## Appendix — Quick commands summary

```bash
# preflight
gh auth status
git remote -v

# push PR
bash scripts/create_branch_and_pr.sh

# run tests & scan
npm ci
npx jest --runInBand
bash scripts/find_agent_duplicates.sh . ./agent-dup-report.txt
```

End of runbook — run via Amazon Q and report back the PR link and test results.
Human approvals required per AGENTS.md.