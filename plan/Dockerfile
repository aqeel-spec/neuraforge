# NeuraForge UI Self-Hosted Runtime
# Runs Registry, Public API, docs, and MCP from local release artifacts.
# No NeuraForge account, license key, quota, or required egress.

FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY services/ ./services/
COPY apps/ ./apps/
COPY tsconfig.json tsconfig.base.json ./

RUN npm ci --production=false
RUN npm run typecheck

# Production image
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NEURAFORGE_PORT=3000
ENV NEURAFORGE_HOST=0.0.0.0

# Copy only production dependencies and built artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/ ./services/
COPY --from=builder /app/apps/ ./apps/
COPY --from=builder /app/node_modules/ ./node_modules/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "--experimental-specifier-resolution=node", "packages/self-hosting/src/start.ts"]
