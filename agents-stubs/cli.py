"""Simple CLI entrypoint for stubs.

Usage examples (pipe JSON into the CLI):

cat payload.json | python -m agents_stubs.cli asset-review
cat payload.json | python -m agents_stubs.cli metadata-gen
cat payload.json | python -m agents_stubs.cli mint-approval

"""
import sys
import json
import importlib.util
import os

# Helper to load a module by file path inside the agents-stubs/agents folder.
ROOT = os.path.abspath(os.path.dirname(__file__))
AGENTS_DIR = os.path.join(ROOT, "agents")


def _load_agent_module(name: str):
    path = os.path.join(AGENTS_DIR, f"{name}.py")
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load agent module: {name}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    import argparse

    parser = argparse.ArgumentParser(prog="agents.cli")
    sub = parser.add_subparsers(dest="agent")

    p_ar = sub.add_parser("asset-review")
    p_ar.add_argument("--asset-cid", required=False)
    p_ar.add_argument("--out-dir", required=True)

    p_md = sub.add_parser("metadata-gen")
    p_md.add_argument("--suggestion", required=True)
    p_md.add_argument("--out-dir", required=True)

    p_mint = sub.add_parser("mint-approval")
    p_mint.add_argument("--manifest-cid", required=True)
    p_mint.add_argument("--card-id", required=True)
    p_mint.add_argument("--credits-required", type=int, default=0)
    p_mint.add_argument("--out-dir", required=True)

    args = parser.parse_args(sys.argv[1:])

    if args.agent == "asset-review":
        mod = _load_agent_module("asset_review")
        res = mod.run_asset_review(getattr(args, "asset_cid", None))
        out_dir = args.out_dir
        os.makedirs(out_dir, exist_ok=True)
        paths = []
        # write files
        mpath = os.path.join(out_dir, "metadata_suggestion.json")
        with open(mpath, "w") as f:
            json.dump(res["metadata_suggestion"], f)
        paths.append(mpath)
        qpath = os.path.join(out_dir, "qc_report.json")
        with open(qpath, "w") as f:
            json.dump(res["qc_report"], f)
        paths.append(qpath)
        apath = os.path.join(out_dir, "suggested_ad_anchors.json")
        with open(apath, "w") as f:
            json.dump(res["suggested_ad_anchors"], f)
        paths.append(apath)
        print("\n".join(paths))

    elif args.agent == "metadata-gen":
        sug_path = args.suggestion
        with open(sug_path) as f:
            suggestion = json.load(f)
        mod = _load_agent_module("metadata_gen")
        manifest = mod.build_metadata(suggestion)
        out_dir = args.out_dir
        os.makedirs(out_dir, exist_ok=True)
        mpath = os.path.join(out_dir, "metadata.json")
        with open(mpath, "w") as f:
            json.dump(manifest, f)
        print(mpath)

    elif args.agent == "mint-approval":
        manifest_cid = args.manifest_cid
        card_id = args.card_id
        credits = args.credits_required
        mod = _load_agent_module("mint_approval")
        tx = mod.prepare_mint(manifest_cid, card_id, credits_required=credits)
        out_dir = args.out_dir
        os.makedirs(out_dir, exist_ok=True)
        txpath = os.path.join(out_dir, "mint_tx.json")
        with open(txpath, "w") as f:
            json.dump(tx, f)
        # fake receipt
        receipt = {"tx_id": tx.get("tx_id"), "status": "submitted"}
        rpath = os.path.join(out_dir, "tx_receipt.json")
        with open(rpath, "w") as f:
            json.dump(receipt, f)
        print("\n".join([txpath, rpath]))

    else:
        print({"error": "unknown agent"})


if __name__ == "__main__":
    main()
