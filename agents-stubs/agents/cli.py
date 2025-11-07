import argparse
import sys
from .asset_review import run as run_asset
from .metadata_gen import run as run_meta
from .mint_approval import run as run_mint


def main():
    p = argparse.ArgumentParser(prog="agents")
    sub = p.add_subparsers(dest="cmd")

    p_ar = sub.add_parser("asset-review")
    p_ar.add_argument("--asset-cid", required=True)
    p_ar.add_argument("--manifest-path", required=False)
    p_ar.add_argument("--out-dir", default="./data/out")

    p_mg = sub.add_parser("metadata-gen")
    p_mg.add_argument("--suggestion", required=True)
    p_mg.add_argument("--depth-map-cid", required=False)
    p_mg.add_argument("--ad-anchor-cid", required=False)
    p_mg.add_argument("--contributors", required=False, nargs="*")
    p_mg.add_argument("--out-dir", default="./data/out")

    p_ma = sub.add_parser("mint-approval")
    p_ma.add_argument("--manifest-cid", required=True)
    p_ma.add_argument("--card-id", required=True)
    p_ma.add_argument("--credits-required", required=False)
    p_ma.add_argument("--admin-signature", required=False)
    p_ma.add_argument("--out-dir", default="./data/out")

    args = p.parse_args()
    if args.cmd == "asset-review":
        run_asset(args.asset_cid, args.manifest_path, args.out_dir)
    elif args.cmd == "metadata-gen":
        run_meta(args.suggestion, args.depth_map_cid, args.ad_anchor_cid, args.contributors, args.out_dir)
    elif args.cmd == "mint-approval":
        run_mint(args.manifest_cid, args.card_id, args.credits_required, args.admin_signature, args.out_dir)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
