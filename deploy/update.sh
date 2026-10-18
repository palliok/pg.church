#!/usr/bin/env bash
# Обновление сайта на сервере до последней версии из GitHub:
#
#   sudo /srv/pgchurch/deploy/update.sh
#
# Скачивает код, обновляет зависимости бэка, применяет миграции и пересобирает фронт.
set -euo pipefail

APP_DIR=/srv/pgchurch
APP_USER=deploy

# Всё делается от имени пользователя сайта, чтобы файлы не становились root-овыми.
if [ "$(id -un)" != "$APP_USER" ]; then
    exec sudo -u "$APP_USER" -H "$0" "$@"
fi

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

cd "$APP_DIR"

step "Код из GitHub"
git pull --ff-only

step "Бэкенд"
docker compose build -q
docker compose run --rm -T app composer install --no-dev --optimize-autoloader --no-interaction --quiet
docker compose up -d
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan db:seed --class=SettingSeeder --force
docker compose exec -T app php artisan optimize

step "Фронтенд"
API_URL=$(grep '^APP_URL=' backend/.env | cut -d= -f2-)
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/frontend":/app -w /app \
    -e VITE_API_URL="$API_URL/api/v1" node:22-alpine sh -c 'npm ci --no-audit --no-fund && npm run build'

printf '\n\033[1;32mСайт обновлён.\033[0m\n'
