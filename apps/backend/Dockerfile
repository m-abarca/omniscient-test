# syntax=docker/dockerfile:1.6
# Build multi-stage para el backend NestJS.
# Etapa 1 instala dependencias y compila el bundle webpack (dist/apps/api/main.js).
# Etapa 2 despacha solo el bundle y Node — sin node_modules en runtime.

FROM docker.io/library/node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
# Instalar primero solo lo necesario para resolver el grafo de workspaces (mejor cacheo).
# Nota: --immutable requiere que todos los workspaces declarados en el glob
# `workspaces` del manifest raíz estén presentes, si no Yarn propone podar el
# lockfile y el install falla. Por eso copiamos todos los package.jsons aquí.
COPY .yarnrc.yml package.json yarn.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
RUN yarn install --immutable
# Ahora copiamos las fuentes y compilamos.
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend
RUN yarn workspace @omniscient/backend build

FROM docker.io/library/node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV BACKEND_PORT=3001
COPY --from=build /repo/apps/backend/dist ./dist
EXPOSE 3001
CMD ["node", "dist/apps/api/main.js"]
