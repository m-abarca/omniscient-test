# syntax=docker/dockerfile:1.6
# Build multi-stage para el frontend Next.js.
# Los valores NEXT_PUBLIC_* se hornean en build time, así que los recibimos como ARGs.

FROM docker.io/library/node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
# --immutable requiere que todos los workspaces declarados en el glob
# `workspaces` del manifest raíz estén presentes; copiamos todos los package.jsons.
COPY .yarnrc.yml package.json yarn.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
RUN yarn install --immutable
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN yarn workspace @omniscient/web build

FROM docker.io/library/node:20-alpine AS runtime
WORKDIR /repo
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["yarn", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
