from agents.asset_review import run_asset_review


def test_asset_review_basic():
    res = run_asset_review("bafy...", {"card_id": "c1", "project": "p"})
    assert "metadata_suggestion" in res
    assert "qc_report" in res
    assert res["qc_report"]["confidence_score"] > 0
import os
import json
import subprocess


def test_asset_review_creates_outputs(tmp_path):
    out = tmp_path / "out"
    out.mkdir()
    cmd = ["python", "-m", "agents.cli", "asset-review", "--asset-cid", "QmTest", "--out-dir", str(out)]
    r = subprocess.run(cmd, check=True, capture_output=True, text=True)
    # stdout prints three paths
    lines = [l.strip() for l in r.stdout.splitlines() if l.strip()]
    assert len(lines) >= 3
    for p in lines:
        assert os.path.exists(p)
        with open(p) as f:
            json.load(f)
