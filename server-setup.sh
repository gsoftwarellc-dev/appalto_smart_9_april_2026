#!/bin/bash
# Run this ON THE HOSTINGER SERVER (paste and run, or: bash server-setup.sh)
set -e
APP_DIR="$HOME/public_html/appalto-backend"
[ -d "$APP_DIR" ] || APP_DIR="$HOME/domains/plum-cod-233835.hostingersite.com/public_html/appalto-backend"
[ -d "$APP_DIR" ] || { echo "Error: appalto-backend not found. Upload files first with ./deploy-to-hostinger.sh public_html from your Mac."; exit 1; }
cd "$APP_DIR"
echo "=== In $APP_DIR ==="
[ -f .env ] || cp .env.production.example .env
echo "=== composer install ==="
composer install --no-dev --optimize-autoloader 2>/dev/null || true
echo "=== php artisan key:generate ==="
php artisan key:generate --force 2>/dev/null || true
echo "=== php artisan storage:link ==="
php artisan storage:link 2>/dev/null || true
echo "=== Done. Now: 1) nano .env and set DB_DATABASE, DB_USERNAME, DB_PASSWORD from hPanel. 2) Import appalto_smart_backup.sql in phpMyAdmin. 3) In hPanel set document root to: $APP_DIR/public"
