#!/usr/bin/env bash
# Manual rollback: deploys again the image that was live before the last deploy.
# It is still on the server, so nothing is downloaded. Run on the server:
#   sudo -u deploy bash /srv/personal-crm/deploy/rollback.sh
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
previous=$(cat "$root/state/previous" 2>/dev/null || true)
[ -n "$previous" ] || { echo "!! No previous version to roll back to" >&2; exit 1; }

echo "Rolling back to $previous"
exec bash "$root/deploy/deploy.sh" "$previous" </dev/null
