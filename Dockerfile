# Production Dockerfile for Google Cloud Run (Container Instances)
# Ideally — AI Research Advisor
# Builds Vite client assets and runs Express backend with HTTP/2 and 0.0.0.0 binding

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Build Vite frontend assets to /app/dist
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm install tsx -g

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/types ./src/types

# Expose container port (Cloud Run sets PORT=8080 or PORT=3000)
EXPOSE 3000

# Start server using tsx in production mode
CMD ["npx", "tsx", "server.ts"]
