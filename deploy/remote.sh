#!/usr/bin/env bash
# Runs on the GitHub Actions runner: copies deploy/ to the server and runs one
# of its scripts there over SSH.
# Usage: remote.sh <script> [<args>...]     e.g. remote.sh deploy.sh <image> <user>
# Env:   DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_KNOWN_HOSTS
#        REMOTE_STDIN (optional): passed to the script on stdin, e.g. a registry token
set -euo pipefail

script=${1:?usage: remote.sh <script> [<args>...]}
shift
: "${DEPLOY_HOST:?}" "${DEPLOY_USER:?}" "${DEPLOY_SSH_KEY:?}" "${DEPLOY_KNOWN_HOSTS:?}"

app_dir=/srv/personal-crm
here=$(cd "$(dirname "$0")" && pwd)

ssh_dir=$(mktemp -d)
trap 'rm -rf "$ssh_dir"' EXIT
(
  umask 077
  printf '%s\n' "$DEPLOY_SSH_KEY" > "$ssh_dir/key"
  printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$ssh_dir/known_hosts"
)
remote() {
  ssh -i "$ssh_dir/key" -o IdentitiesOnly=yes -o BatchMode=yes \
    -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$ssh_dir/known_hosts" \
    "$DEPLOY_USER@$DEPLOY_HOST" "$@"
}

echo "Copying deploy/ to $DEPLOY_HOST:$app_dir/deploy"
tar -C "$here" -cf - . | remote "set -e; cd $app_dir
  rm -rf deploy.new && mkdir deploy.new && tar -C deploy.new -xf -
  rm -rf deploy && mv deploy.new deploy"

echo "Running $script on $DEPLOY_HOST"
args=""
[ $# -eq 0 ] || args=$(printf '%q ' "$@")
printf '%s' "${REMOTE_STDIN:-}" | remote "bash $app_dir/deploy/$script $args"
