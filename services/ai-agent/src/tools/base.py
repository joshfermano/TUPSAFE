"""Base class for TUPSAFE AI agent tools.

Provides common functionality for all tools including database querying,
response formatting, and error handling following the Fuseable pattern.
"""

import json
from abc import ABC
from typing import Any

from langchain_core.tools import BaseTool

from src.db.client import query_table


class TUPSAFETool(BaseTool, ABC):
    """Base class for all TUPSAFE tools.

    Extends LangChain's BaseTool with TUPSAFE-specific functionality:
    - Database query utilities
    - Standardized response formatting
    - Error handling and logging
    - Input validation

    All TUPSAFE tools should inherit from this base class to ensure
    consistent behavior and error handling across the agent.

    Example:
        >>> class GetProfileTool(TUPSAFETool):
        ...     name = "get_profile"
        ...     description = "Get user profile by ID"
        ...
        ...     def _run(self, user_id: str) -> str:
        ...         try:
        ...             response = self._query("profiles", "id,email,role") \\
        ...                 .eq("id", user_id) \\
        ...                 .single() \\
        ...                 .execute()
        ...             return self._format_response([response.data])
        ...         except Exception as e:
        ...             return self._handle_error(e)
    """

    def _query(self, table: str, columns: str = "*") -> Any:
        """Create a query builder for a table.

        Provides convenient access to the database query builder with
        automatic client management.

        Args:
            table: Name of the database table to query
            columns: Comma-separated column names to select (default: "*")

        Returns:
            Query builder instance for chaining filters

        Example:
            >>> self._query("profiles", "id,email") \\
            ...     .eq("role", "admin") \\
            ...     .execute()
        """
        return query_table(table, columns)

    def _format_response(
        self,
        data: list[Any],
        message: str = "Success",
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """Format response for LLM consumption.

        Standardizes the response format across all tools to make it
        easier for the LLM to parse and understand the results.

        Args:
            data: List of data items to return
            message: Success message (default: "Success")
            metadata: Optional metadata to include in response

        Returns:
            JSON string with standardized format

        Example:
            >>> self._format_response(
            ...     [{"id": "123", "name": "John"}],
            ...     "Found 1 profile",
            ...     {"query_time_ms": 45}
            ... )
            '{"data": [...], "count": 1, "message": "Found 1 profile", ...}'
        """
        response = {
            "data": data,
            "count": len(data),
            "message": message,
        }

        if metadata:
            response["metadata"] = metadata

        return json.dumps(response, default=str, indent=2)

    def _format_single_response(
        self,
        data: Any,
        message: str = "Success",
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """Format single item response for LLM consumption.

        Convenience method for formatting a single data item.

        Args:
            data: Single data item to return
            message: Success message (default: "Success")
            metadata: Optional metadata to include in response

        Returns:
            JSON string with standardized format

        Example:
            >>> self._format_single_response(
            ...     {"id": "123", "name": "John"},
            ...     "Profile found"
            ... )
        """
        return self._format_response([data], message, metadata)

    def _handle_error(
        self,
        error: Exception,
        context: dict[str, Any] | None = None,
    ) -> str:
        """Format error response.

        Standardizes error handling and provides context for debugging
        while being safe to return to the LLM.

        Args:
            error: The exception that occurred
            context: Optional context about what was being attempted

        Returns:
            JSON string with error details

        Example:
            >>> try:
            ...     # Some database operation
            ... except Exception as e:
            ...     return self._handle_error(e, {"user_id": user_id})
        """
        error_response = {
            "error": str(error),
            "error_type": type(error).__name__,
            "data": [],
            "count": 0,
        }

        if context:
            error_response["context"] = context

        return json.dumps(error_response, default=str, indent=2)

    def _validate_required_fields(
        self,
        data: dict[str, Any],
        required_fields: list[str],
    ) -> tuple[bool, str | None]:
        """Validate that required fields are present in data.

        Args:
            data: Dictionary to validate
            required_fields: List of required field names

        Returns:
            Tuple of (is_valid, error_message)

        Example:
            >>> is_valid, error = self._validate_required_fields(
            ...     {"name": "John"},
            ...     ["name", "email"]
            ... )
            >>> if not is_valid:
            ...     return self._handle_error(ValueError(error))
        """
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            return False, error_msg

        return True, None
