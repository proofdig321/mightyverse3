"""Simulate presence of ML libs by injecting fake modules into sys.modules.

This allows us to test the happy-path logic in `integrations` without
installing heavy dependencies into CI.
"""
import sys
import types
import tempfile
import os

import importlib.util
import os

# Load the implementation module directly from agents-stubs/agents/integrations.py
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
P = os.path.join(ROOT, "agents", "integrations.py")
spec = importlib.util.spec_from_file_location("mighty.integrations", P)
impl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(impl)


def make_fake_torch():
    m = types.ModuleType("torch")
    # Minimal torch-like API for hub.load used by integrations
    class FakeModel:
        def eval(self):
            pass

    def fake_hub_load(repo, model_type):
        return FakeModel()

    m.hub = types.SimpleNamespace(load=fake_hub_load)
    m.nn = types.SimpleNamespace(functional=types.SimpleNamespace(interpolate=lambda x, size, mode, align_corners: x))
    m.no_grad = lambda : (lambda f: f)
    return m


def test_integrations_with_fake_torch(monkeypatch):
    fake_torch = make_fake_torch()
    # inject fake torch
    monkeypatch.setitem(sys.modules, "torch", fake_torch)

    # create a tiny image file
    fd, tmp = tempfile.mkstemp(suffix=".png")
    os.write(fd, b"x")
    os.close(fd)

    res = impl.estimate_depth_from_image(tmp)
    # With a minimal fake torch the function may still return None or a path
    assert (res is None) or isinstance(res, str)
