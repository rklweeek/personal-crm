#!/usr/bin/env bash
# Smoke test after a deploy: <url> must answer HTTP 200 with "status":"ok"
# and, when <version> is given, the answer must come from that version.
# Usage: smoke.sh <url> [<version>]
set -euo pipefail

url=${1:?usage: smoke.sh <url> [<version>]}
version=${2:-}

for attempt in 1 2 3 4 5 6; do
  response=$(curl --silent --show-error --max-time 10 --write-out '\n%{http_code}' "$url") \
    || response=$'\n000'
  code=${response##*$'\n'}
  body=${response%$'\n'*}
  echo "GET $url -> HTTP $code $body"

  if [ "$code" = 200 ] && [[ $body == *'"status":"ok"'* ]] &&
    { [ -z "$version" ] || [[ $body == *"\"version\":\"$version\""* ]]; }; then
    echo "Smoke test passed"
    exit 0
  fi
  [ "$attempt" = 6 ] || sleep 5
done

echo "!! Smoke test failed: the deploy is broken. Nothing was rolled back." >&2
exit 1
