#!/usr/bin/env bash
# Minimal MCP CID header / range / CORS check
# Usage: ./scripts/mcp_cid_check.sh <cid> [gateway]

set -euo pipefail

CID=${1:-}
GATEWAY=${2:-https://gateway.pinata.cloud/ipfs}

if [ -z "$CID" ]; then
  echo "Usage: $0 <cid> [gateway]"
  exit 2
fi

URL="$GATEWAY/$CID"

echo "Checking: $URL"

echo "\n-- HEAD --"
curl -sI -L "$URL" || { echo "HEAD failed"; exit 3; }

echo "\n-- RANGE probe (0-1) --"
curl -sI -L -H "Range: bytes=0-1" "$URL" || { echo "Range probe failed"; exit 4; }

echo "\n-- Quick validation checks --"
HEADOUT=$(curl -sI -L "$URL")
CT=$(echo "$HEADOUT" | grep -i "Content-Type:" || true)
AR=$(echo "$HEADOUT" | grep -i "Accept-Ranges:" || true)
AC=$(echo "$HEADOUT" | grep -i "Access-Control-Allow-Origin:" || true)

echo "Content-Type: ${CT:-(missing)}"
echo "Accept-Ranges: ${AR:-(missing)}"
echo "Access-Control-Allow-Origin: ${AC:-(missing)}"

if [[ -z "$CT" ]]; then
  echo "ERROR: Content-Type missing"
  exit 5
fi

echo "Done."
