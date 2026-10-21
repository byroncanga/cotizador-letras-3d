FROM php:8.5-cli
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libicu-dev && docker-php-ext-install pdo_mysql bcmath intl zip && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-interaction --no-scripts --prefer-dist
COPY apps/api/ ./
RUN composer dump-autoload && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views && chown -R www-data:www-data storage bootstrap/cache
USER www-data
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
