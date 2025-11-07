"""Proxy module to expose mint_approval from agents-stubs/agents."""
import importlib.util
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agents-stubs"))
SRC = os.path.join(ROOT, "agents", "mint_approval.py")

spec = importlib.util.spec_from_file_location("_agents_mint_approval", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

prepare_mint = getattr(mod, "prepare_mint")

__all__ = ["prepare_mint"]
