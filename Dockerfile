# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Set build-time environment variable (dummy value for build)
ARG NUXT_DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL

# Copy package files
COPY package.json package-lock.json* ./

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

# Copy package files
COPY package.json package-lock.json* ./

# Install pnpm and production dependencies only
#RUN npm install -g pnpm && pnpm install --prod --no-frozen-lockfile
RUN npm install --production

# Copy Prisma schema and generate client
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
