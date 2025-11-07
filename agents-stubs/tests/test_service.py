from fastapi.testclient import TestClient
from agents_stubs.service.app import app


client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_asset_review_endpoint():
    payload = {"asset_cid": "bafy_test", "manifest": {"card_id": "c1"}}
    r = client.post("/asset-review", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "metadata_suggestion" in body


def test_metadata_gen_endpoint():
    payload = {"metadata_suggestion": {"card_id": "card_test", "project": "P"}}
    r = client.post("/metadata-gen", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "sha256" in body


def test_mint_approval_endpoint():
    payload = {"manifest_cid": "cid", "card_id": "card123", "credits_required": 0}
    r = client.post("/mint-approval", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "prepared"
