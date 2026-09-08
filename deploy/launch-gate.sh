#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${APP_URL:-}}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 https://alimenta.example.nl"
  exit 2
fi

BASE_URL="${BASE_URL%/}"
case "$BASE_URL" in
  https://*) ;;
  *) echo "Launch gate requires an HTTPS URL."; exit 2 ;;
esac

curl_json() {
  curl --fail --silent --show-error --location --max-time 15 "$1"
}

health="$(curl_json "$BASE_URL/api/health")"
ready="$(curl_json "$BASE_URL/api/ready")"
release="$(curl_json "$BASE_URL/api/release")"

printf '%s\n' "$health" | grep -q '"status":"ok"' || { echo "Health check failed: $health"; exit 1; }
printf '%s\n' "$ready" | grep -q '"ready":true' || { echo "Readiness check failed: $ready"; exit 1; }
printf '%s\n' "$release" | grep -q '"service":"alimenta-pro"' || { echo "Release endpoint invalid: $release"; exit 1; }

headers="$(curl --fail --silent --show-error --location --max-time 15 -D - -o /dev/null "$BASE_URL/api/health")"
for header in 'x-content-type-options: nosniff' 'x-frame-options: DENY' 'referrer-policy: strict-origin-when-cross-origin'; do
  printf '%s\n' "$headers" | tr '[:upper:]' '[:lower:]' | grep -Fq "$header" || { echo "Missing security header: $header"; exit 1; }
done

printf '%s\n' "Launch gate passed: $BASE_URL"
printf '%s\n' "health=$health" "ready=$ready" "release=$release"
