#!/usr/bin/env bash
set -euo pipefail

# Simple helper to create a venv and install optional ML extras.
# Usage: ./agents-stubs/scripts/setup-ml.sh [--cpu]

VENV_DIR=".venv-ml"
PYTHON="python3"
EXTRAS="-r ../agents-stubs/requirements-ml.txt"

if [ "${1-}" = "--cpu" ]; then
  echo "Installing CPU-only variants (where applicable)..."
  # Users may need to customize this for their platform/torch build
fi

echo "Creating venv in ${VENV_DIR}"
${PYTHON} -m venv ${VENV_DIR}
source ${VENV_DIR}/bin/activate
pip install --upgrade pip
pip install ${EXTRAS}

echo "Done. Activate with: source ${VENV_DIR}/bin/activate"
