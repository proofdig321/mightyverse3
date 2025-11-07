"""Small developer 'vibe' runner: runs asset-review -> metadata-gen and prints results.

Use this in Codespaces to exercise the pipeline with minimal setup.
"""
import json
import os
from agents import asset_review as ar
from agents import metadata_gen as mg


def run_sample(image_path: str = None):
    # allow running without real image by using the sample manifest
    sample_manifest = {
        "card_id": "demo-card-001",
        "name": "Demo Asset",
        "description": "A demo asset for local vibe runs",
        "files": [
            {"name": "image.jpg", "path": image_path or "./sample-data/sample.jpg"}
        ]
    }

    print("Running asset review (stubbed integrations may return placeholders)...")
    review = ar.run_asset_review(asset_cid="", manifest=sample_manifest)
    print("Asset review result:")
    print(json.dumps(review, indent=2))

    print("Building metadata suggestion from review...")
    suggestion = review.get("metadata_suggestion") or {}
    manifest = mg.build_metadata(suggestion, depth_map_cid=None, ad_anchor_cid=None)
    print("Generated metadata manifest:")
    print(json.dumps(manifest, indent=2))

    return review, manifest


if __name__ == "__main__":
    img = os.environ.get("MIGHTY_SAMPLE_IMAGE")
    run_sample(img)
