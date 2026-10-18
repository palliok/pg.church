#!/usr/bin/env bash
# Установка сайта на чистый сервер Ubuntu одной командой (запускать от root):
#
#   curl -fsSLO https://raw.githubusercontent.com/palliok/pg.church/main/deploy/install.sh
#   bash install.sh site.ru you@mail.ru
#
# Ставит Docker, nginx и HTTPS, скачивает код в /srv/pgchurch, запускает бэк,
# собирает фронт. Сайт — https://site.ru, API и админка — https://api.site.ru.
# Скрипт можно запускать повторно: уже сделанное он пропускает, пароли не меняет.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
REPO="${REPO:-https://github.com/palliok/pg.church.git}"
APP_DIR=/srv/pgchurch
APP_USER=deploy
CREDENTIALS=/root/pgchurch-credentials.txt

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mОшибка: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "запустите от root (ssh root@IP)."
[ -n "$DOMAIN" ] && [ -n "$EMAIL" ] || fail "укажите домен и почту: bash install.sh site.ru you@mail.ru"
DOMAIN="${DOMAIN#http*://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%/}"
API_DOMAIN="api.$DOMAIN"

# Выполнить команду в каталоге сайта от имени пользователя сайта.
as_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $*"; }

# Записать KEY=value в .env: заменить строку, если она есть, иначе дописать.
set_env() {
    local file=$1 key=$2 value=$3
    if grep -q "^$key=" "$file"; then
        sed -i "s|^$key=.*|$key=$value|" "$file"
    else
        echo "$key=$value" >> "$file"
    fi
}

step "Пакеты: git, nginx, certbot, файрвол"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl openssl nginx certbot python3-certbot-nginx ufw > /dev/null

if ! command -v docker > /dev/null; then
    step "Docker"
    curl -fsSL https://get.docker.com | sh
fi

if ! swapon --show | grep -q .; then
    step "Файл подкачки 2 ГБ (чтобы сборка не падала от нехватки памяти)"
    fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile > /dev/null && swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

step "Файрвол: открыты только SSH, HTTP и HTTPS"
ufw allow OpenSSH > /dev/null
ufw allow 'Nginx Full' > /dev/null
ufw --force enable > /dev/null

step "Пользователь $APP_USER"
id "$APP_USER" > /dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
usermod -aG docker "$APP_USER"

step "Код сайта в $APP_DIR"
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
    as_app "git clone '$REPO' ."
else
    as_app "git pull --ff-only"
fi

step "Настройки (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
    DB_PASSWORD=$(openssl rand -hex 16)
    cat > "$APP_DIR/.env" <<EOF
UID=$(id -u "$APP_USER")
GID=$(id -g "$APP_USER")
APP_PORT=127.0.0.1:8300
DB_FORWARD_PORT=127.0.0.1:5437
DB_PASSWORD=$DB_PASSWORD
EOF
    chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
fi
DB_PASSWORD=$(grep '^DB_PASSWORD=' "$APP_DIR/.env" | cut -d= -f2-)

# MTU основной сетевой карты: сеть контейнеров должна быть не больше, иначе загрузки зависают.
NET_DEV=$(ip route get 1.1.1.1 | awk '{for (i = 1; i < NF; i++) if ($i == "dev") print $(i + 1)}')
DOCKER_MTU=$(cat "/sys/class/net/$NET_DEV/mtu" 2>/dev/null || echo 1500)
set_env "$APP_DIR/.env" DOCKER_MTU "$DOCKER_MTU"

BACKEND_ENV="$APP_DIR/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=')
    cp "$APP_DIR/backend/.env.example" "$BACKEND_ENV"
    set_env "$BACKEND_ENV" APP_ENV production
    set_env "$BACKEND_ENV" APP_DEBUG false
    set_env "$BACKEND_ENV" APP_URL "https://$API_DOMAIN"
    set_env "$BACKEND_ENV" SITE_URL "https://$DOMAIN"
    set_env "$BACKEND_ENV" LOG_LEVEL warning
    set_env "$BACKEND_ENV" DB_PASSWORD "$DB_PASSWORD"
    set_env "$BACKEND_ENV" ADMIN_EMAIL "$EMAIL"
    set_env "$BACKEND_ENV" ADMIN_PASSWORD "$ADMIN_PASSWORD"
    set_env "$BACKEND_ENV" SESSION_SECURE_COOKIE true
    chown "$APP_USER:$APP_USER" "$BACKEND_ENV"
    chmod 600 "$BACKEND_ENV"

    cat > "$CREDENTIALS" <<EOF
Админка:  https://$API_DOMAIN/admin
Почта:    $EMAIL
Пароль:   $ADMIN_PASSWORD
EOF
    chmod 600 "$CREDENTIALS"
fi

step "Бэкенд: сборка и запуск контейнеров (первый раз — несколько минут)"
# Образ собирается через сеть хоста: на облачных серверах MTU часто меньше 1500,
# и через мост Docker загрузки apt зависают.
as_app "docker build --network host -q -t pgchurch-app --build-arg UID=\$(id -u) --build-arg GID=\$(id -g) -f docker/php/Dockerfile ."
# Пересоздаём сеть контейнеров, чтобы применился MTU (данные базы хранятся в томе и не теряются).
as_app "docker compose down --remove-orphans"
as_app "docker compose run --rm -T app composer install --no-dev --optimize-autoloader --no-interaction --quiet"
grep -q '^APP_KEY=base64:' "$BACKEND_ENV" || as_app "docker compose run --rm -T app php artisan key:generate --force"
as_app "docker compose up -d"
as_app "docker compose exec -T app php artisan storage:link" > /dev/null 2>&1 || true

step "База данных: таблицы, администратор, настройки, реквизиты"
as_app "docker compose exec -T app php artisan migrate --force"
for seeder in AdminUserSeeder SettingSeeder DonationAccountSeeder; do
    as_app "docker compose exec -T app php artisan db:seed --class=$seeder --force"
done
as_app "docker compose exec -T app php artisan optimize"

step "Фронтенд: сборка"
as_app "docker run --rm --network host -u \$(id -u):\$(id -g) -e HOME=/tmp -v \"\$PWD/frontend\":/app -w /app \
    -e VITE_API_URL=https://$API_DOMAIN/api/v1 node:22-alpine sh -c 'npm ci --no-audit --no-fund && npm run build'"
chmod o+x /srv "$APP_DIR" "$APP_DIR/frontend"

step "nginx: $DOMAIN — сайт, $API_DOMAIN — API и админка"
cat > /etc/nginx/sites-available/pgchurch <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $APP_DIR/frontend/dist;
    index index.html;

    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}

server {
    listen 80;
    server_name $API_DOMAIN;
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:8300;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}
EOF
ln -sf /etc/nginx/sites-available/pgchurch /etc/nginx/sites-enabled/pgchurch
rm -f /etc/nginx/sites-enabled/default
nginx -t -q
systemctl reload nginx

step "HTTPS-сертификаты"
SERVER_IP=$(curl -fsS4 --max-time 10 https://api.ipify.org || true)
resolves_here() { [ -n "$SERVER_IP" ] && getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$SERVER_IP"; }

HTTPS_DOMAINS=()
for name in "$DOMAIN" "www.$DOMAIN" "$API_DOMAIN"; do
    resolves_here "$name" && HTTPS_DOMAINS+=(-d "$name")
done

HTTPS_OK=false
if resolves_here "$DOMAIN" && resolves_here "$API_DOMAIN"; then
    certbot --nginx --non-interactive --agree-tos --redirect --keep-until-expiring -m "$EMAIL" "${HTTPS_DOMAINS[@]}" && HTTPS_OK=true
fi

printf '\n\033[1;32mГотово!\033[0m\n\n'
if $HTTPS_OK; then
    echo "Сайт:     https://$DOMAIN"
else
    echo "HTTPS пока не включён: домены $DOMAIN и $API_DOMAIN ещё не указывают на этот сервер (${SERVER_IP:-IP не определён})."
    echo "Проверьте A-записи на reg.ru и через 15–60 минут запустите эту же команду ещё раз."
    echo "Сайт пока открывается по http://$DOMAIN"
fi
[ -f "$CREDENTIALS" ] && { echo; cat "$CREDENTIALS"; echo; echo "(эти данные сохранены в $CREDENTIALS)"; }
echo
echo "Обновить сайт после изменений в GitHub:  sudo $APP_DIR/deploy/update.sh"
