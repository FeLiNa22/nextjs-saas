# Stage 1: Install all dependencies (used only for the build step)
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Install production dependencies + drizzle-kit for runtime migrations
FROM oven/bun:1-alpine AS runner-deps
WORKDIR /app

COPY package.json bun.lock ./
# Install production deps only, then add drizzle-kit which is required at
# container startup to run migrations before the server starts.
RUN bun install --frozen-lockfile --production \
    && bun add --no-save drizzle-kit

# Stage 3: Build the Next.js application
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_BASE_URL is inlined at build time by Next.js
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

RUN bun run build \
    # Ensure the drizzle output directory exists even if no migrations have
    # been generated yet (drizzle-kit push does not require it, but the COPY
    # instruction below will fail if the source path is absent).
    && mkdir -p drizzle

# Stage 4: Production runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/next.config.ts ./

# Copy production node_modules (includes drizzle-kit for runtime migrations)
COPY --from=runner-deps /app/node_modules ./node_modules

# Copy Drizzle config and schema so migrations can run at startup
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/db ./src/db

# Copy pre-generated migration files (if any)
COPY --from=builder /app/drizzle ./drizzle

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
