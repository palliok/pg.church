FROM php:8.4-fpm

ARG UID=1000
ARG GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        unzip \
        libpq-dev \
        libzip-dev \
        libicu-dev \
    && docker-php-ext-install pdo_pgsql pgsql zip intl opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

# Работаем под пользователем с UID/GID хоста, чтобы файлы в примонтированном
# каталоге не становились root-овыми.
RUN groupadd -g $GID app \
    && useradd -u $UID -g app -m app

USER app
WORKDIR /var/www
