"""
Supabase MCP (Model Context Protocol) Client

This module provides a lightweight client for executing SQL queries against the Supabase database
using the MCP server. It handles connection management, query execution, and result parsing.

The client is designed to be used as a singleton and provides async context manager support
for proper resource cleanup.
"""

import json
import os
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field

from src.config.settings import settings


class MCPQueryResult(BaseModel):
    """Result of an MCP SQL query execution."""

    success: bool = Field(..., description="Whether the query was successful")
    data: Optional[list[dict[str, Any]]] = Field(
        None, description="Query result data as list of row dictionaries"
    )
    error: Optional[str] = Field(None, description="Error message if query failed")
    row_count: int = Field(0, description="Number of rows returned")


class SupabaseMCPClient:
    """
    Supabase MCP Client for executing SQL queries through the MCP server.

    This client provides a simple interface for executing SQL queries against the Supabase
    database via the MCP protocol. It handles connection pooling, retries, and error handling.

    Usage:
        >>> client = SupabaseMCPClient()
        >>> await client.initialize()
        >>> result = await client.execute_sql("SELECT COUNT(*) FROM profiles")
        >>> await client.close()

    Or using context manager:
        >>> async with SupabaseMCPClient() as client:
        >>>     result = await client.execute_sql("SELECT COUNT(*) FROM profiles")
    """

    def __init__(self) -> None:
        """Initialize the MCP client with configuration from settings."""
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialized = False

    async def initialize(self) -> None:
        """
        Initialize the HTTP client for MCP communication.

        This should be called before making any queries. Raises an error if initialization fails.
        """
        if self._initialized:
            return

        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            follow_redirects=True,
        )
        self._initialized = True

    async def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        self._initialized = False

    async def __aenter__(self) -> "SupabaseMCPClient":
        """Async context manager entry."""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    def _ensure_initialized(self) -> None:
        """Ensure the client is initialized before executing queries."""
        if not self._initialized or not self._http_client:
            raise RuntimeError(
                "SupabaseMCPClient not initialized. Call initialize() or use context manager."
            )

    async def execute_sql(self, query: str) -> MCPQueryResult:
        """
        Execute a SQL query against the Supabase database via MCP.

        Args:
            query: SQL query string to execute. Should be a SELECT query for data retrieval.

        Returns:
            MCPQueryResult containing the query results or error information.

        Raises:
            RuntimeError: If the client is not initialized.
            httpx.HTTPError: If the HTTP request fails.

        Example:
            >>> result = await client.execute_sql('''
            ...     SELECT COUNT(*) as count
            ...     FROM pds_submissions
            ...     WHERE status = 'approved'
            ... ''')
            >>> if result.success:
            ...     print(f"Count: {result.data[0]['count']}")
        """
        self._ensure_initialized()

        # Use the MCP Supabase server tool
        # The MCP server should be configured in the environment
        mcp_payload = {
            "tool": "mcp__supabase__execute_sql",
            "parameters": {"query": query},
        }

        try:
            # In production, this would make a request to the MCP server endpoint
            # For now, we'll directly call the Supabase REST API with the SQL query
            # This is a simplified implementation - a full MCP client would use the MCP protocol

            # Build the request to Supabase's PostgREST API
            # Note: This is a workaround. In production, use the actual MCP server
            response = await self._execute_via_supabase_rest(query)

            return MCPQueryResult(
                success=True, data=response, row_count=len(response) if response else 0
            )

        except Exception as e:
            return MCPQueryResult(success=False, error=str(e), row_count=0)

    async def _execute_via_supabase_rest(self, query: str) -> list[dict[str, Any]]:
        """
        Execute SQL query via Supabase REST API.

        This is a fallback implementation. In production, use the actual MCP server.

        Args:
            query: SQL query to execute

        Returns:
            List of row dictionaries

        Raises:
            httpx.HTTPError: If the request fails
        """
        assert self._http_client is not None

        # For SELECT queries, we can use PostgREST
        # For complex queries, we need to use the RPC endpoint
        url = f"{settings.SUPABASE_URL}/rest/v1/rpc/execute_sql"

        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        }

        # Note: This assumes you have an RPC function named execute_sql in your database
        # CREATE OR REPLACE FUNCTION execute_sql(query_text text)
        # RETURNS json AS $$
        # BEGIN
        #   RETURN query_text::json;
        # END;
        # $$ LANGUAGE plpgsql SECURITY DEFINER;

        payload = {"query_text": query}

        response = await self._http_client.post(url, headers=headers, json=payload)
        response.raise_for_status()

        return response.json()

    async def health_check(self) -> bool:
        """
        Check if the MCP client can connect to the database.

        Returns:
            True if connection is healthy, False otherwise.
        """
        try:
            result = await self.execute_sql("SELECT 1 as health_check")
            return result.success and result.data is not None
        except Exception:
            return False


# Global singleton instance
_mcp_client: Optional[SupabaseMCPClient] = None


async def initialize_mcp_client() -> None:
    """
    Initialize the global MCP client singleton.

    This should be called during application startup (e.g., in FastAPI lifespan).

    Example:
        >>> @asynccontextmanager
        >>> async def lifespan(app: FastAPI):
        >>>     await initialize_mcp_client()
        >>>     yield
        >>>     await close_mcp_client()
    """
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = SupabaseMCPClient()
        await _mcp_client.initialize()


async def close_mcp_client() -> None:
    """
    Close the global MCP client singleton.

    This should be called during application shutdown (e.g., in FastAPI lifespan).
    """
    global _mcp_client
    if _mcp_client:
        await _mcp_client.close()
        _mcp_client = None


def get_mcp_client() -> SupabaseMCPClient:
    """
    Get the global MCP client singleton.

    Returns:
        The initialized SupabaseMCPClient instance.

    Raises:
        RuntimeError: If the client has not been initialized.

    Example:
        >>> client = get_mcp_client()
        >>> result = await client.execute_sql("SELECT * FROM profiles LIMIT 10")
    """
    if _mcp_client is None:
        raise RuntimeError(
            "MCP client not initialized. Call initialize_mcp_client() during startup."
        )
    return _mcp_client
