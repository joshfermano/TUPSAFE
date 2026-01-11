"""Supabase client factory following the Fuseable pattern.

This module provides a cached Supabase client instance and query utilities.
Following the pattern from the Fuseable project's agent-service implementation.
"""

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from src.config.settings import settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get a cached Supabase client instance.

    Uses lru_cache to ensure only one client is created per process.
    The client is thread-safe and can be reused across requests.

    Returns:
        Client: Configured Supabase client instance

    Raises:
        RuntimeError: If Supabase credentials are not configured
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase URL and service role key must be configured. "
            "Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
        )

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def query_table(table: str, columns: str = "*") -> Any:
    """Create a query builder for a table.

    Provides a convenient wrapper around the Supabase client's table query builder.
    This allows for fluent query building with PostgREST-style filters.

    Args:
        table: Name of the database table to query
        columns: Comma-separated column names to select (default: "*" for all)

    Returns:
        Query builder instance for chaining filters and executing queries

    Example:
        >>> # Simple query
        >>> query_table("profiles", "id,email,role").eq("role", "admin").execute()

        >>> # Complex query with filters
        >>> query_table("pds_submissions", "*") \\
        ...     .eq("status", "submitted") \\
        ...     .gte("created_at", "2024-01-01") \\
        ...     .order("created_at", desc=True) \\
        ...     .limit(10) \\
        ...     .execute()
    """
    return get_supabase_client().table(table).select(columns)
