"""LLM response caching using Redis.

Implements hash-based caching for LLM responses to reduce API calls,
improve response times, and optimize costs for repeated queries.
"""

import hashlib
import json
import logging
from typing import Any, Optional

from .redis_store import get_redis_client

logger = logging.getLogger(__name__)

# Redis key prefix for response cache
CACHE_KEY_PREFIX = "tupsafe:cache"

# Default TTL for cached responses (1 hour)
DEFAULT_CACHE_TTL = 3600


class ResponseCache:
    """Redis-backed LLM response cache.

    Caches LLM responses based on query hash to avoid redundant API calls.
    Implements configurable TTL and cache invalidation strategies.

    Key format: tupsafe:cache:{query_hash}
    """

    def __init__(self, ttl: int = DEFAULT_CACHE_TTL):
        """Initialize response cache.

        Args:
            ttl: Time-to-live for cached responses in seconds (default: 1 hour)
        """
        self.ttl = ttl

    def _get_cache_key(self, query_hash: str) -> str:
        """Generate Redis key for cached response.

        Args:
            query_hash: Hash of the query

        Returns:
            Redis key string
        """
        return f"{CACHE_KEY_PREFIX}:{query_hash}"

    def _hash_query(
        self,
        query: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> str:
        """Generate hash for query and parameters.

        Args:
            query: Query text
            model: Model identifier
            temperature: Model temperature
            **kwargs: Additional parameters to include in hash

        Returns:
            SHA-256 hash string
        """
        # Create cache key from query and relevant parameters
        cache_data = {
            "query": query,
            "model": model,
            "temperature": temperature,
            **kwargs,
        }

        # Sort keys for consistent hashing
        cache_json = json.dumps(cache_data, sort_keys=True)

        # Generate SHA-256 hash
        hash_object = hashlib.sha256(cache_json.encode())
        return hash_object.hexdigest()

    async def cache_response(
        self,
        query: str,
        response: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        metadata: Optional[dict[str, Any]] = None,
        **kwargs: Any,
    ) -> str:
        """Cache LLM response.

        Args:
            query: Query text
            response: LLM response to cache
            model: Model identifier
            temperature: Model temperature
            metadata: Optional metadata to store with response
            **kwargs: Additional parameters for cache key

        Returns:
            Query hash used for caching
        """
        try:
            client = get_redis_client()

            # Generate query hash
            query_hash = self._hash_query(
                query=query,
                model=model,
                temperature=temperature,
                **kwargs,
            )

            # Prepare cache data
            cache_data = {
                "query": query,
                "response": response,
                "model": model,
                "temperature": temperature,
                "metadata": metadata or {},
                "cached_at": self._get_timestamp(),
            }

            # Store in Redis with TTL
            key = self._get_cache_key(query_hash)
            await client.setex(
                key,
                self.ttl,
                json.dumps(cache_data),
            )

            logger.debug(
                f"Cached response for query hash {query_hash[:8]}... "
                f"(TTL: {self.ttl}s)"
            )

            return query_hash

        except Exception as e:
            logger.error(f"Error caching response: {e}")
            raise

    async def get_cached_response(
        self,
        query: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> Optional[dict[str, Any]]:
        """Retrieve cached LLM response.

        Args:
            query: Query text
            model: Model identifier
            temperature: Model temperature
            **kwargs: Additional parameters for cache key

        Returns:
            Cached response data or None if not found
        """
        try:
            client = get_redis_client()

            # Generate query hash
            query_hash = self._hash_query(
                query=query,
                model=model,
                temperature=temperature,
                **kwargs,
            )

            # Retrieve from Redis
            key = self._get_cache_key(query_hash)
            data = await client.get(key)

            if not data:
                logger.debug(f"Cache miss for query hash {query_hash[:8]}...")
                return None

            cache_data = json.loads(data)
            logger.debug(f"Cache hit for query hash {query_hash[:8]}...")

            return cache_data

        except Exception as e:
            logger.error(f"Error retrieving cached response: {e}")
            return None

    async def invalidate_cache(
        self,
        query: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> bool:
        """Invalidate specific cached response.

        Args:
            query: Query text
            model: Model identifier
            temperature: Model temperature
            **kwargs: Additional parameters for cache key

        Returns:
            True if cache entry was deleted, False otherwise
        """
        try:
            client = get_redis_client()

            query_hash = self._hash_query(
                query=query,
                model=model,
                temperature=temperature,
                **kwargs,
            )

            key = self._get_cache_key(query_hash)
            deleted = await client.delete(key)

            if deleted:
                logger.info(f"Invalidated cache for query hash {query_hash[:8]}...")
                return True

            return False

        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")
            return False

    async def clear_all_cache(self) -> int:
        """Clear all cached responses.

        Returns:
            Number of cache entries deleted
        """
        try:
            client = get_redis_client()
            pattern = f"{CACHE_KEY_PREFIX}:*"

            cursor = 0
            deleted_count = 0

            while True:
                cursor, keys = await client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )

                if keys:
                    deleted = await client.delete(*keys)
                    deleted_count += deleted

                if cursor == 0:
                    break

            logger.info(f"Cleared {deleted_count} cache entries")
            return deleted_count

        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return 0

    async def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics.

        Returns:
            Dict with cache statistics (total entries, memory usage)
        """
        try:
            client = get_redis_client()
            pattern = f"{CACHE_KEY_PREFIX}:*"

            cursor = 0
            total_entries = 0
            total_memory_bytes = 0

            while True:
                cursor, keys = await client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )

                total_entries += len(keys)

                # Estimate memory usage
                for key in keys:
                    data = await client.get(key)
                    if data:
                        total_memory_bytes += len(data.encode())

                if cursor == 0:
                    break

            return {
                "total_entries": total_entries,
                "total_memory_bytes": total_memory_bytes,
                "total_memory_mb": round(total_memory_bytes / (1024 * 1024), 2),
            }

        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {
                "total_entries": 0,
                "total_memory_bytes": 0,
                "total_memory_mb": 0.0,
                "error": str(e),
            }

    async def update_cache_ttl(
        self,
        query: str,
        new_ttl: int,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs: Any,
    ) -> bool:
        """Update TTL for cached response.

        Args:
            query: Query text
            new_ttl: New time-to-live in seconds
            model: Model identifier
            temperature: Model temperature
            **kwargs: Additional parameters for cache key

        Returns:
            True if TTL was updated, False otherwise
        """
        try:
            client = get_redis_client()

            query_hash = self._hash_query(
                query=query,
                model=model,
                temperature=temperature,
                **kwargs,
            )

            key = self._get_cache_key(query_hash)
            updated = await client.expire(key, new_ttl)

            if updated:
                logger.debug(
                    f"Updated TTL for query hash {query_hash[:8]}... to {new_ttl}s"
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Error updating cache TTL: {e}")
            return False

    @staticmethod
    def _get_timestamp() -> str:
        """Get current UTC timestamp.

        Returns:
            ISO format timestamp string
        """
        from datetime import datetime
        return datetime.utcnow().isoformat()


class ConversationMemory:
    """Unified conversation memory combining checkpoints and chat history.

    High-level interface for managing conversation state, chat history,
    and response caching in a single API.
    """

    def __init__(
        self,
        checkpoint_ttl: int = 86400,  # 24 hours
        chat_ttl: int = 604800,  # 7 days
        cache_ttl: int = 3600,  # 1 hour
    ):
        """Initialize conversation memory.

        Args:
            checkpoint_ttl: TTL for checkpoints in seconds
            chat_ttl: TTL for chat history in seconds
            cache_ttl: TTL for response cache in seconds
        """
        from .checkpointer import RedisCheckpointer
        from .chat_history import RedisChatHistory

        self.checkpointer = RedisCheckpointer(ttl=checkpoint_ttl)
        self.chat_history = RedisChatHistory(ttl=chat_ttl)
        self.response_cache = ResponseCache(ttl=cache_ttl)

    async def add_exchange(
        self,
        session_id: str,
        user_message: str,
        assistant_message: str,
    ) -> None:
        """Add user-assistant exchange to chat history.

        Args:
            session_id: Chat session identifier
            user_message: User's message
            assistant_message: Assistant's response
        """
        await self.chat_history.add_messages(
            session_id=session_id,
            messages=[
                ("user", user_message),
                ("assistant", assistant_message),
            ],
        )

    async def get_conversation_context(
        self,
        session_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Get recent conversation context.

        Args:
            session_id: Chat session identifier
            limit: Number of recent messages to retrieve

        Returns:
            List of recent messages
        """
        return await self.chat_history.get_messages(
            session_id=session_id,
            limit=limit,
        )

    async def clear_conversation(self, session_id: str) -> None:
        """Clear all conversation data for session.

        Args:
            session_id: Chat session identifier
        """
        await self.chat_history.clear_history(session_id)
        # Note: Checkpoints use thread_id, which may differ from session_id
        # Caller should handle checkpoint deletion separately if needed
