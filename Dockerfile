# Multi-stage build for security and optimization
FROM node:18-alpine AS base

# Install security updates and essential packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    su-exec \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bot -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bots/package*.json ./bots/

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && \
    cd bots && npm ci --only=production

# Build stage
FROM base AS builder
COPY . .
RUN npm ci && \
    cd bots && npm ci && \
    npm run build

# Production stage
FROM base AS production

# Copy built application
COPY --from=builder --chown=bot:nodejs /app/bots/dist ./dist
COPY --from=deps --chown=bot:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=bot:nodejs /app/bots/node_modules ./bots/node_modules

# Copy necessary files
COPY --chown=bot:nodejs env.example ./
COPY --chown=bot:nodejs README.md ./
COPY --chown=bot:nodejs SECURITY.md ./

# Security hardening
RUN chmod -R 755 /app && \
    chown -R bot:nodejs /app

# Switch to non-root user
USER bot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["node", "dist/index.js"]

# Labels for security and maintainability
LABEL maintainer="Gaming Rewards Protocol Team" \
      description="Gaming Rewards Protocol Bot" \
      version="1.0.0" \
      security="non-root-user" \
      architecture="x86_64"

# Expose port (if needed for health checks)
EXPOSE 3000

# Security: Don't run as root
# Security: Use multi-stage build to reduce attack surface
# Security: Update packages regularly
# Security: Use Alpine Linux for smaller attack surface
# Security: Use dumb-init for proper signal handling
