#!/usr/bin/env bash
# Deploys one app image on the server:
#   image → database → migrations (one-off container) → new app → health.
# Migrations fail → the new app is not started, the old one keeps running.
# No automatic rollback: to go back, run rollback.sh by hand.
#
# Usage: deploy.sh <image> [<registry-user>]
# The registry token, if needed, comes on stdin (see remote.sh).
set -euo pipefail

image=${1:?usage: deploy.sh <image> [<registry-user>]}
registry_user=${2:-deploy}
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '!! %s\n' "$*" >&2; exit 1; }
compose() { docker compose -p prod --project-directory "$root" -f deploy/compose.yaml "$@"; }

[ -f .env ] || fail "$root/.env is missing, see deploy/.env.example"
[ "$(stat -c %a .env)" = 600 ] || fail "$root/.env must have mode 600"
export APP_IMAGE=$image

step "Image $image"
if docker image inspect "$image" >/dev/null 2>&1; then
  echo "Already on the server"
else
  token=""
  [ -t 0 ] || token=$(cat)
  if [ -n "$token" ]; then
    registry=${image%%/*}
    trap 'docker logout "$registry" >/dev/null 2>&1 || true' EXIT
    printf '%s' "$token" | docker login "$registry" --username "$registry_user" --password-stdin
  fi
  docker pull --quiet "$image"
fi

step "Database"
compose up --detach --wait --quiet-pull postgres

step "Migrations"
compose run --rm migrate
echo # drizzle-kit ends its output without a newline
expected=$(docker run --rm "$image" node -p 'require("./drizzle/meta/_journal.json").entries.length')
applied=$(compose exec -T postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from drizzle.__drizzle_migrations"')
echo "Migrations in the image: $expected, applied to the database: $applied"
[ "$applied" -ge "$expected" ] || fail "Not all migrations are applied, the new app is not started"

step "App"
if ! compose up --detach --wait --wait-timeout 180 app; then
  compose logs --tail 50 app
  fail "The new app did not become healthy. Nothing was rolled back."
fi
compose ps

step "Versions on the server"
mkdir -p state
current=$(cat state/current 2>/dev/null || true)
if [ "$current" != "$image" ]; then
  [ -z "$current" ] || printf '%s\n' "$current" > state/previous
  printf '%s\n' "$image" > state/current
fi
previous=$(cat state/previous 2>/dev/null || true)
echo "current:  $image"
echo "previous: ${previous:-none}"

step "Remove older images"
docker image ls "${image%:*}" --format '{{.Repository}}:{{.Tag}}' | while read -r old; do
  if [ "$old" != "$image" ] && [ "$old" != "$previous" ]; then
    docker image rm "$old" >/dev/null && echo "removed $old" || echo "kept $old: still in use"
  fi
done
docker image prune --force >/dev/null
docker image ls "${image%:*}"

step "Deployed $image"
