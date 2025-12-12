# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files for better caching
COPY package.json package-lock.json* prisma.config.ts ./

# Install dependencies (cached if package files unchanged)
RUN npm ci --prefer-offline --no-audit

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Set build-time environment variable (dummy value for build)
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma.config.ts ./

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies to reduce size
RUN npm prune --production

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
