"""Pytest fixtures and configuration for TUPSAFE AI Agent tests.

This module provides reusable fixtures for testing the AI Agent service,
including mock clients, test data, and async test utilities.
"""

import os
from typing import AsyncGenerator, Any
from unittest.mock import AsyncMock, Mock, patch

import httpx
import jwt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import app as fastapi_app
from src.tools.mcp_client import SupabaseMCPClient, MCPQueryResult
from src.agents.tupsafe_agent import TUPSAFEAgent


# ============================================================================
# Settings and Configuration Fixtures
# ============================================================================


@pytest.fixture
def mock_settings() -> Settings:
    """Mock application settings for testing.

    Returns:
        Settings object with test configuration.
    """
    return Settings(
        APP_NAME="TUPSAFE AI Agent Test",
        APP_VERSION="0.1.0-test",
        DEBUG=True,
        SUPABASE_URL="https://test.supabase.co",
        SUPABASE_ANON_KEY="test-anon-key",
        SUPABASE_SERVICE_ROLE_KEY="test-service-role-key",
        SUPABASE_JWT_SECRET="test-jwt-secret",
        OPENAI_API_KEY="test-openai-key",
        OPENROUTER_API_KEY="test-openrouter-key",
        GOOGLE_API_KEY="test-google-key",
        GROQ_API_KEY="test-groq-key",
        DEFAULT_LLM_PROVIDER="openrouter",
        DEFAULT_LLM_MODEL="anthropic/claude-sonnet-4",
        REDIS_URL="redis://localhost:6379",
        ALLOWED_ORIGINS=["http://localhost:3001"],
        RATE_LIMIT_REQUESTS=100,
        RATE_LIMIT_WINDOW=3600,
        HOST="0.0.0.0",
        PORT=8000,
        LOG_LEVEL="INFO",
    )


@pytest.fixture
def override_settings(mock_settings: Settings):
    """Override settings with mock values for tests.

    Args:
        mock_settings: Mock settings fixture.

    Yields:
        Context with overridden settings.
    """
    with patch("src.config.settings.settings", mock_settings):
        yield mock_settings


# ============================================================================
# HTTP Client Fixtures
# ============================================================================


@pytest.fixture
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Async HTTP client for testing FastAPI endpoints.

    Yields:
        Configured AsyncClient instance.
    """
    async with httpx.AsyncClient(
        app=fastapi_app,
        base_url="http://testserver",
        timeout=30.0,
    ) as client:
        yield client


@pytest.fixture
def sync_client() -> TestClient:
    """Synchronous test client for FastAPI.

    Returns:
        TestClient instance for synchronous tests.
    """
    return TestClient(fastapi_app)


# ============================================================================
# Authentication Fixtures
# ============================================================================


@pytest.fixture
def sample_user() -> dict[str, Any]:
    """Sample user data for testing.

    Returns:
        Dictionary containing user information.
    """
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "admin@tup.edu.ph",
        "role": "admin",
        "user_type": "employee",
        "metadata": {
            "first_name": "Test",
            "last_name": "Admin",
            "department": "Human Resources",
        },
    }


@pytest.fixture
def valid_jwt_token(mock_settings: Settings, sample_user: dict[str, Any]) -> str:
    """Generate a valid JWT token for testing.

    Args:
        mock_settings: Mock settings fixture.
        sample_user: Sample user data.

    Returns:
        Valid JWT token string.
    """
    payload = {
        "sub": sample_user["id"],
        "email": sample_user["email"],
        "aud": "authenticated",
        "user_metadata": sample_user["metadata"],
        "app_metadata": {"role": sample_user["role"]},
    }

    return jwt.encode(
        payload,
        mock_settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )


@pytest.fixture
def invalid_jwt_token() -> str:
    """Generate an invalid JWT token for testing.

    Returns:
        Invalid JWT token string.
    """
    return "invalid.jwt.token"


@pytest.fixture
def auth_headers(valid_jwt_token: str) -> dict[str, str]:
    """HTTP headers with valid authentication token.

    Args:
        valid_jwt_token: Valid JWT token fixture.

    Returns:
        Dictionary of HTTP headers with Bearer token.
    """
    return {
        "Authorization": f"Bearer {valid_jwt_token}",
        "Content-Type": "application/json",
    }


# ============================================================================
# MCP Client Fixtures
# ============================================================================


@pytest.fixture
def mock_mcp_query_result() -> MCPQueryResult:
    """Mock MCP query result for testing.

    Returns:
        MCPQueryResult with sample data.
    """
    return MCPQueryResult(
        success=True,
        data=[
            {"count": 100, "status": "approved"},
            {"count": 50, "status": "pending"},
        ],
        row_count=2,
    )


@pytest.fixture
def mock_mcp_client(mock_mcp_query_result: MCPQueryResult) -> AsyncMock:
    """Mock Supabase MCP client for testing.

    Args:
        mock_mcp_query_result: Mock query result fixture.

    Returns:
        AsyncMock of SupabaseMCPClient.
    """
    mock_client = AsyncMock(spec=SupabaseMCPClient)
    mock_client.execute_sql.return_value = mock_mcp_query_result
    mock_client.health_check.return_value = True
    mock_client.initialize.return_value = None
    mock_client.close.return_value = None
    return mock_client


@pytest.fixture
async def mcp_client_context(mock_mcp_client: AsyncMock):
    """Context manager for MCP client testing.

    Args:
        mock_mcp_client: Mock MCP client fixture.

    Yields:
        Context with mock MCP client.
    """
    with patch("src.tools.mcp_client.get_mcp_client", return_value=mock_mcp_client):
        yield mock_mcp_client


# ============================================================================
# Redis Fixtures
# ============================================================================


@pytest.fixture
def mock_redis() -> AsyncMock:
    """Mock Redis client for testing.

    Returns:
        AsyncMock of Redis client.
    """
    mock = AsyncMock()
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = True
    mock.incr.return_value = 1
    mock.expire.return_value = True
    return mock


@pytest.fixture
async def redis_context(mock_redis: AsyncMock):
    """Context manager for Redis testing.

    Args:
        mock_redis: Mock Redis client fixture.

    Yields:
        Context with mock Redis client.
    """
    with patch("redis.asyncio.from_url", return_value=mock_redis):
        yield mock_redis


# ============================================================================
# Agent Fixtures
# ============================================================================


@pytest.fixture
def mock_llm_response() -> dict[str, Any]:
    """Mock LLM response for testing.

    Returns:
        Dictionary containing mock LLM response.
    """
    return {
        "messages": [
            {
                "type": "ai",
                "content": "Based on the data, there are 150 total employees.",
            }
        ],
        "metadata": {
            "model": "anthropic/claude-sonnet-4",
            "tokens": {"prompt": 100, "completion": 50},
        },
    }


@pytest.fixture
def mock_agent(mock_llm_response: dict[str, Any]) -> AsyncMock:
    """Mock TUPSAFE Agent for testing.

    Args:
        mock_llm_response: Mock LLM response fixture.

    Returns:
        AsyncMock of TUPSAFEAgent.
    """
    mock = AsyncMock(spec=TUPSAFEAgent)
    mock.ainvoke.return_value = mock_llm_response
    mock.astream.return_value = iter([mock_llm_response])
    mock.astream_events.return_value = iter([
        {
            "event": "on_chat_model_stream",
            "data": {"chunk": {"content": "Based on the data"}},
        }
    ])
    return mock


# ============================================================================
# Database Test Data Fixtures
# ============================================================================


@pytest.fixture
def sample_employee_data() -> list[dict[str, Any]]:
    """Sample employee data for testing.

    Returns:
        List of employee records.
    """
    return [
        {
            "id": "emp-1",
            "email": "emp1@tup.edu.ph",
            "user_type": "employee",
            "employment_category": "faculty",
            "is_active": True,
            "account_status": "active",
        },
        {
            "id": "emp-2",
            "email": "emp2@tup.edu.ph",
            "user_type": "employee",
            "employment_category": "administrative",
            "is_active": True,
            "account_status": "active",
        },
    ]


@pytest.fixture
def sample_submission_data() -> list[dict[str, Any]]:
    """Sample submission data for testing.

    Returns:
        List of submission records.
    """
    return [
        {
            "id": "sub-1",
            "user_id": "emp-1",
            "type": "saln",
            "year": 2025,
            "status": "approved",
        },
        {
            "id": "sub-2",
            "user_id": "emp-2",
            "type": "pds",
            "status": "pending",
        },
    ]


@pytest.fixture
def sample_compliance_data() -> dict[str, Any]:
    """Sample compliance metrics for testing.

    Returns:
        Dictionary with compliance statistics.
    """
    return {
        "total_employees": 150,
        "employees_compliant": 120,
        "employees_pending": 20,
        "employees_non_compliant": 10,
        "compliance_rate": 80.0,
        "submission_rate": 93.33,
    }


# ============================================================================
# Pytest Configuration
# ============================================================================


@pytest.fixture(scope="session")
def anyio_backend():
    """Configure anyio backend for async tests.

    Returns:
        Backend name for anyio.
    """
    return "asyncio"


def pytest_configure(config):
    """Configure pytest with custom markers.

    Args:
        config: Pytest configuration object.
    """
    config.addinivalue_line("markers", "asyncio: mark test as async")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")
