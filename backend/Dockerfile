# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first — Docker layer cache means this only
# re-runs when package.json changes, not on every source change.
COPY package*.json ./

RUN npm ci --omit=dev

# ============================================================
# Stage 2: Build (Prisma client generation)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate the Prisma client for the target platform
RUN npx prisma generate

# ============================================================
# Stage 3: Production image
# ============================================================
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup --system --gid 1001 avenor && \
    adduser --system --uid 1001 avenor && \
    mkdir -p /app/storage/documents && \
    chown -R avenor:avenor /app

WORKDIR /app

# Copy only what production needs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# The generated Prisma client lives inside node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER avenor

EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
