MCP (Mission Control Protocol) — Production Runbook
===============================================

Purpose
- This document explains how to run the MCP agent coordinator and agents in production (containerized or on Kubernetes), secure its credentials, and monitor health.

Images & Build
- Build a container image from `agents/Dockerfile` and push to your registry:

```bash
cd $(repo_root)
docker build -t your-registry/mightyverse-mcp:latest -f agents/Dockerfile .
docker push your-registry/mightyverse-mcp:latest
```

Required environment variables (set via secrets manager / k8s Secrets / Vercel where appropriate)
- `MCP_AUTH_TOKEN` - secret token agents use to authenticate requests
- `DATABASE_URL` - read-only DB connection (if agents need DB access)
- `MCP_SYNC_ENDPOINT` - optional endpoint for webhooks or agent coordination
- `LOG_LEVEL` - `info` or `debug`

Run with Docker Compose (example)

Add to your `docker-compose.prod.yml` the `mcp` service (already scaffolded). Start:

```bash
docker-compose -f infra/docker-compose.prod.yml up -d mcp
```

Run on Kubernetes (manifest)
- See `infra/mcp/k8s-deployment.yaml` (placed alongside this doc) for a sample Deployment, Service and Secret mapping. Apply with `kubectl apply -f` and configure imagePullSecrets and RBAC per cluster policies.

Health & Readiness
- Expose a `/health` endpoint (or configure liveness/readiness probes) to surface `agent_status` and queue length.
- The coordinator writes progress to logs and has `export_deployment_report()` for snapshots.

Security & Networking
- Run MCP behind internal load balancer / private network. Do not expose MCP coordinator directly to the public internet.
- Use mTLS or bearer tokens (`MCP_AUTH_TOKEN`) for agent-to-coordinator and coordinator-to-service calls.
- Limit outbound permissions: use a service account per environment with least privilege.

Scaling
- MCP Coordinator is primarily orchestration — run a single leader replica and scale agent workers horizontally.
- Use leader-election pattern or run coordinator as a singleton and scale agents.

Monitoring & Logging
- Centralize logs (stdout) to your logging platform (Datadog/CloudWatch/ELK).
- Export metrics: task success rate, tasks queued/completed/failed, agent heartbeat.

Maintenance & Upgrades
- Use rolling updates for deployments. Keep previous image for quick rollback.
- Backup any persistent state external to the coordinator. The coordinator should be stateless where possible.

Incident Response
- If MCP tasks fail repeatedly:
  - Inspect coordinator logs.
  - Check agents are registered and reachable.
  - Verify `MCP_AUTH_TOKEN` validity and clock skew.
