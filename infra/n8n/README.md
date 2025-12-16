n8n scaffold (kept for strategic reasons)

Purpose
- Retain an n8n workflow scaffold in the repo for future orchestration and visual workflow design without deploying it by default.

Contents
- This folder intentionally contains a lightweight stub and documentation only. No services are started by default.

Suggested files to add when enabling n8n:
- docker-compose.yml (service definition for n8n, Postgres, and redis)
- workflows/default_workflow.json (sample workflow that listens for upload callbacks and posts to MCP)

Security
- Never commit production credentials. Use environment files stored securely (Vault/GCP Secret Manager/AWS Secrets Manager).

How to enable (developer steps)
1. Create `docker-compose.yml` in this folder with `n8nio/n8n` image and required env vars.
2. Add sample workflow into `workflows/` and point webhook nodes to the upload service endpoints.
3. Start n8n locally for testing only (do not start on CI or production without secure secrets).

Why keep it in repo
- Strategic: keeps integration design visible for product & architecture reviews and for later orchestration.