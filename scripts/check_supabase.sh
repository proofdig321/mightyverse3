#!/usr/bin/env bash
set -euo pipefail

# Quick Supabase connectivity check using the service_role key.
# Exits 0 on success, non-zero on failure.

SUPABASE_URL="${SUPABASE_URL:-}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
TABLE="${TABLE:-assets}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment"
  exit 2
fi

URL="${SUPABASE_URL%/}/rest/v1/${TABLE}?select=*&limit=1"

echo "Checking Supabase connectivity to ${URL} (table=${TABLE})"

TMP_FILE=$(mktemp)
HTTP=$(curl -s -w "%{http_code}" -o "$TMP_FILE" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/json" \
  "$URL")

if [ "$HTTP" -ge 200 ] && [ "$HTTP" -lt 300 ]; then
  echo "Supabase connectivity OK (HTTP $HTTP)"
  rm -f "$TMP_FILE"
  exit 0
else
  echo "Supabase connectivity FAILED (HTTP $HTTP)"
  echo "Response:" >&2
  cat "$TMP_FILE" >&2
  rm -f "$TMP_FILE"
  exit 3
fi
