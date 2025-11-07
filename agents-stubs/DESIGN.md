Design: Mighty Verse Agent Stubs
================================

Purpose
-------
This design describes the agent stubs package created to bootstrap The Mighty Verse agents. The goal is to provide a small, testable, and extensible foundation for gradually replacing stubs with real model/chain logic.

Tech stack
----------
- Language: Python 3.12
- HTTP service: FastAPI + Uvicorn
- Testing: pytest + FastAPI TestClient
- Packaging: lightweight files in `agents-stubs/` (no published package yet)

Directory layout
----------------
- agents-stubs/
  - agents/                # agent implementations (stubs)
    - asset_review.py
    - metadata_gen.py
    - mint_approval.py
  - service/               # FastAPI wrapper
    - app.py
  - cli.py                 # small CLI for local runs (writes outputs)
  - tests/                 # pytest tests
  - requirements.txt
  - Dockerfile
  - README.md

Design contract (quick)
-----------------------
- Agents accept simple JSON inputs and return JSON outputs (dicts). Each agent exposes both a CLI and an HTTP endpoint.
- Filesystem outputs (CLI) are written to a provided `--out-dir` so CI/tests can assert on outputs.

APIs
----
- POST /asset-review
  - body: {asset_cid?: str, manifest?: object}
  - response: {metadata_suggestion, qc_report, suggested_ad_anchors}

- POST /metadata-gen
  - body: {metadata_suggestion: object, depth_map_cid?: str, ad_anchor_cid?: str}
  - response: manifest (with sha256, timestamp)

- POST /mint-approval
  - body: {manifest_cid, card_id, credits_required, admin_signature?}
  - response: prepared tx object or error

Data shapes
-----------
- metadata_suggestion: minimal fields: card_id, project, animator_version, layers[]
- manifest.json: includes sha256, timestamp, optional depth/ad anchor CIDs

Pinning & web3 hooks
--------------------
- `metadata_gen` contains a helper to pin manifests to nft.storage if `NFT_STORAGE_KEY` environment variable is set. In the stub, pinning is opt-in and safe to skip.

Testing strategy
----------------
- Unit tests for pure functions (sha256 computation, simple validations).
- Integration tests using FastAPI TestClient for endpoints.
- CLI smoke tests that call `python -m agents.cli` and verify output files.

Edge cases and error modes
-------------------------
- Missing layers or invalid manifest: agent returns validation errors or raises HTTP 400.
- Pinning failures (network or API key missing): metadata-gen should surface the failure and allow manual retry.

Next phases
-----------
1. Replace stub internals with real model calls in `asset_review` (MiDaS, SAM, CLIP, Whisper).
2. Implement robust pinning (nft.storage) with retry/backoff and local cache for dev.
3. Wire `mint_approval` to Hardhat / ethers.js or a Python web3 signer and add EIP-712 payload generation.
4. Add CI to run tests, and a CD step to build Docker images.
