# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Set build-time environment variable (dummy value for build)
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy package files
COPY package.json package-lock.json* prisma.config.ts ./

# Install pnpm and dependencies
#RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN npm install

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Set build-time environment variable (dummy value for prisma generate)
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy package files
COPY package.json package-lock.json* prisma.config.ts ./

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Copy built application from builder
COPY --from=builder /app/.output ./.output

# Create uploads directory in .output/public with proper permissions
RUN mkdir -p /app/.output/public/uploads && chown -R node:node /app/.output/public/uploads

# Install production dependencies and generate Prisma client
RUN npm install --production && npx prisma generate

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
