n8n — Production Runbook (scaffolded)
=====================================

Purpose
- Guide to deploy n8n in production for workflow orchestration while keeping security and secrets management in mind.

Options
- Lightweight: run `infra/n8n/docker-compose.yml` but protect access behind a VPN and basic auth.
- Production-ready: run n8n on Kubernetes with persistent Postgres and external auth, or use n8n.cloud managed offering.

Recommended K8s pattern (summary)
1. Deploy Postgres as managed DB (RDS / CloudSQL) — never use local ephemeral Postgres in prod.
2. Create k8s Secret for DB credentials and for `N8N_BASIC_AUTH_PASSWORD`.
3. Use `Deployment` with at least 2 replicas behind an internal Service and an Ingress with authentication (OIDC or Basic Auth + IP allowlist).
4. Store workflows in the DB (don't persist in code) and enable encryption for credentials.

Security
- Use `N8N_BASIC_AUTH_ACTIVE=true` and strong credentials stored as secrets.
- Restrict IPs to internal networks only. Use VPN or private load balancer.
- Rotate credentials and audit n8n workflows for sensitive data handling.

Integrating with Mighty Verse
- Webhooks from `web/pages/api/upload/complete.js` should point to a secure webhook node in n8n. Protect with bearer token and validate payloads.
- MCP: Use n8n to trigger MCP endpoints for manual approval flows. Use worker tokens and store them in n8n credentials.

Monitoring & Backups
- Monitor n8n queue length and workflow error rates.
- Backup Postgres regularly and export workflows to repository for audit copies.

Enablement Steps (quick)
1. Create Kubernetes secrets for `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`, and DB credentials.
2. Deploy n8n deployment and service; configure Ingress with auth.
3. Add webhook workloads and test by sending a POST from the web upload complete handler.
