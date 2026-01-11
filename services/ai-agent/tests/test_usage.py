"""Tests for usage tracking endpoints."""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from datetime import datetime

from src.main import app


class TestUsageEndpoints:
    """Test usage tracking API endpoints."""

    @pytest.fixture
    async def client(self):
        """Create test client."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.fixture
    def mock_token_tracker(self):
        """Create mock token tracker."""
        tracker = AsyncMock()
        tracker.get_daily_usage.return_value = {
            "daily_tokens": 15000,
            "daily_cost": 0.45,
            "max_tokens": 100000,
            "max_cost": 10.0,
            "tokens_remaining": 85000,
            "cost_remaining": 9.55,
        }
        return tracker

    @pytest.fixture
    def mock_auth_user(self):
        """Create mock authenticated user."""
        return {
            "id": "user123",
            "email": "admin@tup.edu.ph",
            "role": "admin",
            "metadata": {},
        }

    async def test_get_daily_usage_success(
        self, client, mock_token_tracker, mock_auth_user
    ):
        """Test successful retrieval of daily usage statistics."""
        with patch("src.api.routes.usage.get_token_tracker", return_value=mock_token_tracker):
            with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
                response = await client.get(
                    "/api/usage/daily",
                    headers={"Authorization": "Bearer valid_token"},
                )

                assert response.status_code == 200
                data = response.json()

                assert data["daily_tokens"] == 15000
                assert data["daily_cost"] == 0.45
                assert data["max_tokens"] == 100000
                assert data["max_cost"] == 10.0
                assert data["tokens_remaining"] == 85000
                assert data["cost_remaining"] == 9.55
                assert "date" in data
                assert data["user_id"] == "user123"
                assert data["role"] == "admin"

    async def test_get_daily_usage_no_usage(
        self, client, mock_token_tracker, mock_auth_user
    ):
        """Test daily usage when user has no usage yet."""
        mock_token_tracker.get_daily_usage.return_value = {
            "daily_tokens": 0,
            "daily_cost": 0.0,
            "max_tokens": 100000,
            "max_cost": 10.0,
            "tokens_remaining": 100000,
            "cost_remaining": 10.0,
        }

        with patch("src.api.routes.usage.get_token_tracker", return_value=mock_token_tracker):
            with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
                response = await client.get(
                    "/api/usage/daily",
                    headers={"Authorization": "Bearer valid_token"},
                )

                assert response.status_code == 200
                data = response.json()

                assert data["daily_tokens"] == 0
                assert data["daily_cost"] == 0.0
                assert data["tokens_remaining"] == 100000
                assert data["cost_remaining"] == 10.0

    async def test_get_daily_usage_unauthorized(self, client):
        """Test daily usage endpoint without authentication."""
        response = await client.get("/api/usage/daily")
        assert response.status_code == 403  # No Authorization header

    async def test_get_rate_limits_admin(self, client, mock_auth_user):
        """Test rate limits endpoint for admin role."""
        with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
            response = await client.get(
                "/api/usage/limits",
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 200
            data = response.json()

            assert data["role"] == "admin"
            assert "rate_limits" in data
            assert "token_limits" in data
            assert "cost_limits" in data

            # Admin should have highest limits
            assert data["rate_limits"]["per_minute"] >= 60
            assert data["rate_limits"]["per_hour"] >= 2000

            assert data["token_limits"]["max_tokens_per_request"] > 0
            assert data["token_limits"]["max_tokens_per_day"] > 0
            assert data["cost_limits"]["max_cost_per_day"] > 0

    async def test_get_rate_limits_hr(self, client, mock_auth_user):
        """Test rate limits endpoint for HR role."""
        mock_auth_user["role"] = "hr"

        with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
            response = await client.get(
                "/api/usage/limits",
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 200
            data = response.json()

            assert data["role"] == "hr"
            # HR should have lower limits than admin
            assert data["rate_limits"]["per_minute"] >= 40
            assert data["rate_limits"]["per_hour"] >= 1500

    async def test_get_rate_limits_co_admin(self, client, mock_auth_user):
        """Test rate limits endpoint for co_admin role."""
        mock_auth_user["role"] = "co_admin"

        with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
            response = await client.get(
                "/api/usage/limits",
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 200
            data = response.json()

            assert data["role"] == "co_admin"
            # Co-admin should have lowest limits
            assert data["rate_limits"]["per_minute"] >= 30
            assert data["rate_limits"]["per_hour"] >= 1000

    async def test_get_rate_limits_unauthorized(self, client):
        """Test rate limits endpoint without authentication."""
        response = await client.get("/api/usage/limits")
        assert response.status_code == 403  # No Authorization header

    async def test_date_format_in_daily_usage(
        self, client, mock_token_tracker, mock_auth_user
    ):
        """Test that date is in correct format."""
        with patch("src.api.routes.usage.get_token_tracker", return_value=mock_token_tracker):
            with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
                response = await client.get(
                    "/api/usage/daily",
                    headers={"Authorization": "Bearer valid_token"},
                )

                assert response.status_code == 200
                data = response.json()

                # Verify date format (YYYY-MM-DD)
                date_str = data["date"]
                try:
                    datetime.strptime(date_str, "%Y-%m-%d")
                except ValueError:
                    pytest.fail(f"Invalid date format: {date_str}")

    async def test_usage_endpoint_error_handling(
        self, client, mock_token_tracker, mock_auth_user
    ):
        """Test error handling in usage endpoint."""
        mock_token_tracker.get_daily_usage.side_effect = Exception("Redis connection failed")

        with patch("src.api.routes.usage.get_token_tracker", return_value=mock_token_tracker):
            with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
                response = await client.get(
                    "/api/usage/daily",
                    headers={"Authorization": "Bearer valid_token"},
                )

                assert response.status_code == 500
                data = response.json()
                assert "error" in str(data).lower()

    async def test_limits_endpoint_structure(self, client, mock_auth_user):
        """Test that limits endpoint returns complete structure."""
        with patch("src.api.routes.usage.get_current_user", return_value=mock_auth_user):
            response = await client.get(
                "/api/usage/limits",
                headers={"Authorization": "Bearer valid_token"},
            )

            assert response.status_code == 200
            data = response.json()

            # Verify structure
            assert "role" in data
            assert "rate_limits" in data
            assert "per_minute" in data["rate_limits"]
            assert "per_hour" in data["rate_limits"]

            assert "token_limits" in data
            assert "max_tokens_per_request" in data["token_limits"]
            assert "max_tokens_per_day" in data["token_limits"]

            assert "cost_limits" in data
            assert "max_cost_per_day" in data["cost_limits"]

            # Verify all values are positive numbers
            assert data["rate_limits"]["per_minute"] > 0
            assert data["rate_limits"]["per_hour"] > 0
            assert data["token_limits"]["max_tokens_per_request"] > 0
            assert data["token_limits"]["max_tokens_per_day"] > 0
            assert data["cost_limits"]["max_cost_per_day"] > 0
