"""Proxy module to expose the hardhat helper located in the dashed folder.

This loads the implementation from `agents-stubs/utils/hardhat.py` and exposes
`run_hardhat_deploy` for tests and runtime.
"""
import importlib.util
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "agents-stubs"))
SRC = os.path.join(ROOT, "utils", "hardhat.py")

spec = importlib.util.spec_from_file_location("agents_stubs.utils.hardhat", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

run_hardhat_deploy = getattr(mod, "run_hardhat_deploy")
# expose subprocess from the underlying module so tests can patch it
subprocess = getattr(mod, "subprocess", None)

__all__ = ["run_hardhat_deploy"]
