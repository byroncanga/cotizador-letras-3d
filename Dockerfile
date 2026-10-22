FROM node:24-alpine AS web-build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/geometry/package.json services/geometry/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci
COPY apps/web/ apps/web/
COPY services/geometry/ services/geometry/
COPY packages/contracts/ packages/contracts/
COPY tsconfig.base.json ./
RUN npm run build

FROM node:24-bookworm-slim AS geometry-build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/geometry/package.json services/geometry/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace=@taller/geometry --include-workspace-root
COPY services/geometry/ services/geometry/
COPY packages/contracts/ packages/contracts/

FROM php:8.5-cli-bookworm AS api-build
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libicu-dev libonig-dev \
    && docker-php-ext-install pdo_mysql bcmath intl zip mbstring \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-interaction --no-scripts --prefer-dist --no-dev --optimize-autoloader
COPY apps/api/ ./
RUN composer dump-autoload --no-dev --optimize \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

FROM php:8.5-cli-bookworm AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends nginx nodejs supervisor curl libzip-dev libicu-dev libonig-dev libsqlite3-dev \
    && docker-php-ext-install pdo_mysql pdo_sqlite bcmath intl zip mbstring \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf
WORKDIR /app
COPY --from=api-build /app /app
COPY --from=web-build /workspace/apps/web/dist /usr/share/nginx/html
COPY --from=geometry-build /workspace/package.json /opt/taller/package.json
COPY --from=geometry-build /workspace/node_modules /opt/taller/node_modules
COPY --from=geometry-build /workspace/services/geometry /opt/taller/services/geometry
COPY --from=geometry-build /workspace/packages/contracts /opt/taller/packages/contracts
COPY infra/web/nginx-standalone.conf /etc/nginx/conf.d/default.conf
COPY infra/web/supervisord.conf /etc/supervisor/conf.d/taller.conf
COPY infra/web/container-start /usr/local/bin/container-start
RUN chmod +x /usr/local/bin/container-start \
    && mkdir -p /var/log/supervisor \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache /opt/taller
ENV APP_ENV=production \
    APP_DEBUG=false \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/app/storage/app.sqlite \
    SESSION_DRIVER=file \
    CACHE_STORE=file \
    QUEUE_CONNECTION=sync \
    GEOMETRY_HOST=127.0.0.1
EXPOSE 80
VOLUME ["/app/storage"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1/health >/dev/null && curl -fsS http://127.0.0.1:4100/health >/dev/null && curl -fsS http://127.0.0.1:8000/api/v1/setup/status >/dev/null || exit 1
CMD ["/usr/local/bin/container-start"]
