"""Top-level agents package to proxy to agents-stubs during local testing.

This package exists so tests that run `python -m agents.cli` can find a module named
`agents.cli`. It forwards execution to `agents-stubs/cli.py`.
"""

__all__ = ["cli"]
