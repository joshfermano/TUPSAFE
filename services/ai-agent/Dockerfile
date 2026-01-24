# Dockerfile for TUPSAFE AI Agent Service (Python FastAPI + uv)
# Multi-stage build for optimized production image

# Stage 1: Builder
FROM python:3.12-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies needed for Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files and README (needed for package metadata)
COPY pyproject.toml uv.lock* README.md ./

# Sync dependencies using uv (creates .venv)
# Use --no-install-project to skip installing the project itself in editable mode
RUN uv sync --no-dev --no-install-project

# Copy source code
COPY src ./src

# Stage 2: Runtime
FROM python:3.12-slim AS runtime

# Set working directory
WORKDIR /app

# Install only runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r aiagent && \
    useradd -r -g aiagent -u 1001 aiagent && \
    chown -R aiagent:aiagent /app

# Copy virtual environment from builder
COPY --from=builder --chown=aiagent:aiagent /app/.venv /app/.venv

# Copy application code
COPY --chown=aiagent:aiagent src ./src

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src:$PYTHONPATH"

# Switch to non-root user
USER aiagent

# Expose port (Railway uses dynamic PORT)
EXPOSE 8000

# Health check (uses PORT env var, defaults to 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run uvicorn with dynamic PORT (Railway sets PORT env var)
# Using shell form to allow environment variable substitution
CMD uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
