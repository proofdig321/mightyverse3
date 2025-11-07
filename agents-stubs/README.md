# Agents Stubs — Quick start (Codespaces automated)

This folder contains the agent prototype for The Mighty Verse. The Codespace devcontainer auto-installs the minimal Python dependencies so you can start developing with zero manual setup.

What the devcontainer does automatically
- Installs Python 3.12 runtime via the official devcontainer image.
- Runs the `postCreateCommand` to install `agents-stubs/requirements.txt`.
- Forwards port `8000` so you can open the FastAPI server from the Codespaces browser.

Quick commands (inside the Codespace)

Activate the virtualenv (if you prefer to run inside one):
```
python -m venv .venv
source .venv/bin/activate
```

Install (also run automatically by the devcontainer):
```
make -C agents-stubs install
```

Run tests:
```
make -C agents-stubs test
```

Start the API server (forwarded at port 8000 in Codespaces):
```
make -C agents-stubs run
# then open the forwarded port in the Codespaces Ports panel
```

Pinning and secrets
- To auto-pin artifacts to nft.storage set the `NFT_STORAGE_KEY` environment variable in the Codespace or repository secrets.
- Notifier: set `GITHUB_TOKEN` + `GITHUB_REPOSITORY` to allow the notifier (`cli_pin_notify.py`) to create issues; set `WEBHOOK_URL`/`WEBHOOK_PLATFORM` for webhook posting.

Admin CLI examples
```
# list pending pins
python agents-stubs/cli_pin_retry.py --list

# notify (creates issue or posts webhook)
python agents-stubs/cli_pin_notify.py
```

Tips
- If you need ML extras (MiDaS, SAM, Whisper) install `agents-stubs/requirements-ml.txt` — note this can be large and may need more resources than a standard Codespace.
- For long-running or GPU work, use a dedicated VM or specialized cloud instance.
# Agents Stubs — Quick start (Codespaces)

This folder contains the prototype agent implementations, utilities and admin CLIs used by The Mighty Verse project.

This README focuses on running and developing inside GitHub Codespaces (or any Linux dev VM).

Prereqs
- Python 3.12
- Optional: Docker (for container builds)

Quick setup (Codespaces)

1. Create and activate a virtualenv

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

2. Install minimal dependencies

```bash
pip install -r agents-stubs/requirements.txt
```

Optional ML extras

```bash
# heavy; only if you need model inference locally
pip install -r agents-stubs/requirements-ml.txt
# or run: bash agents-stubs/scripts/setup-ml.sh
```

Common commands (from repo root)

Start the FastAPI service (dev)

```bash
uvicorn agents-stubs.service.app:app --reload --port 8000
```

Run the test suite

```bash
pytest -q agents-stubs/tests
```

Run an agent via CLI

```bash
python -m agents_stubs.cli --agent asset-review --input /path/to/file.jpg --output /tmp/out.json
```

Pin retry / notifier

```bash
# list pending pins
python agents-stubs/cli_pin_retry.py --list

# retry a pending file
python agents-stubs/cli_pin_retry.py --retry t.pending.json

# run notifier (creates issue or posts webhook)
python agents-stubs/cli_pin_notify.py
```

Devcontainer

If you open this repo in Codespaces the devcontainer will install dependencies automatically (see `/.devcontainer/devcontainer.json`).

Secrets & env vars
- `NFT_STORAGE_KEY` — nft.storage API key (pinning)
- `GITHUB_TOKEN` and `GITHUB_REPOSITORY` — allow notifier to create issues
- `WEBHOOK_URL`, `WEBHOOK_PLATFORM` — webhook destination and platform (slack|discord)

Notes
- The ML integrations are optional and stubbed when the Python packages are not installed. The test suite uses mocks for heavy ML libraries to stay CI-friendly.

If you want, I can add example inputs under `agents-stubs/testdata/` and a demo script to exercise the entire pipeline.
Simple agent stubs for The Mighty Verse project.

This package contains minimal Python CLIs for three agents:
- asset-review
- metadata-gen
- mint-approval

Each agent has a small callable interface and unit tests (pytest).

How to run tests:

```bash
python -m pip install -r requirements.txt
pytest -q
```

Files created for quick iteration. These are stubs — replace the internals with real model calls and IPFS pinning later.

Run the HTTP service locally for development:

```bash
python -m uvicorn service.app:app --reload --port 8000
# then open http://localhost:8000/docs for interactive API docs
```

Build and run via Docker:

```bash
docker build -t mighty-agents-stubs -f agents-stubs/Dockerfile .
docker run -p 8000:8000 mighty-agents-stubs

Environment variables
---------------------
- `NFT_STORAGE_KEY` — optional API key to pin manifests to nft.storage from `metadata_gen`. If unset, pinning is skipped.

ML / inference notes
--------------------

This project keeps ML dependencies optional so the test suite and CI remain
lightweight. If you want to run real inference locally, install the optional
ML requirements with:

```bash
pip install -r agents-stubs/requirements-ml.txt
```

After installing the ML extras you'll be able to run MiDaS/segment-anything/
Whisper if your machine has sufficient resources. The `integrations` module
will automatically detect and use installed libraries; otherwise it returns
safe stubs so operations continue to work.

Recommended workflow:
- Run unit tests without ML libs in CI (current default).
- For local development with models, install `agents-stubs/requirements-ml.txt`.
- Set `NFT_STORAGE_KEY` in your environment if you want generated depth/seg
	artifacts to be pinned automatically.

Quick ML setup (local)
----------------------

We added a helper script to quickly create a venv and install optional ML
dependencies. From the repository root run:

```bash
bash agents-stubs/scripts/setup-ml.sh
```

Pass `--cpu` to prefer CPU-only installs where applicable (you may still need
to adjust the torch wheel for your platform). After activation, you can run
the agents locally and the `integrations` module will detect installed
libraries.

```
Agents Stubs - Tiny local implementations for development

This folder contains minimal, local stubs for three agents used in The Mighty Verse project:

- asset-review: Scans an uploaded asset and emits three JSON files (metadata suggestion, QC report, ad anchors)
- metadata-gen: Validates/merges suggestion data into a canonical metadata.json and returns a fake CID
- mint-approval: Verifies preconditions and emits a simulated mint transaction and receipt

Quick start

1. (Optional) Create a virtualenv and install dev deps:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the asset-review stub:

```bash
python -m agents.cli asset-review --asset-cid QmAssetExample --out-dir ./data/out
```

3. Run metadata-gen using the suggestion produced in step 2:

```bash
python -m agents.cli metadata-gen --suggestion ./data/out/metadata_suggestion.json --out-dir ./data/out
```

4. Run mint-approval (simulated):

```bash
python -m agents.cli mint-approval --manifest-cid cid_example --card-id card_001 --credits-required 10 --out-dir ./data/out
```

Run tests:

```bash
pytest -q
```
