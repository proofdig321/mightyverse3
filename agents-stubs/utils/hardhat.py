"""Helper to call local Hardhat scripts from Python (dev/test only).

This module runs `npx hardhat run` and parses stdout for the deployed address.
In CI or production, prefer using JS/TS tools directly.
"""
import subprocess
from typing import Optional


def run_hardhat_deploy(script: str = "scripts/deploy.js", network: str = "localhost") -> Optional[str]:
    """Run the deploy script and return deployed contract address if found.

    Returns address string on success, None otherwise.
    """
    cmd = ["npx", "hardhat", "run", script, "--network", network]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Hardhat deploy failed: {proc.stderr}")
    out = proc.stdout + proc.stderr
    # look for a hex address in output
    import re

    m = re.search(r"0x[a-fA-F0-9]{40}", out)
    if m:
        return m.group(0)
    return None
