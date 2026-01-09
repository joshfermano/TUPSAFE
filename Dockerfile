# Multi-stage Dockerfile for TUPSAFE Next.js apps (employee/admin)
# Usage: docker build --build-arg APP_NAME=employee -t tupsafe-employee .
#        docker build --build-arg APP_NAME=admin -t tupsafe-admin .

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/employee/package*.json ./apps/employee/
COPY apps/admin/package*.json ./apps/admin/
COPY packages/database/package*.json ./packages/database/
COPY packages/auth/package*.json ./packages/auth/
COPY packages/types/package*.json ./packages/types/
COPY packages/shared-ui/package*.json ./packages/shared-ui/

# Install dependencies (production only for deps stage)
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Accept build argument for app name
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Validate APP_NAME
RUN if [ "$APP_NAME" != "employee" ] && [ "$APP_NAME" != "admin" ]; then \
      echo "Error: APP_NAME must be either 'employee' or 'admin'" && exit 1; \
    fi

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat python3 make g++

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Install all dependencies for build (including devDependencies)
RUN npm ci --ignore-scripts

# Build shared packages first (database must come before types due to dependencies)
RUN npm run build --workspace=@tupsafe/database
RUN npm run build --workspace=@tupsafe/types
RUN npm run build --workspace=@tupsafe/auth
RUN npm run build --workspace=@tupsafe/shared-ui

# Accept NEXT_PUBLIC_* variables as build args (these are baked into Next.js at build time)
# IMPORTANT: These must be passed during docker build, not at runtime
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_EMPLOYEE_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
# CRITICAL: Portal identifier for session isolation - must match APP_NAME
ARG NEXT_PUBLIC_APP_PORTAL=${APP_NAME}

# Set environment variables for Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_EMPLOYEE_APP_URL=${NEXT_PUBLIC_EMPLOYEE_APP_URL}
ENV NEXT_PUBLIC_ADMIN_APP_URL=${NEXT_PUBLIC_ADMIN_APP_URL}
# CRITICAL: This enables portal-specific cookie names for session isolation
ENV NEXT_PUBLIC_APP_PORTAL=${NEXT_PUBLIC_APP_PORTAL}

# Server-side only variables (can use placeholders, overridden at runtime)
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key-for-build
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# Build the specific app using Turbo
RUN npx turbo build --filter=${APP_NAME}

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Accept build argument for app name
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV PORT=3000

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build from builder
# The standalone build includes the entire application with dependencies
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (will be overridden by env var in docker-compose)
EXPOSE 3000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
# The standalone build creates a server.js in the app directory
CMD node apps/${APP_NAME}/server.js
