#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-.env.production}"
[[ -f "$ENV_FILE" ]] || { echo "[FAIL] Environment file ontbreekt: $ENV_FILE" >&2; exit 2; }

required=(
  NODE_ENV DATABASE_URL POSTGRES_PASSWORD SESSION_SECRET APP_ENCRYPTION_KEY APP_URL
  ADMIN_PATH ADMIN_EMAIL ADMIN_PASSWORD PRIVACY_HASH_SALT POSTMARK_INBOUND_SECRET
)

get_value() {
  local key="$1"
  sed -n -E "s/^${key}=(.*)$/\1/p" "$ENV_FILE" | tail -n 1 | sed -E 's/^"(.*)"$/\1/'
}

fail=0

# Secrets must be supplied at runtime and meet the minimum entropy/length contract.
# The validator checks length only; it never prints secret values.
for key in SESSION_SECRET APP_ENCRYPTION_KEY PRIVACY_HASH_SALT POSTMARK_INBOUND_SECRET POSTGRES_PASSWORD ADMIN_PASSWORD; do
  value="$(get_value "$key")"
  min_length=32
  [[ "$key" == "ADMIN_PASSWORD" ]] && min_length=16
  if [[ "${#value}" -lt "$min_length" ]]; then
    echo "[FAIL] $key is shorter than the required minimum length of $min_length characters"
    fail=1
  fi
done
for key in "${required[@]}"; do
  value="$(get_value "$key")"
  if [[ -z "$value" ]]; then
    echo "[FAIL] $key is leeg of ontbreekt"
    fail=1
  fi
done

for placeholder in \
  'CHANGE-ME' 'GENERATE-A-LONG-RANDOM' 'USE-A-LONG-UNIQUE-PASSWORD' \
  'change-this-to-a-long-random-secret' 'jouwdomein.nl' 'admin@example.nl'; do
  if grep -Fq "$placeholder" "$ENV_FILE"; then
    echo "[FAIL] Placeholder gevonden: $placeholder"
    fail=1
  fi
done

app_url="$(get_value APP_URL)"
demo_mode="$(get_value DEMO_MODE)"
case "$app_url" in
  https://*) ;;
  http://*)
    if [[ "$demo_mode" != "true" ]]; then
      echo "[FAIL] APP_URL moet HTTPS gebruiken buiten DEMO_MODE"
      fail=1
    else
      echo "[WARN] HTTP toegestaan omdat DEMO_MODE=true (alleen voor lokale/demo-VM's)"
    fi
    ;;
  *)
    echo "[FAIL] APP_URL moet beginnen met http:// of https://"
    fail=1
    ;;
esac

node_env="$(get_value NODE_ENV)"
[[ "$node_env" == "production" ]] || { echo "[FAIL] NODE_ENV moet production zijn"; fail=1; }

if [[ "$fail" -ne 0 ]]; then
  echo "Production environment validation FAILED."
  exit 1
fi

echo "Production environment validation passed: $ENV_FILE"
