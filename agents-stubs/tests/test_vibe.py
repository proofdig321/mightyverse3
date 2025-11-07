import os
from agents_stubs.vibe import run_sample


def test_run_sample_smoke():
    # Smoke test: should run without raising and return a pair
    review, manifest = run_sample()
    assert isinstance(review, dict)
    assert isinstance(manifest, dict)
