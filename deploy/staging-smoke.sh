#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-${STAGING_URL:-}}"
EXPECTED_VERSION="${EXPECTED_RELEASE_VERSION:-}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"

[[ -n "$BASE_URL" ]] || { echo "Usage: $0 https://staging.example.nl" >&2; exit 2; }
BASE_URL="${BASE_URL%/}"
case "$BASE_URL" in https://*) ;; *) echo "Staging smoke test requires HTTPS." >&2; exit 2 ;; esac

get() { curl --fail --silent --show-error --location --max-time "$TIMEOUT" "$1"; }

health="$(get "$BASE_URL/api/health")"
ready="$(get "$BASE_URL/api/ready")"
release="$(get "$BASE_URL/api/release")"
printf '%s\n' "$health" | grep -q '"status":"ok"' || { echo "[FAIL] health: $health"; exit 1; }
printf '%s\n' "$ready" | grep -q '"ready":true' || { echo "[FAIL] ready: $ready"; exit 1; }
printf '%s\n' "$release" | grep -q '"service":"alimenta-pro"' || { echo "[FAIL] release: $release"; exit 1; }

if [[ -n "$EXPECTED_VERSION" ]]; then
  printf '%s\n' "$release" | grep -Fq "\"version\":\"$EXPECTED_VERSION\"" || {
    echo "[FAIL] expected release version $EXPECTED_VERSION, got: $release"; exit 1;
  }
fi

headers="$(curl --fail --silent --show-error --location --max-time "$TIMEOUT" -D - -o /dev/null "$BASE_URL/api/health")"
lower="$(printf '%s\n' "$headers" | tr '[:upper:]' '[:lower:]')"
for header in \
  'strict-transport-security:' \
  'x-content-type-options: nosniff' \
  'x-frame-options: deny' \
  'referrer-policy: strict-origin-when-cross-origin'; do
  printf '%s\n' "$lower" | grep -Fq "$header" || { echo "[FAIL] missing header: $header"; exit 1; }
done

printf '%s\n' '[OK] HTTPS' '[OK] health' '[OK] readiness' '[OK] release' '[OK] security headers'
echo "STAGING GO: $BASE_URL"
printf '%s\n' "$release"
