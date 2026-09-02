# syntax=docker/dockerfile:1

# --- Build stage -----------------------------------------------------------
FROM node:22-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Dependency layer — cached until package.json / lockfile change.
# --ignore-scripts skips the `nuxt prepare` postinstall here (project files
# are not copied yet); it runs explicitly in the build step below.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the fully static site into .output/public
COPY . .
RUN pnpm exec nuxt prepare && pnpm generate

# --- Runtime stage -------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html

EXPOSE 80
