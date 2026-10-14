# Docker

- PHP, Composer and PostgreSQL run only in Docker (`docker-compose.yml` in the repository root); the host has no PHP. Run every `php artisan …`, `composer …` and `vendor/bin/…` command through the `app` service: `docker compose exec app php artisan route:list`.
- Tests use the `pgchurch_testing` database: `docker compose exec app php artisan test --compact`.
- The Docker bridge network may have no internet access. If `composer require` or an image build hangs on downloads, run it in a one-off container with host networking: `docker run --rm --network host -e DB_HOST=127.0.0.1 -e DB_PORT=5437 -v "$PWD":/var/www pgchurch-app composer …`.
