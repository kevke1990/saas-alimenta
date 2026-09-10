#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "UPDATE MISLUKT op regel $LINENO" >&2' ERR
APP_DIR="${APP_DIR:-/opt/saas-alimenta}"
cd "$APP_DIR"
# Invoke repository scripts through bash so execution does not depend on the
# executable bit preserved by the deployment method/filesystem.
bash ./deploy/backup.sh
CURRENT_TAG="$(grep -E '^ALIMENTA_IMAGE_TAG=' .env | cut -d= -f2- | tr -d '"' || true)"
CURRENT_TAG="${CURRENT_TAG:-1.3.1-rc1}"
RELEASE_TAG="${ALIMENTA_IMAGE_TAG:-$CURRENT_TAG}"
PREVIOUS_TAG="previous-$(date -u +%Y%m%d%H%M%S)"
if docker image inspect "alimenta-pro:$CURRENT_TAG" >/dev/null 2>&1; then docker tag "alimenta-pro:$CURRENT_TAG" "alimenta-pro:$PREVIOUS_TAG"; fi
export ALIMENTA_IMAGE_TAG="$RELEASE_TAG"
docker compose -f docker-compose.prod.yml config >/dev/null
docker compose -f docker-compose.prod.yml build --pull app
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d --force-recreate app
for i in $(seq 1 45); do
  if curl -fsS http://127.0.0.1:3000/api/health | grep -q '"ok":true'; then
    echo "Update geslaagd ($RELEASE_TAG)."; docker image prune -f; exit 0
  fi
  sleep 2
done
echo "Healthcheck faalt; rollback naar $PREVIOUS_TAG." >&2
if docker image inspect "alimenta-pro:$PREVIOUS_TAG" >/dev/null 2>&1; then
  docker tag "alimenta-pro:$PREVIOUS_TAG" "alimenta-pro:$CURRENT_TAG"
  export ALIMENTA_IMAGE_TAG="$CURRENT_TAG"
  docker compose -f docker-compose.prod.yml up -d --force-recreate app
fi
exit 1
