FROM node:24-alpine AS build
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

FROM nginx:1.27-alpine AS runtime
COPY infra/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
