#!/usr/bin/env bash
# Deploy Appalto Smart to Hostinger via SSH
# 1. Build frontend  2. Rsync to server over SSH  3. Run post-deploy commands via SSH
# Usage: ./deploy-to-hostinger.sh [remote_path] [api_base_url]
#   remote_path default: domains/plum-cod-233835.hostingersite.com/public_html
#   api_base_url default: derived from remote_path (plum-cod or skyblue)
# Example for skyblue: ./deploy-to-hostinger.sh domains/skyblue-dotterel-801102.hostingersite.com/public_html
#
# Run from your Mac: cd "/Users/riyadulislamriyadh/Desktop/Appalto Smart" && ./deploy-to-hostinger.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SSH_USER="u977979652"
SSH_HOST="45.93.101.65"
SSH_PORT="65002"
SSH_KEY="$HOME/.ssh/hostinger_appalto"
[ -f "$SSH_KEY" ] || SSH_KEY="${SCRIPT_DIR}/.deploy-keys/hostinger"
REMOTE="${SSH_USER}@${SSH_HOST}"

REMOTE_PATH="${1:-domains/plum-cod-233835.hostingersite.com/public_html}"
# API base URL for frontend build (no trailing slash). Derive from path if not given.
if [[ -n "$2" ]]; then
  API_BASE="${2%/}"
else
  if [[ "$REMOTE_PATH" == *"skyblue-dotterel"* ]]; then
    API_BASE="https://skyblue-dotterel-801102.hostingersite.com"
  else
    API_BASE="https://plum-cod-233835.hostingersite.com"
  fi
fi
VITE_API_URL="${API_BASE}/api"

echo "=== Deploy target ==="
echo "  Remote: $REMOTE (port $SSH_PORT)"
echo "  Path:   $REMOTE_PATH"
echo "  API:    $VITE_API_URL"
echo "  Backend: $REMOTE_PATH/appalto-backend/"
[ -f "$SSH_KEY" ] && echo "  SSH key: $SSH_KEY" || echo "  SSH key: (using password or default key)"
echo ""

echo "=== Building frontend (production) ==="
npm ci --prefer-offline --no-audit 2>/dev/null || true
VITE_API_URL="$VITE_API_URL" npm run build

echo "=== Copying React build into backend public ==="
rm -rf appalto-backend/public/assets appalto-backend/public/index.html 2>/dev/null || true
cp -r dist/* appalto-backend/public/
# Inject build timestamp so we can verify live site version (view page source)
BUILD_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i.bak "s|<title>appalto-smart</title>|<title>appalto-smart</title>\n    <!-- build: $BUILD_TS -->|" appalto-backend/public/index.html 2>/dev/null || true
rm -f appalto-backend/public/index.html.bak 2>/dev/null || true

echo "=== Creating public_html on server if missing ==="
RSYNC_SSH="ssh -p $SSH_PORT -o StrictHostKeyChecking=no"
[ -f "$SSH_KEY" ] && RSYNC_SSH="ssh -p $SSH_PORT -o StrictHostKeyChecking=no -i $SSH_KEY"
eval "$RSYNC_SSH \"$REMOTE\" \"mkdir -p $REMOTE_PATH\"" 2>/dev/null || true
echo "=== Syncing backend to server ==="
rsync -avz --delete -e "$RSYNC_SSH" \
  --exclude='.env' \
  --exclude='vendor' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='public/storage' \
  --exclude='storage/app/**' \
  --exclude='storage/logs/*' \
  --exclude='storage/framework/cache/*' \
  --exclude='storage/framework/sessions/*' \
  --exclude='storage/framework/views/*' \
  appalto-backend/ "$REMOTE:$REMOTE_PATH/appalto-backend/"

echo "=== All server steps via single SSH session ==="
BACKEND_DIR="$REMOTE_PATH/appalto-backend"
# Single SSH session: run full deploy script on server (composer + artisan)
SSH_CMD="ssh -p $SSH_PORT -o StrictHostKeyChecking=no"
[ -f "$SSH_KEY" ] && SSH_CMD="$SSH_CMD -i $SSH_KEY"
PLUM_BACKEND="domains/plum-cod-233835.hostingersite.com/public_html/appalto-backend"
$SSH_CMD "$REMOTE" "bash -s" "$BACKEND_DIR" "$PLUM_BACKEND" <<'REMOTE_SCRIPT'
set -e
BACKEND_DIR="$1"
PLUM_BACKEND="$2"
cd "$BACKEND_DIR" || exit 1
echo '>> Composer install'
composer install --no-dev --no-interaction 2>/dev/null || true
# If deploying to skyblue, copy .env from plum-cod and set APP_URL (so DB/cache work if shared)
if [[ "$BACKEND_DIR" == *"skyblue-dotterel"* ]] && [[ -d "$HOME/$PLUM_BACKEND" ]]; then
  echo '>> Copy .env from plum-cod and set APP_URL for skyblue'
  cp "$HOME/$PLUM_BACKEND/.env" .env 2>/dev/null || true
  sed -i 's|APP_URL=.*|APP_URL=https://skyblue-dotterel-801102.hostingersite.com|' .env 2>/dev/null || true
fi
echo '>> Artisan config:clear'
php artisan config:clear 2>/dev/null || true
echo '>> Artisan cache:clear'
( php artisan cache:clear 2>/dev/null ) || true
echo '>> Artisan view:clear'
php artisan view:clear 2>/dev/null || true
echo '>> Artisan route:clear'
php artisan route:clear 2>/dev/null || true
echo '>> Storage link'
if php artisan storage:link 2>/dev/null; then
  echo '   storage:link ok'
else
  if [[ -L public/storage ]] && [[ ! -e public/storage ]]; then
    rm -f public/storage 2>/dev/null || true
  fi
  if [[ ! -L public/storage ]] && [[ -d storage/app/public ]]; then
    ln -sf ../storage/app/public public/storage 2>/dev/null && echo '   storage symlink created manually' || true
  fi
fi
echo '>> Copy SPA from appalto-backend/public to document root'
cp -f public/index.html ../
rm -rf ../assets
cp -r public/assets ../
echo '>> Copy root .htaccess (no-cache for index.html + API routing)'
cp -f public/root.htaccess ../.htaccess 2>/dev/null || true
echo '>> Verify deployed files (backend + root)'
ls -la public/index.html public/assets/*.js 2>/dev/null || true
ls -la ../index.html ../assets/*.js 2>/dev/null || true
echo '>> SSH deploy steps finished.'
REMOTE_SCRIPT

echo ""
echo "=== Deploy done (all server steps ran via SSH). Optional: ==="
echo "  ssh -p $SSH_PORT -i \$HOME/.ssh/hostinger_appalto $REMOTE"
echo "  cd $REMOTE_PATH/appalto-backend && cp .env.production.example .env && php artisan key:generate"
