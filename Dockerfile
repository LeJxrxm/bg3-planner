# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && pnpm install --prod --no-frozen-lockfile

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/.output ./.output

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
