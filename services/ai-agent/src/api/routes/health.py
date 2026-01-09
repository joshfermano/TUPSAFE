"""Health check endpoints."""

from datetime import datetime, UTC
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ...config import settings
from ...memory import get_redis_store

router = APIRouter()


@router.get("")
async def health_check():
    """
    Health check endpoint.

    Returns:
        JSON response with application status, version, and timestamp.
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint.

    Checks if all required services (Redis, etc.) are ready.

    Returns:
        JSON response indicating if the service is ready to accept requests.
    """
    checks = {}
    all_ready = True

    # Check Redis connectivity
    try:
        redis_store = get_redis_store()
        redis_health = await redis_store.health_check()
        checks["redis"] = redis_health
        if redis_health["status"] != "healthy":
            all_ready = False
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}
        all_ready = False

    status_code = 200 if all_ready else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if all_ready else "not_ready",
            "checks": checks,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )


@router.get("/live")
async def liveness_check():
    """
    Liveness check endpoint.

    Returns:
        JSON response indicating if the service is alive.
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "alive",
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )


@router.get("/redis")
async def redis_health():
    """
    Redis health check endpoint.

    Returns:
        Detailed Redis connection health and server information.
    """
    try:
        redis_store = get_redis_store()

        # Get health check
        health = await redis_store.health_check()

        # Get Redis server info
        info = await redis_store.get_info()

        status_code = 200 if health["status"] == "healthy" else 503

        return JSONResponse(
            status_code=status_code,
            content={
                "health": health,
                "info": info,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Redis health check failed",
                "message": str(e),
            },
        )
