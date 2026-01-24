#!/bin/sh
# Entrypoint script for TUPSAFE AI Agent
# Handles Railway's dynamic PORT environment variable

# Default to 8000 if PORT is not set
PORT="${PORT:-8000}"

echo "Starting TUPSAFE AI Agent on port $PORT"

# Start uvicorn with the resolved port
exec uvicorn src.main:app --host 0.0.0.0 --port "$PORT"
