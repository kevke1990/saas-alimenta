#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-${STAGING_URL:-}}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"
[[ -n "$BASE_URL" ]] || { echo "Usage: $0 https://staging.example.nl" >&2; exit 2; }
BASE_URL="${BASE_URL%/}"
case "$BASE_URL" in https://*) ;; *) echo "Staging acceptance requires HTTPS." >&2; exit 2 ;; esac

curl_get() { curl --fail --silent --show-error --location --max-time "$TIMEOUT" "$1"; }

curl_get "$BASE_URL/login" >/dev/null
echo '[OK] login page'
curl_get "$BASE_URL/pricing" >/dev/null
echo '[OK] pricing page'

if [[ -z "${STAGING_TEST_EMAIL:-}" || -z "${STAGING_TEST_PASSWORD:-}" ]]; then
  echo '[INFO] Authenticated checks skipped: set STAGING_TEST_EMAIL and STAGING_TEST_PASSWORD for the staging smoke account.'
  echo 'STAGING ACCEPTANCE PARTIAL'
  exit 0
fi

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT
LOGIN_BODY=$(printf '{"email":"%s","password":"%s"}' "$STAGING_TEST_EMAIL" "$STAGING_TEST_PASSWORD")
login_status=$(curl --silent --show-error --location --max-time "$TIMEOUT" -o /tmp/alimenta-login-response -w '%{http_code}' -c "$COOKIE_JAR" -H 'content-type: application/json' -d "$LOGIN_BODY" "$BASE_URL/api/auth/login")
[[ "$login_status" == '200' ]] || { echo "[FAIL] login HTTP $login_status"; cat /tmp/alimenta-login-response; exit 1; }
echo '[OK] authenticated login'

curl --fail --silent --show-error --location --max-time "$TIMEOUT" -b "$COOKIE_JAR" "$BASE_URL/api/cases" >/dev/null
echo '[OK] authenticated case API'
curl --fail --silent --show-error --location --max-time "$TIMEOUT" -b "$COOKIE_JAR" "$BASE_URL/billing" >/dev/null
echo '[OK] authenticated billing page'
curl --fail --silent --show-error --location --max-time "$TIMEOUT" -b "$COOKIE_JAR" "$BASE_URL/dashboard" >/dev/null
echo '[OK] authenticated dashboard'

echo 'STAGING ACCEPTANCE GO'
