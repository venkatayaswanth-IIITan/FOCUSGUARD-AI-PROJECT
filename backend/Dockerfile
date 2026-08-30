# ============================================================
# FOCUSGUARD AI — NODE.JS BACKEND DOCKERFILE
# Production-ready API, Real-time WebSockets & RAG Engine
# ============================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed for native modules
RUN apk add --no-cache python3 make g++ wget

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code and assets
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend API & WebSocket port
EXPOSE 5000

# Health check to ensure API and database connectivity
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --spider --tries=1 http://localhost:5000/api/health || exit 1

# Start the Node.js API server
CMD ["node", "server.js"]
