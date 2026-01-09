"""Redis connection and store management for TUPSAFE AI Agent.

Provides async Redis client with connection pooling, health checks,
and lifecycle management for FastAPI lifespan events.
"""

import logging
from typing import Any, Optional

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool
from redis.exceptions import ConnectionError, RedisError

from ..config.settings import settings

logger = logging.getLogger(__name__)


class RedisStore:
    """Redis store with connection pooling and health checks.

    Manages Redis connections with automatic reconnection,
    connection pooling, and health monitoring for production use.
    """

    def __init__(self, redis_url: str, max_connections: int = 50):
        """Initialize Redis store with connection pool.

        Args:
            redis_url: Redis connection URL (redis://host:port/db)
            max_connections: Maximum connections in pool (default: 50)
        """
        self.redis_url = redis_url
        self.max_connections = max_connections
        self._client: Optional[redis.Redis] = None
        self._pool: Optional[ConnectionPool] = None
        self._is_connected = False

    async def connect(self) -> None:
        """Establish Redis connection with pool.

        Creates connection pool and initializes Redis client.
        Logs connection status and performs initial health check.

        Raises:
            ConnectionError: If unable to connect to Redis
        """
        try:
            # Create connection pool
            self._pool = ConnectionPool.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                decode_responses=True,  # Auto-decode bytes to strings
                socket_keepalive=True,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )

            # Initialize Redis client
            self._client = redis.Redis(connection_pool=self._pool)

            # Test connection
            await self._client.ping()
            self._is_connected = True

            logger.info(
                f"Redis connected successfully to {self.redis_url} "
                f"(pool size: {self.max_connections})"
            )

        except ConnectionError as e:
            logger.error(f"Failed to connect to Redis at {self.redis_url}: {e}")
            self._is_connected = False
            raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {e}")
            self._is_connected = False
            raise

    async def disconnect(self) -> None:
        """Close Redis connection and cleanup pool.

        Gracefully closes all connections in pool and releases resources.
        Safe to call multiple times.
        """
        if self._client:
            try:
                await self._client.aclose()
                logger.info("Redis client closed")
            except Exception as e:
                logger.warning(f"Error closing Redis client: {e}")
            finally:
                self._client = None

        if self._pool:
            try:
                await self._pool.aclose()
                logger.info("Redis connection pool closed")
            except Exception as e:
                logger.warning(f"Error closing Redis pool: {e}")
            finally:
                self._pool = None

        self._is_connected = False

    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance.

        Returns:
            Redis client for executing commands

        Raises:
            RuntimeError: If not connected to Redis
        """
        if not self._client or not self._is_connected:
            raise RuntimeError(
                "Redis client not initialized. Call connect() first."
            )
        return self._client

    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected.

        Returns:
            True if connected, False otherwise
        """
        return self._is_connected

    async def health_check(self) -> dict[str, Any]:
        """Perform Redis health check.

        Returns:
            Dict with health status:
                - status: 'healthy' or 'unhealthy'
                - connected: Boolean connection status
                - latency_ms: Ping latency in milliseconds
                - error: Error message if unhealthy
        """
        if not self._client:
            return {
                "status": "unhealthy",
                "connected": False,
                "error": "Redis client not initialized",
            }

        try:
            import time
            start = time.time()
            await self._client.ping()
            latency_ms = (time.time() - start) * 1000

            return {
                "status": "healthy",
                "connected": True,
                "latency_ms": round(latency_ms, 2),
            }

        except RedisError as e:
            logger.error(f"Redis health check failed: {e}")
            self._is_connected = False
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
            }

    async def get_info(self) -> dict[str, Any]:
        """Get Redis server information.

        Returns:
            Dict with Redis server stats (memory, clients, etc.)
            or error dict if unable to retrieve info
        """
        try:
            info = await self.client.info()
            return {
                "redis_version": info.get("redis_version"),
                "used_memory_human": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_connections_received": info.get("total_connections_received"),
                "total_commands_processed": info.get("total_commands_processed"),
                "uptime_in_seconds": info.get("uptime_in_seconds"),
            }
        except RedisError as e:
            logger.error(f"Failed to get Redis info: {e}")
            return {"error": str(e)}


# Global Redis store instance
_redis_store: Optional[RedisStore] = None


async def initialize_redis() -> RedisStore:
    """Initialize global Redis store for application lifespan.

    Should be called during FastAPI startup event.
    Creates connection pool and establishes Redis connection.

    Returns:
        Initialized RedisStore instance

    Example:
        @app.on_event("startup")
        async def startup_event():
            await initialize_redis()
    """
    global _redis_store

    if _redis_store is not None:
        logger.warning("Redis already initialized, skipping...")
        return _redis_store

    logger.info(f"Initializing Redis connection to {settings.REDIS_URL}")
    _redis_store = RedisStore(redis_url=settings.REDIS_URL)
    await _redis_store.connect()

    return _redis_store


async def close_redis() -> None:
    """Close global Redis store and cleanup resources.

    Should be called during FastAPI shutdown event.
    Gracefully closes all connections and releases pool.

    Example:
        @app.on_event("shutdown")
        async def shutdown_event():
            await close_redis()
    """
    global _redis_store

    if _redis_store is None:
        logger.warning("Redis not initialized, nothing to close")
        return

    logger.info("Closing Redis connection...")
    await _redis_store.disconnect()
    _redis_store = None


def get_redis_client() -> redis.Redis:
    """Get global Redis client instance.

    Returns:
        Redis client for executing commands

    Raises:
        RuntimeError: If Redis not initialized

    Example:
        client = get_redis_client()
        await client.set("key", "value")
    """
    if _redis_store is None:
        raise RuntimeError(
            "Redis not initialized. Call initialize_redis() first."
        )
    return _redis_store.client


def get_redis_store() -> RedisStore:
    """Get global RedisStore instance.

    Returns:
        RedisStore instance

    Raises:
        RuntimeError: If Redis not initialized
    """
    if _redis_store is None:
        raise RuntimeError(
            "Redis not initialized. Call initialize_redis() first."
        )
    return _redis_store
