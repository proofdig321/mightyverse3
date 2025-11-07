"""Unit tests for the optional integrations wrappers.

These tests exercise the fallback/stub behavior when heavy ML libs are
not installed in the environment. They should pass in lightweight CI.
"""
import os

from agents.asset_review import run_asset_review


def test_run_asset_review_uses_stubs_when_no_models(tmp_path):
    # No models installed in CI: run_asset_review should return a dict with
    # depth_map_path/segmentation possibly None and transcription as a dict.
    manifest = {"card_id": "c-test", "project": "p"}
    res = run_asset_review("bafy...", manifest)
    assert "metadata_suggestion" in res
    meta = res["metadata_suggestion"]
    # depth/segmentation are optional; ensure nested keys exist
    assert "depth_map" in meta and isinstance(meta["depth_map"], dict)
    assert "segmentation" in meta and isinstance(meta["segmentation"], dict)
    assert "transcription" in meta
    assert isinstance(meta["transcription"], dict)
    # anchors and qc should be present
    assert "qc_report" in res
    assert "suggested_ad_anchors" in res
