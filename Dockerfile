# Multi-stage Docker build for Mermaid Race
# Stage 1: Build React client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files (including lock file for npm ci)
COPY client/package.json client/package-lock.json ./

# Install client dependencies using npm ci for reproducible builds
RUN npm ci

# Copy client source
COPY client/ ./

# Build React app
RUN npm run build

# Stage 2: Setup server and run
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mermaid -u 1001

# Copy server package files (including lock file for npm ci)
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server

# Install server dependencies using npm ci for reproducible builds
RUN npm ci --omit=dev

# Copy server source
COPY server/index.js ./

# Copy built client from previous stage
COPY --from=client-builder /app/client/dist /app/client/dist

# Set ownership
RUN chown -R mermaid:nodejs /app

# Switch to non-root user
USER mermaid

WORKDIR /app/server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start server
CMD ["node", "index.js"]
