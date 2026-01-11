"""
Redis-based rate limiting middleware for TUPSAFE AI Agent.

Implements:
- Sliding window rate limiting
- Role-based limits
- Per-user and global limits
- Token/cost tracking
"""

import logging
import time
from typing import Literal, Optional
from datetime import datetime

from fastapi import HTTPException, status
from redis.asyncio import Redis

from ...config import settings
from ...memory import get_redis_client

logger = logging.getLogger(__name__)


class RateLimiter:
    """Redis-based rate limiter with sliding window algorithm."""

    def __init__(self, redis_client: Optional[Redis] = None):
        """Initialize rate limiter.

        Args:
            redis_client: Redis client for rate limit storage
        """
        try:
            self.redis = redis_client or get_redis_client()
            self.enabled = settings.rate_limits.ENABLED
        except Exception:
            self.redis = None
            self.enabled = False

    async def check_rate_limit(
        self,
        user_id: str,
        role: str,
        endpoint: str = "default",
        window: Literal["minute", "hour", "day"] = "minute",
    ) -> dict:
        """Check if user has exceeded rate limit.

        Args:
            user_id: User identifier
            role: User role (admin, hr, co_admin)
            endpoint: API endpoint identifier
            window: Time window for rate limiting

        Returns:
            Dict with rate limit status:
                - allowed: Boolean
                - remaining: Requests remaining
                - reset: Unix timestamp when limit resets
                - limit: Total allowed requests

        Raises:
            HTTPException: If rate limit exceeded
        """
        if not self.enabled or self.redis is None:
            return {"allowed": True, "remaining": 999999, "reset": 0, "limit": 999999}

        # Get limits based on role
        limit, window_seconds = self._get_limit_for_role(role, window)

        # Redis key for rate limiting
        key = f"rate_limit:{user_id}:{endpoint}:{window}"

        # Use sliding window counter
        current_time = time.time()
        window_start = current_time - window_seconds

        # Remove old entries outside window
        await self.redis.zremrangebyscore(key, 0, window_start)

        # Count requests in current window
        current_count = await self.redis.zcard(key)

        if current_count >= limit:
            # Get oldest request timestamp to calculate reset time
            oldest = await self.redis.zrange(key, 0, 0, withscores=True)
            reset_timestamp = (
                int(oldest[0][1] + window_seconds)
                if oldest
                else int(current_time + window_seconds)
            )

            logger.warning(
                f"Rate limit exceeded for user {user_id} ({role}): "
                f"{current_count}/{limit} requests in {window}"
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": limit,
                    "window": window,
                    "reset": reset_timestamp,
                    "retry_after": reset_timestamp - int(current_time),
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_timestamp),
                    "Retry-After": str(reset_timestamp - int(current_time)),
                },
            )

        # Add current request to window
        await self.redis.zadd(key, {str(current_time): current_time})

        # Set expiration on key (window duration + buffer)
        await self.redis.expire(key, window_seconds + 60)

        remaining = limit - current_count - 1
        reset_timestamp = int(current_time + window_seconds)

        return {
            "allowed": True,
            "remaining": remaining,
            "reset": reset_timestamp,
            "limit": limit,
        }

    def _get_limit_for_role(
        self, role: str, window: Literal["minute", "hour", "day"]
    ) -> tuple[int, int]:
        """Get rate limit and window duration for role.

        Args:
            role: User role
            window: Time window

        Returns:
            Tuple of (limit, window_seconds)
        """
        rate_limits = settings.rate_limits

        # Role-based limits from settings
        role_limits = {
            "admin": {
                "minute": (rate_limits.ADMIN_RATE_LIMIT_PER_MINUTE, 60),
                "hour": (rate_limits.ADMIN_RATE_LIMIT_PER_HOUR, 3600),
                "day": (rate_limits.ADMIN_RATE_LIMIT_PER_HOUR * 24, 86400),
            },
            "hr": {
                "minute": (rate_limits.HR_RATE_LIMIT_PER_MINUTE, 60),
                "hour": (rate_limits.HR_RATE_LIMIT_PER_HOUR, 3600),
                "day": (rate_limits.HR_RATE_LIMIT_PER_HOUR * 24, 86400),
            },
            "co_admin": {
                "minute": (rate_limits.CO_ADMIN_RATE_LIMIT_PER_MINUTE, 60),
                "hour": (rate_limits.CO_ADMIN_RATE_LIMIT_PER_HOUR, 3600),
                "day": (rate_limits.CO_ADMIN_RATE_LIMIT_PER_HOUR * 24, 86400),
            },
        }

        # Default to co_admin limits if role not found
        return role_limits.get(role, role_limits["co_admin"])[window]

    async def add_rate_limit_headers(self, response, rate_limit_status: dict):
        """Add rate limit headers to response.

        Args:
            response: FastAPI response object
            rate_limit_status: Rate limit status dict
        """
        response.headers["X-RateLimit-Limit"] = str(rate_limit_status["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate_limit_status["remaining"])
        response.headers["X-RateLimit-Reset"] = str(rate_limit_status["reset"])


class TokenTracker:
    """Track token usage and costs per user."""

    def __init__(self, redis_client: Optional[Redis] = None):
        """Initialize token tracker.

        Args:
            redis_client: Redis client for token tracking
        """
        try:
            self.redis = redis_client or get_redis_client()
        except Exception:
            self.redis = None

        # Token costs per model (approximate, update based on actual pricing)
        self.token_costs = {
            # OpenAI
            "gpt-4": {"input": 0.03 / 1000, "output": 0.06 / 1000},
            "gpt-4-turbo": {"input": 0.01 / 1000, "output": 0.03 / 1000},
            "gpt-3.5-turbo": {"input": 0.0005 / 1000, "output": 0.0015 / 1000},
            # Anthropic (via OpenRouter)
            "anthropic/claude-3.5-sonnet": {
                "input": 0.003 / 1000,
                "output": 0.015 / 1000,
            },
            "anthropic/claude-sonnet-4": {"input": 0.003 / 1000, "output": 0.015 / 1000},
            "anthropic/claude-3-haiku": {
                "input": 0.00025 / 1000,
                "output": 0.00125 / 1000,
            },
            # Groq (much cheaper)
            "groq/llama-3.1-70b": {"input": 0.00059 / 1000, "output": 0.00079 / 1000},
            "groq/mixtral-8x7b": {"input": 0.00024 / 1000, "output": 0.00024 / 1000},
            # Google
            "google/gemini-pro": {"input": 0.00025 / 1000, "output": 0.0005 / 1000},
        }

    async def track_tokens(
        self,
        user_id: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> dict:
        """Track token usage for user.

        Args:
            user_id: User identifier
            model: LLM model identifier
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens

        Returns:
            Dict with tracking info:
                - tokens_used: Total tokens used
                - cost: Estimated cost
                - daily_tokens: Total tokens used today
                - daily_cost: Total cost today
                - within_limits: Boolean

        Raises:
            HTTPException: If user exceeds daily limits
        """
        # If Redis is not available, skip tracking
        if self.redis is None:
            total_tokens = input_tokens + output_tokens
            return {
                "tokens_used": total_tokens,
                "cost": 0.0,
                "daily_tokens": total_tokens,
                "daily_cost": 0.0,
                "within_limits": True,
            }

        # Calculate cost
        cost_info = self.token_costs.get(
            model, {"input": 0.001 / 1000, "output": 0.002 / 1000}
        )
        cost = (input_tokens * cost_info["input"]) + (
            output_tokens * cost_info["output"]
        )
        total_tokens = input_tokens + output_tokens

        # Redis keys for daily tracking
        today = datetime.utcnow().strftime("%Y-%m-%d")
        tokens_key = f"tokens:{user_id}:{today}"
        cost_key = f"cost:{user_id}:{today}"

        # Increment counters
        daily_tokens = await self.redis.incrby(tokens_key, total_tokens)
        daily_cost = await self.redis.incrbyfloat(cost_key, cost)

        # Set expiration (keep for 2 days)
        await self.redis.expire(tokens_key, 172800)
        await self.redis.expire(cost_key, 172800)

        # Check limits from rate_limits settings
        max_tokens = settings.rate_limits.MAX_TOKENS_PER_USER_PER_DAY
        max_cost = settings.rate_limits.MAX_COST_PER_USER_PER_DAY

        within_limits = daily_tokens <= max_tokens and daily_cost <= max_cost

        if not within_limits:
            logger.warning(
                f"User {user_id} exceeded daily limits: "
                f"{daily_tokens}/{max_tokens} tokens, ${daily_cost:.2f}/${max_cost:.2f}"
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Daily token or cost limit exceeded",
                    "daily_tokens": daily_tokens,
                    "max_tokens": max_tokens,
                    "daily_cost": round(daily_cost, 2),
                    "max_cost": max_cost,
                    "reset": "Tomorrow at 00:00 UTC",
                },
            )

        # Log usage
        logger.info(
            f"Token usage - User: {user_id}, Model: {model}, "
            f"Tokens: {total_tokens} (in: {input_tokens}, out: {output_tokens}), "
            f"Cost: ${cost:.4f}, Daily: {daily_tokens} tokens, ${daily_cost:.4f}"
        )

        return {
            "tokens_used": total_tokens,
            "cost": cost,
            "daily_tokens": daily_tokens,
            "daily_cost": daily_cost,
            "within_limits": within_limits,
        }

    async def get_daily_usage(self, user_id: str) -> dict:
        """Get daily usage statistics for user.

        Args:
            user_id: User identifier

        Returns:
            Dict with daily usage stats
        """
        max_tokens = settings.rate_limits.MAX_TOKENS_PER_USER_PER_DAY
        max_cost = settings.rate_limits.MAX_COST_PER_USER_PER_DAY

        # If Redis is not available, return defaults
        if self.redis is None:
            return {
                "daily_tokens": 0,
                "daily_cost": 0.0,
                "max_tokens": max_tokens,
                "max_cost": max_cost,
                "tokens_remaining": max_tokens,
                "cost_remaining": max_cost,
            }

        today = datetime.utcnow().strftime("%Y-%m-%d")
        tokens_key = f"tokens:{user_id}:{today}"
        cost_key = f"cost:{user_id}:{today}"

        daily_tokens = await self.redis.get(tokens_key) or 0
        daily_cost = await self.redis.get(cost_key) or 0.0

        return {
            "daily_tokens": int(daily_tokens),
            "daily_cost": float(daily_cost),
            "max_tokens": max_tokens,
            "max_cost": max_cost,
            "tokens_remaining": max(0, max_tokens - int(daily_tokens)),
            "cost_remaining": max(0, max_cost - float(daily_cost)),
        }


# Global instances
_rate_limiter: Optional[RateLimiter] = None
_token_tracker: Optional[TokenTracker] = None


def get_rate_limiter() -> RateLimiter:
    """Get global rate limiter instance.

    Returns:
        RateLimiter instance
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


def get_token_tracker() -> TokenTracker:
    """Get global token tracker instance.

    Returns:
        TokenTracker instance
    """
    global _token_tracker
    if _token_tracker is None:
        _token_tracker = TokenTracker()
    return _token_tracker
