# Mighty Verse Developer Playbook (Concise)

- Platform model: Golden Shovel owns the platform; collaborators submit.
- No native DBs: all assets & metadata pinned to IPFS (nft.storage), immutable manifests.
- Sanity is marketing-only.
- Use Codespaces + Agent HQ + Copilot for development missions. Agents propose changes; humans approve.
- Asset flow:
  1. Animator uploads assets (bg/mg/fg + optional depth maps).
  2. Asset Review Agent runs AI pre-scan (depth, segmentation, tags).
  3. Admin reviews/ad anchors in AdAnchorEditor; finalizes anchors.
  4. Metadata Agent builds manifest.json; admin signs EIP-712 approval.
  5. MintApproval Agent executes testnet mint (credits/signature).
  6. Deck viewer displays minted card; campaign engine reserves anchors for sponsors.
- Holographic viewer: React Three Fiber with depth map-based z offsets; pop-out animation via GSAP.
- RBAC: admin/curator/animator/sponsor roles; multisig for production mint actions.
- AI: use Google Colab / Hugging Face / local models for depth & tagging — agent outputs must be human-reviewed.
- Testing: Hardhat tests for contracts; Playwright end-to-end for viewer QA.

---

## Quick dev checklist
- Create `.github/agents/` mission files (already present).
- Seed initial admin(s) and configure NFT_STORAGE_KEY in repo secrets for pinning workflows.
- Run `yarn install` / `npm install` in frontend and `npm install` in `contracts` before running tests.
- Use Codespaces + Agent HQ to run missions in plan mode before executing unless you are only creating PRs.

## Notes
- Human approval required for any action that affects money, minting, or sponsored placements.
- Keep all generated manifests and CIDs in `/data/` for indexing and auditability.
