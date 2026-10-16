#!/usr/bin/env bash
# Fills the production database with test contacts and notes, using the image
# that is live now. scripts/seed.ts refuses to run when contacts already exist,
# so it never mixes test data into real data and never deletes anything.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
image=$(cat "$root/state/current" 2>/dev/null || true)
[ -n "$image" ] || { echo "!! Nothing is deployed yet" >&2; exit 1; }

echo "Seeding with $image"
APP_IMAGE=$image docker compose -p prod --project-directory "$root" -f "$root/deploy/compose.yaml" \
  run --rm seed
