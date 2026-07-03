# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ───────────────────────────────────────────────
# Dependencies
# ───────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml* ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/*/package.json ./packages/*/

RUN pnpm install --frozen-lockfile

# ───────────────────────────────────────────────
# Builder
# ───────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

WORKDIR /app/apps/api
RUN pnpm build

# ───────────────────────────────────────────────
# Runner
# ───────────────────────────────────────────────
FROM base AS runner
WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apijs

COPY --from=builder --chown=apijs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apijs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=apijs:nodejs /app/apps/api/package.json ./package.json

USER apijs

EXPOSE 4000

CMD ["node", "dist/server.js"]