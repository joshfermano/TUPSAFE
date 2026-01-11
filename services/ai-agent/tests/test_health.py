"""Tests for health check endpoints.

Tests the health, readiness, and liveness endpoints to ensure
proper monitoring and status reporting.
"""

import pytest
from datetime import datetime
from httpx import AsyncClient
from fastapi.testclient import TestClient


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Test suite for health check endpoints."""

    async def test_health_endpoint_returns_ok(self, async_client: AsyncClient):
        """Test that health endpoint returns 200 OK status.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    async def test_health_returns_version(self, async_client: AsyncClient):
        """Test that health endpoint includes version information.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "app" in data
        assert data["app"] == "TUPSAFE AI Agent"

    async def test_health_returns_timestamp(self, async_client: AsyncClient):
        """Test that health endpoint includes ISO format timestamp.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data

        # Verify timestamp is valid ISO format
        timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
        assert isinstance(timestamp, datetime)

    async def test_readiness_check_returns_ready(self, async_client: AsyncClient):
        """Test that readiness endpoint returns ready status.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert "timestamp" in data

    async def test_liveness_check_returns_alive(self, async_client: AsyncClient):
        """Test that liveness endpoint returns alive status.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data

    async def test_health_response_structure(self, async_client: AsyncClient):
        """Test that health response has expected structure.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()

        # Verify all expected fields are present
        required_fields = ["status", "app", "version", "timestamp"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

    async def test_health_content_type(self, async_client: AsyncClient):
        """Test that health endpoint returns JSON content type.

        Args:
            async_client: Async HTTP client fixture.
        """
        response = await async_client.get("/health")

        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]


class TestHealthEndpointsSync:
    """Synchronous tests for health check endpoints."""

    def test_health_endpoint_sync(self, sync_client: TestClient):
        """Test health endpoint with synchronous client.

        Args:
            sync_client: Synchronous test client fixture.
        """
        response = sync_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data

    def test_readiness_endpoint_sync(self, sync_client: TestClient):
        """Test readiness endpoint with synchronous client.

        Args:
            sync_client: Synchronous test client fixture.
        """
        response = sync_client.get("/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"

    def test_liveness_endpoint_sync(self, sync_client: TestClient):
        """Test liveness endpoint with synchronous client.

        Args:
            sync_client: Synchronous test client fixture.
        """
        response = sync_client.get("/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
