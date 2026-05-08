# SEO Bot - Production Dockerfile
# Optimized for Coolify deployment

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install only production dependencies (faster, smaller image)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create data directory (will be mounted as volume in Coolify)
RUN mkdir -p /app/data/logs

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Default command: one-shot generation (perfect for Coolify Cron Job)
# To run as long-lived service instead, override with: node src/index.js
CMD ["node", "src/bot.js"]
