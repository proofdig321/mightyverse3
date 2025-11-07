# Mighty Verse — Agents Index (AGENTS.md)
This repository contains agent mission templates and agent specifications to operate within GitHub Codespaces + Agent HQ. These agents are *assistants* to speed development — all actions require human approval for production-critical steps (QC, ad placement, minting).

## How to use
1. Place mission files in `/.github/agents/` or `/agents/`.
2. Open Codespaces → Agent HQ → import mission (Plan Mode / Mission Control).
3. Assign agent to run a mission; review changes in PRs; approve & merge.
4. Human-in-the-loop checkpoints are mandatory for minting & ad approval.

## Agent categories
- `asset-review` — AI-assisted asset validation & tagging
- `metadata-gen` — metadata JSON builder & manifest curator
- `deck-view` — deck UI and 2.5D viewer scaffold
- `mint-approval` — ApprovalRegistry + mint flow verification
- `ad-placement` — AI ad anchor suggestions and admin editor generator
- `murals` — multi-animator mural assembly & versioning
- `campaigns` — sponsor campaign management & scheduling
- `audio-workflows` — ISRC gen, audio tagging, split-sheet helper
- `admin-dashboard` — admin / curator tool scaffolding
- `animator-dashboard` — animator upload + depth map guidance
- `rbac` — role-based access control scaffolding & policy enforcement
- `contracts` — smart contract generation + test scaffolding
- `ci-cd` — GitHub Actions & deployment missions
- `security` — audit checklist & automated linting/tests

---

## Agent responsibilities (short)
- **Only** propose code or metadata changes; **do not** auto-deploy to production without explicit admin sign-off.
- Attach a human checklist to each PR for sensitive tasks.
- Use deterministic settings (temperature 0) for code/metadata generation.

---

## Contact / Admin
- Platform Lead: `Bhekithemba Simelane`
- DevOps Admin Multisig: `GnosisSafe:0x...`
- Repo Owner / Emergency contact: `owner@example.com`
