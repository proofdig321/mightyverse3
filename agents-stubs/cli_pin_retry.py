"""Small admin helper to retry pending pins recorded under /tmp/mighty_pending_pins.

This is intentionally a simple script for local/admin use. It will attempt to
read pending files and re-run `pin_file_with_retries` using `NFT_STORAGE_KEY`.
"""
import os
import json
import argparse
from agents_stubs.utils.pinning import pin_file_with_retries


PENDING_DIR = "/tmp/mighty_pending_pins"


def list_pending():
    if not os.path.exists(PENDING_DIR):
        print("No pending pins found")
        return
    for fn in os.listdir(PENDING_DIR):
        if not fn.endswith(".pending.json"):
            continue
        path = os.path.join(PENDING_DIR, fn)
        with open(path, "r") as f:
            data = json.load(f)
        print(path, json.dumps(data))


def retry_file(fname: str):
    api_key = os.environ.get("NFT_STORAGE_KEY")
    if not api_key:
        print("NFT_STORAGE_KEY not set; cannot retry pins")
        return
    path = os.path.join(PENDING_DIR, fname)
    if not os.path.exists(path):
        print("Pending entry not found:", path)
        return
    with open(path, "r") as f:
        data = json.load(f)
    file_to_pin = data.get("file")
    try:
        cid = pin_file_with_retries(file_to_pin, api_key)
        print("Pinned", file_to_pin, "->", cid)
        os.remove(path)
    except Exception as e:
        print("Retry failed for", path, e)


def retry_all():
    api_key = os.environ.get("NFT_STORAGE_KEY")
    if not api_key:
        print("NFT_STORAGE_KEY not set; cannot retry pins")
        return
    if not os.path.exists(PENDING_DIR):
        print("No pending pins found")
        return
    for fn in os.listdir(PENDING_DIR):
        if not fn.endswith(".pending.json"):
            continue
        retry_file(fn)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--list", action="store_true", help="List pending pin entries")
    p.add_argument("--retry", metavar="FNAME", help="Retry a specific pending filename (basename)")
    p.add_argument("--all", action="store_true", help="Retry all pending entries")
    args = p.parse_args()
    if args.list:
        list_pending()
    elif args.retry:
        retry_file(args.retry)
    elif args.all:
        retry_all()
    else:
        p.print_help()


if __name__ == "__main__":
    main()
