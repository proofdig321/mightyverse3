"""Proxy module to expose metadata_gen from agents-stubs/agents."""
import importlib.util
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agents-stubs"))
SRC = os.path.join(ROOT, "agents", "metadata_gen.py")

spec = importlib.util.spec_from_file_location("_agents_metadata_gen", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

build_metadata = getattr(mod, "build_metadata")
pin_json_to_nft_storage = getattr(mod, "pin_json_to_nft_storage", None)
requests = getattr(mod, "requests", None)

__all__ = ["build_metadata", "pin_json_to_nft_storage"]
