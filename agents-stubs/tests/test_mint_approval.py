from agents.mint_approval import prepare_mint


def test_prepare_mint_success():
    tx = prepare_mint("bafy:manifest", "card123", credits_required=0)
    assert tx.get("status") == "prepared"


def test_prepare_mint_need_signature():
    tx = prepare_mint("bafy:manifest", "card123", credits_required=1)
    assert "error" in tx
import os
import json
import subprocess


def test_mint_approval_creates_tx_and_receipt(tmp_path):
    out = tmp_path / "out"
    out.mkdir()
    cmd = [
        "python", "-m", "agents.cli", "mint-approval",
        "--manifest-cid", "cid_test", "--card-id", "card_test", "--credits-required", "5", "--out-dir", str(out)
    ]
    r = subprocess.run(cmd, check=True, capture_output=True, text=True)
    lines = [l.strip() for l in r.stdout.splitlines() if l.strip()]
    assert len(lines) >= 2
    for p in lines:
        assert os.path.exists(p)
        with open(p) as f:
            json.load(f)
