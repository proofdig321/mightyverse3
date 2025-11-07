"""Stub for mint-approval agent."""
from typing import Dict, Any
import json
import os


def prepare_mint(manifest_cid: str, card_id: str, credits_required: int = 0, admin_signature: str = None) -> Dict[str, Any]:
    """Prepare a mint transaction payload (stub).

    This does not talk to chain; it returns a prepared payload and a fake tx id.
    """
    if credits_required > 0 and admin_signature is None:
        # In real flow you'd check credit balance; here we return an error payload
        return {"error": "insufficient_credits_or_missing_signature"}

    tx = {
        "card_id": card_id,
        "manifest_cid": manifest_cid,
        "network": "testnet-stub",
        "tx_id": f"tx_stub_{card_id}",
        "status": "prepared",
    }
    # If requested, run local hardhat deploy and return deployed address in tx
    if os.environ.get("USE_HARDHAT") == "1":
        try:
            from ..utils.hardhat import run_hardhat_deploy

            addr = run_hardhat_deploy()
            tx["network"] = "local-hardhat"
            tx["deployed_address"] = addr
            tx["status"] = "deployed" if addr else "prepared"
        except Exception as e:
            tx["hardhat_error"] = str(e)

    return tx


def main():
    import sys

    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    res = prepare_mint(payload.get("manifest_cid", ""), payload.get("card_id", "card_stub"), payload.get("credits_required", 0), payload.get("admin_signature"))
    print(json.dumps(res))


if __name__ == "__main__":
    main()
import argparse
import json
import os
import time


def run(manifest_cid, card_id, credits_required, admin_signature, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    result = {
        "card_id": card_id,
        "manifest_cid": manifest_cid,
        "status": "prepared",
        "timestamp": int(time.time()),
    }

    if credits_required is None and not admin_signature:
        raise SystemExit("Either credits_required or admin_signature must be provided")

    if credits_required:
        if int(credits_required) <= 0:
            raise SystemExit("credits_required must be > 0")
        result["credits_burned"] = int(credits_required)
        result["mint_method"] = "credit"
    else:
        result["admin_signature"] = admin_signature
        result["mint_method"] = "signature"

    # Simulate creating a tx
    tx = {"to": "0xMightyVerseMock", "data": "0xdeadbeef", "status": "pending"}
    tx_path = os.path.join(out_dir, f"{card_id}_mint_tx.json")
    with open(tx_path, "w") as f:
        json.dump(tx, f, indent=2)

    # Simulate receipt
    receipt = {"txHash": "0x" + str(int(time.time())), "status": "success", "blockNumber": 123456}
    receipt_path = os.path.join(out_dir, f"{card_id}_tx_receipt.json")
    with open(receipt_path, "w") as f:
        json.dump(receipt, f, indent=2)

    print(tx_path)
    print(receipt_path)
    return tx_path, receipt_path


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--manifest-cid", required=True)
    p.add_argument("--card-id", required=True)
    p.add_argument("--credits-required", required=False)
    p.add_argument("--admin-signature", required=False)
    p.add_argument("--out-dir", default="./data/out")
    args = p.parse_args()
    run(args.manifest_cid, args.card_id, args.credits_required, args.admin_signature, args.out_dir)
