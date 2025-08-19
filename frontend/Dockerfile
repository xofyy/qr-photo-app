# Multi-stage build for production
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci && npm cache clean --force

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_GA_TRACKING_ID

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_GA_TRACKING_ID=$REACT_APP_GA_TRACKING_ID
ENV REACT_APP_ENV=production

# Copy source code (excluding .env files to prevent build issues)
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]