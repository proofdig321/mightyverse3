# Scalability & Production Plan (summary)

This document summarizes prioritized actions and architectural choices to support 100+ concurrent streams, enterprise-grade asset & sponsor management, and reliable placement delivery.

## High-level priorities (ordered)

1. Outbox & Worker Hardening
   - Retries with exponential backoff, DLQ for permanent failures (implemented in this branch).
   - Idempotency keys and idempotent handlers for delivery.
   - Monitoring: counters for processed, failed, DLQ, processing latency.

2. Pub/Sub and WebSocket Scaling
   - Replace single-process WS broadcaster with a scalable gateway using Redis Pub/Sub or Kafka.
   - Use Redis Streams or Kafka as the durable event backbone for low-latency fanout.
   - Authentication via JWT for per-stream/topic ACL.

3. Database Scalability
   - Add indices on `placements(stream_session_id, start_ms)`, `outbox(processed_at, created_at)` and partition `placements` if write volume grows.
   - Consider Citus or read replicas for high read concurrency.

4. Asset Storage & CDN
   - Store large assets in S3 (or equivalent) with content-addressing; pin metadata to IPFS where needed.
   - Serve creative assets via CDN and version them; use signed URLs for upload/download.

5. Ingest & Live Transcoding
   - Autoscale ingest relays; provide health-checked fallback ingest endpoints.
   - Use Livepeer Studio for managed transcode; implement connection pooling and backpressure.

6. Observability & SLOs
   - Prometheus + Grafana + OpenTelemetry tracing across services.
   - Define SLOs: stream startup latency, placement delivery latency, placement success rate.

7. Sponsor & Metadata Management
   - Sponsor CRUD + budget management, approval workflows, rate-limited placements per sponsor.
   - Schema registry and validation for placement manifests; re-pin/repair tooling.

8. Testing & CI
   - Add integration tests in CI using Docker Compose or a test infra provider.
   - Add e2e tests that validate the full flow including outbox and WS delivery.

## Quick wins (low effort)
- Add DB indices in next migration
- Add Prometheus counters in outbox worker
- Add a lightweight Redis-backed message broadcaster for local testing

## Long-term (bigger projects)
- Migrate to Kafka or managed pub/sub for multi-region delivery
- Add sharded Postgres/Citus for placement heavy workloads
- Add multi-tenant isolation and RBAC for sponsor users

## Notes
- The current branch added transactional outbox writes and a DLQ table. Operator runbook should include DLQ review and reprocessing steps.
