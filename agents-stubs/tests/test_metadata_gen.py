from agents.metadata_gen import build_metadata


def test_build_metadata_has_sha256():
    suggestion = {"card_id": "c1", "project": "p"}
    m = build_metadata(suggestion, depth_map_cid="bafydepth", ad_anchor_cid="bafyanchors")
    assert "sha256" in m
    assert m["depth_map_cid"] == "bafydepth"
import os
import json
import subprocess


def test_metadata_gen_creates_metadata(tmp_path):
    out = tmp_path / "out"
    out.mkdir()
    # create minimal suggestion
    sug = out / "metadata_suggestion.json"
    suggestion = {"card_id": "card_test", "project": "P", "animator_version": "v1", "layers": ["bg"], "timestamp": 123}
    with open(sug, "w") as f:
        json.dump(suggestion, f)

    cmd = ["python", "-m", "agents.cli", "metadata-gen", "--suggestion", str(sug), "--out-dir", str(out)]
    r = subprocess.run(cmd, check=True, capture_output=True, text=True)
    lines = [l.strip() for l in r.stdout.splitlines() if l.strip()]
    assert len(lines) >= 1
    p = lines[0]
    assert os.path.exists(p)
    with open(p) as f:
        data = json.load(f)
        assert data["card_id"] == "card_test"
