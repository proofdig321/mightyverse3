"""Helpers package for agents-stubs (proxy to actual helpers).

This package exposes the `utils` modules located under `agents-stubs/utils/`.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", "agents-stubs"))
UTILS_PATH = os.path.join(ROOT, "utils")

if UTILS_PATH not in sys.path:
    sys.path.insert(0, UTILS_PATH)

__all__ = ["pinning", "hardhat"]
