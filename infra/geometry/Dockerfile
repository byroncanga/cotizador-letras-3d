FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/geometry/package.json services/geometry/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace=@taller/geometry --include-workspace-root
COPY services/geometry/ services/geometry/
COPY packages/contracts/ packages/contracts/
ENV GEOMETRY_HOST=0.0.0.0
USER node
EXPOSE 4100
CMD ["npm", "run", "start", "-w", "@taller/geometry"]
