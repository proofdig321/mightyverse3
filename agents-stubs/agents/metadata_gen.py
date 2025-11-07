"""Stub for metadata-generation agent."""
import json
from typing import Dict, Any
import hashlib
import os
import requests
from typing import Optional


def build_metadata(metadata_suggestion: Dict[str, Any], depth_map_cid: str = None, ad_anchor_cid: str = None) -> Dict[str, Any]:
    """Build a canonical metadata.json from suggestion.

    This stub computes a fake sha256 and returns a manifest dict.
    """
    base = dict(metadata_suggestion)
    base["depth_map_cid"] = depth_map_cid
    base["ad_anchor_cid"] = ad_anchor_cid
    # pretend asset content
    sample_bytes = json.dumps(base, sort_keys=True).encode("utf-8")
    base["sha256"] = hashlib.sha256(sample_bytes).hexdigest()
    base["timestamp"] = "stub-timestamp"

    # Optional: pin to nft.storage if NFT_STORAGE_KEY is present
    key = os.environ.get("NFT_STORAGE_KEY")
    if key:
        try:
            # use the robust helper in utils/pinning
            from ..utils.pinning import pin_json_with_retries

            cid = pin_json_with_retries(base, key)
            base["manifest_cid"] = cid
        except Exception:
            # Do not fail the stub on pin errors; surface later via logs in real impl.
            base["manifest_cid"] = None

    return base


def pin_json_to_nft_storage(obj: Dict[str, Any], api_key: str) -> Optional[str]:
    """Pin the given JSON object to nft.storage and return the CID.

    This is a minimal helper. In production, use the official SDK and retries.
    """
    url = "https://api.nft.storage/store"
    headers = {"Authorization": f"Bearer {api_key}"}
    res = requests.post(url, json=obj, headers=headers, timeout=10)
    res.raise_for_status()
    data = res.json()
    # nft.storage may return CID as string or as an object; handle both.
    value = data.get("value", {})
    cid_field = value.get("cid")
    cid = None
    if isinstance(cid_field, dict):
        # examples: {"/": "bafy..."} or {"cid": {"/": "bafy..."}}
        cid = cid_field.get("/") or cid_field.get("value")
    elif isinstance(cid_field, str):
        cid = cid_field
    # fallback: sometimes different shape
    if not cid:
        # try common nested path
        cid = value.get("/") or data.get("cid")
    return cid


def main():
    import sys

    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    suggestion = payload.get("metadata_suggestion", {})
    depth = payload.get("depth_map_cid")
    anchors = payload.get("ad_anchor_cid")
    manifest = build_metadata(suggestion, depth, anchors)
    print(json.dumps(manifest))


if __name__ == "__main__":
    main()
import argparse
import json
import os
import time
import hashlib


def compute_sha256_of_string(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def run(suggestion_path, depth_map_cid, ad_anchor_cid, contributors, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    with open(suggestion_path, "r") as f:
        suggestion = json.load(f)

    # enforce required fields
    required = ["card_id", "project", "animator_version", "layers", "timestamp"]
    for r in required:
        if r not in suggestion:
            suggestion[r] = f"_generated_{r}"

    if "sha256" not in suggestion:
        suggestion["sha256"] = compute_sha256_of_string(json.dumps(suggestion, sort_keys=True))

    metadata = {
        "card_id": suggestion["card_id"],
        "project": suggestion["project"],
        "animator_version": suggestion["animator_version"],
        "layers": suggestion["layers"],
        "timestamp": suggestion.get("timestamp", int(time.time())),
        "sha256": suggestion["sha256"],
        "depth_map_cid": depth_map_cid,
        "ad_anchor_cid": ad_anchor_cid,
        "contributors": contributors or [],
    }

    out_path = os.path.join(out_dir, f"{metadata['card_id']}_metadata.json")
    with open(out_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # fake pin: return a pseudo CID
    manifest_cid = "cid_" + metadata["sha256"][:12]
    print(out_path)
    print(manifest_cid)
    return out_path, manifest_cid


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--suggestion", required=True)
    p.add_argument("--depth-map-cid", required=False)
    p.add_argument("--ad-anchor-cid", required=False)
    p.add_argument("--contributors", required=False, nargs="*")
    p.add_argument("--out-dir", default="./data/out")
    args = p.parse_args()
    run(args.suggestion, args.depth_map_cid, args.ad_anchor_cid, args.contributors, args.out_dir)
