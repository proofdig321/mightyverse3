"""Asset review agent (prototype).

This module provides two interfaces:
- run_asset_review(asset_cid, manifest) -> dict  (programmatic)
- CLI: callable via the run(...) function which writes JSON files to disk

The review attempts to call optional model integrations (MiDaS, SAM, CLIP,
Whisper) via the `integrations` module. If those libraries are not
installed, the integrations return safe stubs and the agent continues.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

def _load_integrations():
    """Load the integrations module in a way that works whether this file
    is executed as a package member or loaded directly via a proxy loader.
    """
    try:
        # prefer the proxy-exposed package if available
        import agents.integrations as integrations_module
        return integrations_module
    except Exception:
        pass

    # Fallback: load the integrations.py file next to this source file
    try:
        import importlib.util
        import os

        p = os.path.join(os.path.dirname(__file__), "integrations.py")
        spec = importlib.util.spec_from_file_location("mighty.integrations", p)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    except Exception as e:
        # If even the fallback fails, create a tiny shim with stub functions
        import logging

        logger = logging.getLogger("mighty.integrations.loader")
        logger.debug("Failed to load integrations module: %s", e)

        class _Shim:
            @staticmethod
            def estimate_depth_from_image(*_a, **_k):
                return None

            @staticmethod
            def run_segmentation(*_a, **_k):
                return None

            @staticmethod
            def clip_image_tags(*_a, **_k):
                return [{"tag": "hiphop", "score": 0.9}, {"tag": "animated", "score": 0.85}]

            @staticmethod
            def transcribe_audio(*_a, **_k):
                return {"text": "[stub transcript]", "bpm": None}

        return _Shim()


integrations = _load_integrations()

logger = logging.getLogger("mighty.asset_review")


def _find_local_asset_path(manifest: Optional[Dict[str, Any]]) -> Optional[str]:
    """Try to determine a local file path for the asset from the manifest.

    Convention: manifest may include 'asset_path' or 'local_path'.
    """
    if not manifest:
        return None
    for key in ("asset_path", "local_path", "image_path"):
        p = manifest.get(key)
        if p and os.path.exists(p):
            return p
    return None


def run_asset_review(asset_cid: str, manifest: Dict[str, Any] = None) -> Dict[str, Any]:
    """Run a lightweight asset review and return suggestion + qc report.

    The function is resilient: integrations may be missing and will return
    None or stubbed values.
    """
    ts = int(time.time())
    card_id = (manifest or {}).get("card_id", f"card_{ts}")

    # Attempt to locate a local image/audio path referenced in the manifest
    image_path = _find_local_asset_path(manifest)
    audio_path = (manifest or {}).get("audio_path")

    # Run optional integrations
    depth_map = None
    segmentation = None
    clip_tags: List[Dict[str, Any]] = []
    transcription: Dict[str, Any] = {}

    # We'll store both local paths and CIDs when available, grouped into objects
    depth_map_path = None
    depth_map_cid = None
    segmentation_path = None
    segmentation_cid = None

    if image_path:
        try:
            depth_map = integrations.estimate_depth_from_image(image_path)
            # integration returns either a local path or a CID string
            if isinstance(depth_map, str):
                if os.path.exists(depth_map):
                    depth_map_path = depth_map
                else:
                    depth_map_cid = depth_map
        except Exception as e:
            logger.debug("Depth estimation failed: %s", e)

        try:
            segmentation = integrations.run_segmentation(image_path)
            if isinstance(segmentation, str):
                if os.path.exists(segmentation):
                    segmentation_path = segmentation
                else:
                    segmentation_cid = segmentation
        except Exception as e:
            logger.debug("Segmentation failed: %s", e)

        try:
            clip_tags = integrations.clip_image_tags(image_path)
        except Exception as e:
            logger.debug("CLIP tagging failed: %s", e)

    if audio_path and os.path.exists(audio_path):
        try:
            transcription = integrations.transcribe_audio(audio_path)
        except Exception as e:
            logger.debug("Audio transcription failed: %s", e)

    # Build metadata suggestion
    metadata = {
        "card_id": card_id,
        "asset_cid": asset_cid,
        "project": (manifest or {}).get("project", "UnknownProject"),
        "animator_version": (manifest or {}).get("animator_version", "stub-v1"),
        "tags": [t.get("tag") for t in clip_tags] if clip_tags else (manifest or {}).get("tags", ["hiphop", "animated"]),
        "depth_map": {"path": depth_map_path, "cid": depth_map_cid},
        "segmentation": {"path": segmentation_path, "cid": segmentation_cid},
        "transcription": transcription,
        "confidence": 0.9 if clip_tags else 0.75,
    }

    # Basic QC rules
    qc_issues: List[str] = []
    confidence_score = metadata["confidence"]
    if confidence_score < 0.8:
        qc_issues.append("low_confidence")
    if not image_path:
        qc_issues.append("no_local_image")

    qc = {
        "card_id": card_id,
        "confidence_score": confidence_score,
        "issues": qc_issues,
    }

    # Suggested anchors: if segmentation available, propose anchors from masks
    anchors: List[Dict[str, Any]] = []
    if segmentation_path or segmentation_cid:
        anchors.append({
            "anchor_id": "seg_1",
            "x": 0.5,
            "y": 0.5,
            "z": 0.0,
            "start_frame": 0,
            "end_frame": (manifest or {}).get("duration_frames", 150),
            "confidence": 0.85,
            "source": "segmentation",
            "segmentation": {"path": segmentation_path, "cid": segmentation_cid},
        })
    else:
        anchors.append({
            "anchor_id": "a1",
            "x": 0.2,
            "y": 0.3,
            "z": 0.1,
            "start_frame": 10,
            "end_frame": 120,
            "confidence": 0.6,
            "source": "heuristic",
        })

    return {"metadata_suggestion": metadata, "qc_report": qc, "suggested_ad_anchors": anchors}


def run(asset_cid: str, manifest_path: Optional[str], out_dir: str) -> None:
    """CLI-friendly runner that writes JSON files to out_dir.

    manifest_path: optional path to a manifest JSON file to influence suggestions.
    """
    os.makedirs(out_dir, exist_ok=True)
    manifest = None
    if manifest_path and os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
        except Exception:
            manifest = None

    res = run_asset_review(asset_cid, manifest)

    sug_path = os.path.join(out_dir, "metadata_suggestion.json")
    qc_path = os.path.join(out_dir, "qc_report.json")
    anchors_path = os.path.join(out_dir, "suggested_ad_anchors.json")

    with open(sug_path, "w") as f:
        json.dump(res["metadata_suggestion"], f, indent=2)
    with open(qc_path, "w") as f:
        json.dump(res["qc_report"], f, indent=2)
    with open(anchors_path, "w") as f:
        json.dump(res["suggested_ad_anchors"], f, indent=2)

    print(sug_path)
    print(qc_path)
    print(anchors_path)


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--asset-cid", required=True)
    p.add_argument("--manifest-path", required=False)
    p.add_argument("--out-dir", default="./data/out")
    args = p.parse_args()
    run(args.asset_cid, args.manifest_path, args.out_dir)
