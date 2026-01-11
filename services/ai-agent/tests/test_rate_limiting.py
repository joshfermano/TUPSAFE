"""Tests for rate limiting middleware."""

import pytest
import time
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from redis.asyncio import Redis

from src.api.middleware.rate_limiter import RateLimiter, TokenTracker


class TestRateLimiter:
    """Test rate limiting functionality."""

    @pytest.fixture
    async def mock_redis(self):
        """Create a mock Redis client."""
        redis_mock = AsyncMock(spec=Redis)
        redis_mock.zremrangebyscore = AsyncMock(return_value=0)
        redis_mock.zcard = AsyncMock(return_value=0)
        redis_mock.zadd = AsyncMock(return_value=1)
        redis_mock.expire = AsyncMock(return_value=True)
        redis_mock.zrange = AsyncMock(return_value=[])
        return redis_mock

    @pytest.fixture
    def rate_limiter(self, mock_redis):
        """Create rate limiter instance with mock Redis."""
        return RateLimiter(redis_client=mock_redis)

    async def test_check_rate_limit_within_limit(self, rate_limiter, mock_redis):
        """Test rate limit check when within limits."""
        mock_redis.zcard.return_value = 5  # 5 requests in window

        result = await rate_limiter.check_rate_limit(
            user_id="user123",
            role="admin",
            endpoint="chat",
            window="minute",
        )

        assert result["allowed"] is True
        assert result["remaining"] >= 0
        assert result["limit"] > 0
        assert "reset" in result

    async def test_check_rate_limit_exceeded(self, rate_limiter, mock_redis):
        """Test rate limit check when limit exceeded."""
        # Simulate limit exceeded (60 requests for admin per minute)
        mock_redis.zcard.return_value = 60
        mock_redis.zrange.return_value = [(str(time.time()), time.time())]

        with pytest.raises(HTTPException) as exc_info:
            await rate_limiter.check_rate_limit(
                user_id="user123",
                role="admin",
                endpoint="chat",
                window="minute",
            )

        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in str(exc_info.value.detail)

    async def test_check_rate_limit_disabled(self, mock_redis):
        """Test rate limiting when disabled."""
        rate_limiter = RateLimiter(redis_client=mock_redis)
        rate_limiter.enabled = False

        result = await rate_limiter.check_rate_limit(
            user_id="user123",
            role="admin",
            endpoint="chat",
            window="minute",
        )

        assert result["allowed"] is True
        assert result["remaining"] == 999999

    async def test_role_based_limits(self, rate_limiter):
        """Test different limits for different roles."""
        admin_limit, _ = rate_limiter._get_limit_for_role("admin", "minute")
        hr_limit, _ = rate_limiter._get_limit_for_role("hr", "minute")
        co_admin_limit, _ = rate_limiter._get_limit_for_role("co_admin", "minute")

        assert admin_limit > hr_limit
        assert hr_limit > co_admin_limit

    async def test_window_durations(self, rate_limiter):
        """Test different time windows."""
        _, minute_duration = rate_limiter._get_limit_for_role("admin", "minute")
        _, hour_duration = rate_limiter._get_limit_for_role("admin", "hour")
        _, day_duration = rate_limiter._get_limit_for_role("admin", "day")

        assert minute_duration == 60
        assert hour_duration == 3600
        assert day_duration == 86400

    async def test_sliding_window_cleanup(self, rate_limiter, mock_redis):
        """Test that old entries are removed from sliding window."""
        await rate_limiter.check_rate_limit(
            user_id="user123",
            role="admin",
            endpoint="chat",
            window="minute",
        )

        # Verify that old entries were removed
        mock_redis.zremrangebyscore.assert_called_once()

    async def test_rate_limit_headers(self, rate_limiter):
        """Test rate limit headers are added correctly."""
        response_mock = MagicMock()
        response_mock.headers = {}

        rate_limit_status = {
            "allowed": True,
            "remaining": 50,
            "reset": 1234567890,
            "limit": 60,
        }

        await rate_limiter.add_rate_limit_headers(response_mock, rate_limit_status)

        assert response_mock.headers["X-RateLimit-Limit"] == "60"
        assert response_mock.headers["X-RateLimit-Remaining"] == "50"
        assert response_mock.headers["X-RateLimit-Reset"] == "1234567890"


class TestTokenTracker:
    """Test token usage tracking functionality."""

    @pytest.fixture
    async def mock_redis(self):
        """Create a mock Redis client."""
        redis_mock = AsyncMock(spec=Redis)
        redis_mock.incrby = AsyncMock(return_value=1000)
        redis_mock.incrbyfloat = AsyncMock(return_value=0.5)
        redis_mock.expire = AsyncMock(return_value=True)
        redis_mock.get = AsyncMock(return_value=None)
        return redis_mock

    @pytest.fixture
    def token_tracker(self, mock_redis):
        """Create token tracker instance with mock Redis."""
        return TokenTracker(redis_client=mock_redis)

    async def test_track_tokens_within_limit(self, token_tracker, mock_redis):
        """Test token tracking when within limits."""
        mock_redis.incrby.return_value = 5000  # 5k tokens used
        mock_redis.incrbyfloat.return_value = 0.5  # $0.50 used

        result = await token_tracker.track_tokens(
            user_id="user123",
            model="anthropic/claude-sonnet-4",
            input_tokens=100,
            output_tokens=200,
        )

        assert result["tokens_used"] == 300
        assert result["cost"] > 0
        assert result["daily_tokens"] == 5000
        assert result["daily_cost"] == 0.5
        assert result["within_limits"] is True

    async def test_track_tokens_exceeds_token_limit(self, token_tracker, mock_redis):
        """Test token tracking when exceeding daily token limit."""
        mock_redis.incrby.return_value = 150000  # Exceeds 100k limit
        mock_redis.incrbyfloat.return_value = 2.0

        with pytest.raises(HTTPException) as exc_info:
            await token_tracker.track_tokens(
                user_id="user123",
                model="anthropic/claude-sonnet-4",
                input_tokens=50000,
                output_tokens=50000,
            )

        assert exc_info.value.status_code == 429
        assert "token or cost limit exceeded" in str(exc_info.value.detail).lower()

    async def test_track_tokens_exceeds_cost_limit(self, token_tracker, mock_redis):
        """Test token tracking when exceeding daily cost limit."""
        mock_redis.incrby.return_value = 50000  # Within token limit
        mock_redis.incrbyfloat.return_value = 15.0  # Exceeds $10 limit

        with pytest.raises(HTTPException) as exc_info:
            await token_tracker.track_tokens(
                user_id="user123",
                model="anthropic/claude-sonnet-4",
                input_tokens=25000,
                output_tokens=25000,
            )

        assert exc_info.value.status_code == 429
        assert "token or cost limit exceeded" in str(exc_info.value.detail).lower()

    async def test_get_daily_usage(self, token_tracker, mock_redis):
        """Test retrieving daily usage statistics."""
        mock_redis.get.side_effect = [5000, 1.25]  # tokens, cost

        result = await token_tracker.get_daily_usage("user123")

        assert result["daily_tokens"] == 5000
        assert result["daily_cost"] == 1.25
        assert result["max_tokens"] > 0
        assert result["max_cost"] > 0
        assert result["tokens_remaining"] >= 0
        assert result["cost_remaining"] >= 0

    async def test_get_daily_usage_no_usage(self, token_tracker, mock_redis):
        """Test retrieving daily usage when user has no usage."""
        mock_redis.get.return_value = None

        result = await token_tracker.get_daily_usage("user123")

        assert result["daily_tokens"] == 0
        assert result["daily_cost"] == 0.0
        assert result["tokens_remaining"] == result["max_tokens"]
        assert result["cost_remaining"] == result["max_cost"]

    async def test_token_costs_for_different_models(self, token_tracker):
        """Test that different models have different costs."""
        gpt4_costs = token_tracker.token_costs.get("gpt-4")
        gpt35_costs = token_tracker.token_costs.get("gpt-3.5-turbo")
        claude_costs = token_tracker.token_costs.get("anthropic/claude-sonnet-4")

        # Verify GPT-4 is more expensive than GPT-3.5
        assert gpt4_costs["input"] > gpt35_costs["input"]
        assert gpt4_costs["output"] > gpt35_costs["output"]

        # Verify Claude costs exist
        assert claude_costs is not None
        assert "input" in claude_costs
        assert "output" in claude_costs

    async def test_redis_key_format(self, token_tracker, mock_redis):
        """Test Redis key format for token tracking."""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        user_id = "user123"

        await token_tracker.track_tokens(
            user_id=user_id,
            model="anthropic/claude-sonnet-4",
            input_tokens=100,
            output_tokens=200,
        )

        # Verify correct keys were used
        expected_tokens_key = f"tokens:{user_id}:{today}"
        expected_cost_key = f"cost:{user_id}:{today}"

        assert mock_redis.incrby.call_args[0][0] == expected_tokens_key
        assert mock_redis.incrbyfloat.call_args[0][0] == expected_cost_key

    async def test_ttl_set_on_keys(self, token_tracker, mock_redis):
        """Test that TTL is set on Redis keys."""
        await token_tracker.track_tokens(
            user_id="user123",
            model="anthropic/claude-sonnet-4",
            input_tokens=100,
            output_tokens=200,
        )

        # Verify expire was called twice (once for tokens, once for cost)
        assert mock_redis.expire.call_count == 2
        # Verify TTL is 2 days (172800 seconds)
        for call in mock_redis.expire.call_args_list:
            assert call[0][1] == 172800


class TestRateLimitingIntegration:
    """Integration tests for rate limiting."""

    async def test_multiple_requests_sliding_window(self):
        """Test sliding window behavior with multiple requests."""
        # This would require a real Redis instance or more complex mocking
        # For now, we'll skip this as it's better suited for integration tests
        pass

    async def test_rate_limit_reset(self):
        """Test that rate limits reset after window expires."""
        # This would require time-based testing with real Redis
        pass

    async def test_concurrent_requests(self):
        """Test rate limiting under concurrent load."""
        # This would require load testing infrastructure
        pass
