# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files for better caching
COPY package.json package-lock.json* prisma.config.ts ./

# Import npm lockfile to pnpm and install dependencies
RUN pnpm import && pnpm install --frozen-lockfile --prefer-offline

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set build-time environment variable (dummy value for build)
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma files first (better caching)
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma Client (cached if schema unchanged)
RUN npx prisma generate

# Copy application files
COPY . .

# Build the application
RUN pnpm run build

# Remove dev dependencies to reduce size
RUN pnpm prune --prod

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Set build-time environment variable
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy only necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/generated ./generated

# Create uploads directory with proper permissions
RUN mkdir -p /app/.output/public/uploads && chown -R node:node /app

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Switch to non-root user
USER node

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
