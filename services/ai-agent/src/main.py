"""FastAPI application entry point for TUPSAFE AI Agent."""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from rich.console import Console
from rich.logging import RichHandler

from .config import settings
from .memory import initialize_redis, close_redis

# Configure Rich console for colored output
console = Console(force_terminal=True, color_system="auto")

# Configure logging with Rich handler for colored output
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(message)s",
    datefmt="[%X]",
    handlers=[
        RichHandler(
            console=console,
            rich_tracebacks=True,
            tracebacks_show_locals=settings.DEBUG,
            show_time=True,
            show_level=True,
            show_path=True,
        )
    ],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    redis_available = False
    try:
        # Validate LLM configuration
        settings.validate_llm_config()
        logger.info(f"Using default LLM provider: {settings.DEFAULT_LLM_PROVIDER}")
        logger.info(f"Using default LLM model: {settings.DEFAULT_LLM_MODEL}")

        # Initialize Redis connection (optional for local dev)
        try:
            await initialize_redis()
            logger.info("Redis connection established")
            redis_available = True
        except Exception as redis_error:
            logger.warning(f"Redis not available: {redis_error}")
            logger.warning("Running without Redis - rate limiting and session caching disabled")

        # Supabase client is initialized lazily via @lru_cache in src.db.client
        logger.info("Supabase client ready (lazy initialization)")

    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise

    # Store redis availability in app state
    app.state.redis_available = redis_available

    yield

    # Shutdown
    logger.info("Shutting down application")

    # Close Redis connection (if it was initialized)
    if getattr(app.state, 'redis_available', False):
        await close_redis()
        logger.info("Redis connection closed")

    # Supabase client cleanup is handled by garbage collection (uses @lru_cache)


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered assistant for TUP Manila's TUPSAFE system",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f">>> Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"<<< Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"!!! Middleware caught exception: {type(e).__name__}: {e}")
        raise

# Import routers after app creation to avoid circular imports
from .api.routes import health, chat, models, usage  # noqa: E402

# Include routers with /api prefix to match admin portal expectations
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(models.router, prefix="/api/models", tags=["Models"])
app.include_router(usage.router, prefix="/api/usage", tags=["Usage"])


@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint with application information."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs_url": "/docs" if settings.DEBUG else None,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred",
        },
    )
