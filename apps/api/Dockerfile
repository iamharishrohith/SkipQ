# ========================================
# SkipQ v2 Elysia API — Production Dockerfile
# ========================================

FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Copy root monorepo files for dependencies installation
COPY package.json bun.lock tsconfig.base.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

# Copy codebase sources
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Compile/bundle Elysia API into single bundle file
WORKDIR /app/apps/api
RUN bun run build

# --- Runner stage ---
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

# Create directory for Fly persistent volume mount
RUN mkdir -p /data

# Configure runtime environments
ENV PORT=3001
ENV NODE_ENV=production
ENV DATA_DIR=/data

# Copy built compiled server bundle and configuration templates
COPY --from=builder /app/apps/api/dist/index.js ./index.js
COPY --from=builder /app/apps/api/.env.example ./.env

EXPOSE 3001

# Run the single standalone bundled server
CMD ["bun", "run", "index.js"]
