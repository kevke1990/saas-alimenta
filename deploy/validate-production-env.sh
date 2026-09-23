#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-.env.production}"
[[ -f "$ENV_FILE" ]] || { echo "[FAIL] Environment file ontbreekt: $ENV_FILE" >&2; exit 2; }

required=(
  NODE_ENV DATABASE_URL POSTGRES_PASSWORD SESSION_SECRET APP_ENCRYPTION_KEY APP_URL WEBHOOK_WORKER_SECRET
  ADMIN_PATH ADMIN_EMAIL ADMIN_PASSWORD PRIVACY_HASH_SALT POSTMARK_INBOUND_SECRET
)

get_value() {
  local key="$1"
  sed -n -E "s/^${key}=(.*)$/\\1/p" "$ENV_FILE" | tail -n 1 | sed -E 's/^"(.*)"$/\\1/'
}

fail=0

for key in SESSION_SECRET APP_ENCRYPTION_KEY; do
  value="$(get_value "$key")"
  if [[ "${#value}" -lt 32 ]]; then
    echo "[FAIL] $key is shorter than the required minimum length of 32 characters"
    fail=1
  fi
done
admin_password="$(get_value ADMIN_PASSWORD)"
if [[ "${#admin_password}" -lt 16 ]]; then
  echo "[FAIL] ADMIN_PASSWORD is shorter than the required minimum length of 16 characters"
  fail=1
fi
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
case "$app_url" in
  https://*) ;;
  *)
    echo "[FAIL] APP_URL moet in productie HTTPS gebruiken"
    fail=1
    ;;
esac

node_env="$(get_value NODE_ENV)"
[[ "$node_env" == "production" ]] || { echo "[FAIL] NODE_ENV moet production zijn"; fail=1; }

demo_mode="$(get_value DEMO_MODE)"
if [[ -n "$demo_mode" && "$demo_mode" != "false" ]]; then
  echo "[FAIL] DEMO_MODE moet in productie false zijn"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Production environment validation FAILED."
  exit 1
fi

echo "Production environment validation passed: $ENV_FILE"
