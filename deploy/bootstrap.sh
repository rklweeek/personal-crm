#!/usr/bin/env bash
# One-time server setup for deploys of the app. Run once, as root:
#   - user "deploy": GitHub Actions logs in with its key and runs docker
#   - /srv/personal-crm: deploy scripts, state and .env (owner deploy, mode 600)
#   - nginx: app.stayintouch.site → the app container on 127.0.0.1:3000
#   - opens .env in nano for a person to fill in, then checks it
# Only adds things: the landing, other users' keys and other nginx sites stay
# as they are. Safe to re-run.
#
# Usage: sudo bash bootstrap.sh <deploy-public-key-file>
set -euo pipefail

DEPLOY_USER=deploy
APP_DIR=/srv/personal-crm
ENV_FILE=$APP_DIR/.env
SITE=/etc/nginx/sites-available/stayintouch
SNIPPET=personal-crm-app.conf
HERE=$(cd "$(dirname "$0")" && pwd)
LOG=$HERE/bootstrap.log

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '!! %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with sudo: sudo bash $0 <deploy-public-key-file>"
pubkey_file=${1:?usage: sudo bash bootstrap.sh <deploy-public-key-file>}
pubkey=$(cat "$pubkey_file")
[[ $pubkey == ssh-ed25519\ * ]] || fail "Not an ed25519 public key: $pubkey_file"

# Keep the terminal on fds 3/4 for nano; everything else also goes to the log.
: > "$LOG"
[ -z "${SUDO_USER:-}" ] || chown "$SUDO_USER:" "$LOG"
exec 3>&1 4>&2
exec > >(tee -a "$LOG") 2>&1
trap 'echo "!! FAILED at line $LINENO"' ERR

step "User $DEPLOY_USER"
id "$DEPLOY_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$DEPLOY_USER"
# No password at all: the only way in is the key.
usermod --password '*' "$DEPLOY_USER"
usermod --append --groups docker "$DEPLOY_USER"
id "$DEPLOY_USER"

step "SSH key for GitHub Actions"
home=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
keys=$home/.ssh/authorized_keys
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$home/.ssh"
[ -e "$keys" ] || install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /dev/null "$keys"
# restrict: commands only, no terminal, no port/agent/X11 forwarding.
grep -qF "$pubkey" "$keys" || printf 'restrict %s\n' "$pubkey" >> "$keys"
ssh-keygen -lf "$keys"

step "App directory $APP_DIR"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"
# An empty .env with the right owner and mode; a person fills it in below.
[ -e "$ENV_FILE" ] || install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /dev/null "$ENV_FILE"
chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
ls -la "$APP_DIR"

step "nginx: app.stayintouch.site -> 127.0.0.1:3000"
install -m 644 "$HERE/nginx/$SNIPPET" "/etc/nginx/snippets/$SNIPPET"
if grep -qF "include snippets/$SNIPPET;" "$SITE"; then
  echo "Already proxied to the app"
else
  backup=/var/backups/nginx-stayintouch.$(date +%Y%m%d-%H%M%S)
  cp -a "$SITE" "$backup"
  # Replace only the app's stub server block; the landing blocks stay as they are.
  python3 - "$SITE" "$SNIPPET" <<'PY'
import sys

path, snippet = sys.argv[1], sys.argv[2]
stub = """# App: stub for now. When the app container is up, replace the location with
#   proxy_pass http://127.0.0.1:<port>;  (plus proxy headers)
server {
    listen 443 ssl http2;
    server_name app.stayintouch.site;
    include snippets/ssl-stayintouch.conf;

    root /var/www/stub;

    location / {
        try_files /index.html =404;
    }
}"""
app = f"""# App: the personal-crm container, see /etc/nginx/snippets/{snippet}
server {{
    listen 443 ssl http2;
    server_name app.stayintouch.site;
    include snippets/ssl-stayintouch.conf;

    include snippets/{snippet};
}}"""
text = open(path).read()
if text.count(stub) != 1:
    sys.exit(f"The app stub block in {path} is not as expected, nothing changed")
open(path, "w").write(text.replace(stub, app))
PY
  if ! nginx -t; then
    cp -a "$backup" "$SITE"
    fail "nginx config test failed, $SITE restored from $backup"
  fi
  systemctl reload nginx
  echo "Old config saved to $backup"
fi

step "Server is ready for deploys"

# ------------------------------------------------------------------ .env
# Back to the plain terminal: nano needs it, and the file content stays out of the log.
exec 1>&3 2>&4
env_ok() { grep -qE '^POSTGRES_PASSWORD=[A-Za-z0-9]{20,}$' "$ENV_FILE"; }

if ! env_ok; then
  cat <<EOF

------------------------------------------------------------
Сейчас откроется редактор файла $ENV_FILE
Впишите в него одну строку - пароль базы данных придумайте сами
(только латинские буквы и цифры, не короче 20 символов):

POSTGRES_PASSWORD=ваш-пароль

Вставить скопированное: правый клик мышью.
Сохранить и выйти: Ctrl+O, Enter, затем Ctrl+X.
------------------------------------------------------------
EOF
  read -rp "Нажмите Enter, чтобы открыть редактор... " _
fi

until env_ok; do
  nano "$ENV_FILE"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  env_ok && break
  echo
  echo "Не нашёл строку POSTGRES_PASSWORD=... : после знака = нужен пароль"
  echo "из латинских букв и цифр, не короче 20 символов."
  read -rp "Enter - открыть редактор снова, Ctrl+C - выйти. " _
done

echo ".env check: POSTGRES_PASSWORD is set, mode $(stat -c %a "$ENV_FILE"), owner $(stat -c %U "$ENV_FILE")" |
  tee -a "$LOG"
echo
echo "Готово. Это окно можно закрыть."
