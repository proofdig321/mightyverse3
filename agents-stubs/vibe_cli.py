#!/usr/bin/env python3
"""Interactive CLI for 'vibe' runs.

Usage:
  python agents-stubs/vibe_cli.py --image path/to.jpg [--pin] [--out out.json]
"""
import argparse
import json
import os
from agents_stubs.vibe import run_sample
from agents_stubs.utils import pinning


def main():
    p = argparse.ArgumentParser(description="Vibe CLI: run asset-review -> metadata-gen")
    p.add_argument("--image", help="Path to an image to include in the manifest", default=None)
    p.add_argument("--pin", action="store_true", help="Attempt to pin generated metadata to nft.storage if NFT_STORAGE_KEY set")
    p.add_argument("--out", default=None, help="Write the generated metadata to this file")
    args = p.parse_args()

    review, manifest = run_sample(args.image)

    out_path = args.out
    if out_path:
        with open(out_path, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"Wrote metadata to {out_path}")

    if args.pin:
        key = os.environ.get("NFT_STORAGE_KEY")
        if not key:
            print("NFT_STORAGE_KEY not set; skipping pin")
        else:
            print("Attempting to pin metadata JSON to nft.storage...")
            cid = pinning.pin_json_with_retries(manifest, api_key=key)
            print("Pin result cid:", cid)


if __name__ == "__main__":
    main()
