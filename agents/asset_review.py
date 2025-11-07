"""Proxy module to expose asset_review from agents-stubs/agents."""
import importlib.util
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agents-stubs"))
SRC = os.path.join(ROOT, "agents", "asset_review.py")

spec = importlib.util.spec_from_file_location("_agents_asset_review", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Re-export functions
run_asset_review = getattr(mod, "run_asset_review")

__all__ = ["run_asset_review"]
