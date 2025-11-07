"""Tests that simulate the presence of model integrations by injecting a fake
integrations implementation into `agents.asset_review`.
"""
import types

import agents.asset_review as ar_mod

run_asset_review = ar_mod.run_asset_review


def test_run_asset_review_with_fake_integrations(monkeypatch):
    fake = types.SimpleNamespace()

    def fake_depth(p):
        return "bafyfake_depth_cid"

    def fake_seg(p):
        return "bafyfake_seg_cid"

    def fake_clip(p):
        return [{"tag": "happy", "score": 0.99}]

    def fake_trans(p):
        return {"text": "hello world", "bpm": 120}

    fake.estimate_depth_from_image = fake_depth
    fake.run_segmentation = fake_seg
    fake.clip_image_tags = fake_clip
    fake.transcribe_audio = fake_trans

    # patch the underlying implementation module loaded by the proxy
    # ensure the run_asset_review function uses our fake integrations by
    # replacing the name in its globals
    monkeypatch.setitem(run_asset_review.__globals__, "integrations", fake)

    # create a small temp file so _find_local_asset_path returns a path
    import tempfile, os
    fd, tmp = tempfile.mkstemp(suffix=".png")
    os.write(fd, b"x")
    os.close(fd)

    # also create a tiny audio file so transcription path is exercised
    fd2, tmp_audio = tempfile.mkstemp(suffix=".mp3")
    os.write(fd2, b"x")
    os.close(fd2)

    res = ar_mod.run_asset_review("bafyasset", {"card_id": "c1", "project": "p", "image_path": tmp, "audio_path": tmp_audio})
    meta = res["metadata_suggestion"]
    assert meta.get("depth_map", {}).get("cid") == "bafyfake_depth_cid"
    assert meta.get("segmentation", {}).get("cid") == "bafyfake_seg_cid"
    assert meta.get("transcription", {}).get("text") == "hello world"
