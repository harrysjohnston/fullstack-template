# Base stage
FROM node:20-alpine AS base

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Dependencies stage
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

# Install all dependencies (including dev)
RUN pnpm install --filter @apps/web... --frozen-lockfile

# Development stage
FROM base AS development

ENV NODE_ENV=development

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

# Install dependencies
RUN pnpm install --filter @apps/web...

# Copy application code
COPY apps/web apps/web

WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

# Run with hot-reload
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

# Builder stage - build the application
FROM dependencies AS builder

# Copy application code
COPY apps/web apps/web

# Build the application
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup -S -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser

# Copy standalone build output; no pnpm install or runtime dependency mutation.
COPY --from=builder --chown=appuser:appuser /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=appuser:appuser /app/apps/web/public ./apps/web/public

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the standalone Next.js server (path differs between mono/single-repo layouts).
CMD ["sh", "-c", "if [ -f apps/web/server.js ]; then node apps/web/server.js; else node server.js; fi"]
