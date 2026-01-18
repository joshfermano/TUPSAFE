"""Database query validators and sanitizers.

Provides utilities for validating and sanitizing user inputs before
they are used in database queries to prevent injection attacks and
ensure data integrity.
"""

import re
from enum import Enum


class QueryOperator(str, Enum):
    """Supported query operators for database filters.

    These operators map to PostgREST/Supabase query methods:
    - EQUAL: .eq()
    - NOT_EQUAL: .neq()
    - GREATER_THAN: .gt()
    - LESS_THAN: .lt()
    - GREATER_THAN_OR_EQUAL: .gte()
    - LESS_THAN_OR_EQUAL: .lte()
    - CONTAINS: .ilike() or .cs() for arrays
    - IN: .in_()
    - NOT_IN: .not_.in_()
    - IS_NULL: .is_()
    - IS_NOT_NULL: .not_.is_()
    """

    EQUAL = "equal"
    NOT_EQUAL = "not_equal"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    CONTAINS = "contains"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"


def validate_uuid(value: str) -> bool:
    """Validate UUID format (RFC 4122).

    Args:
        value: String to validate as UUID

    Returns:
        True if value is a valid UUID format, False otherwise

    Example:
        >>> validate_uuid("550e8400-e29b-41d4-a716-446655440000")
        True
        >>> validate_uuid("not-a-uuid")
        False
    """
    pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I
    )
    return bool(pattern.match(value))


def validate_email(value: str) -> bool:
    """Validate email format.

    Args:
        value: String to validate as email

    Returns:
        True if value is a valid email format, False otherwise

    Example:
        >>> validate_email("user@example.com")
        True
        >>> validate_email("invalid-email")
        False
    """
    pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    return bool(pattern.match(value))


def sanitize_string(value: str) -> str:
    """Sanitize string input for database queries.

    Removes potentially dangerous SQL patterns that could be used
    for injection attacks. Note: This is defense-in-depth; the primary
    protection is using parameterized queries via the Supabase client.

    Args:
        value: String to sanitize

    Returns:
        Sanitized string with dangerous patterns removed

    Example:
        >>> sanitize_string("user'; DROP TABLE users;--")
        'user DROP TABLE users'
    """
    # Dangerous SQL patterns to remove
    dangerous = [
        ";",  # Statement separator
        "--",  # SQL comment
        "/*",  # Block comment start
        "*/",  # Block comment end
        "xp_",  # SQL Server extended procedures
        "sp_",  # SQL Server stored procedures
        "exec(",  # Execute command
        "execute(",  # Execute command
        "script",  # Script tags
        "<script",  # Script tags
        "</script",  # Script tags
    ]

    sanitized = value
    for pattern in dangerous:
        sanitized = sanitized.replace(pattern, "")

    return sanitized.strip()


def validate_table_name(table: str) -> bool:
    """Validate table name to prevent injection.

    Table names should only contain alphanumeric characters and underscores.

    Args:
        table: Table name to validate

    Returns:
        True if table name is valid, False otherwise

    Example:
        >>> validate_table_name("profiles")
        True
        >>> validate_table_name("pds_submissions")
        True
        >>> validate_table_name("profiles; DROP TABLE users;")
        False
    """
    pattern = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")
    return bool(pattern.match(table))


def validate_column_name(column: str) -> bool:
    """Validate column name to prevent injection.

    Column names should only contain alphanumeric characters, underscores,
    and dots (for joins).

    Args:
        column: Column name to validate

    Returns:
        True if column name is valid, False otherwise

    Example:
        >>> validate_column_name("email")
        True
        >>> validate_column_name("user.email")
        True
        >>> validate_column_name("email; DROP TABLE users;")
        False
    """
    pattern = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.]*$")
    return bool(pattern.match(column))


def validate_positive_integer(
    value: int,
    field_name: str,
    allow_zero: bool = True,
    max_value: int | None = None,
) -> int:
    """Validate that a value is a positive integer within bounds.

    Args:
        value: Integer value to validate
        field_name: Name of the field (for error messages)
        allow_zero: Whether zero is allowed (default: True)
        max_value: Optional maximum allowed value

    Returns:
        The validated integer value

    Raises:
        ValueError: If value is not valid

    Example:
        >>> validate_positive_integer(10, "limit")
        10
        >>> validate_positive_integer(0, "offset", allow_zero=True)
        0
        >>> validate_positive_integer(-1, "limit")
        ValueError: limit must be a non-negative integer
    """
    if not isinstance(value, int):
        raise ValueError(f"{field_name} must be an integer, got {type(value).__name__}")

    if allow_zero:
        if value < 0:
            raise ValueError(f"{field_name} must be a non-negative integer")
    else:
        if value <= 0:
            raise ValueError(f"{field_name} must be a positive integer")

    if max_value is not None and value > max_value:
        raise ValueError(f"{field_name} must not exceed {max_value}")

    return value


def validate_limit(limit: int, default: int = 50, max_limit: int = 200) -> int:
    """Validate and constrain a limit parameter for pagination.

    Args:
        limit: Requested limit value
        default: Default value if limit is None or 0
        max_limit: Maximum allowed limit

    Returns:
        Validated limit value within bounds (1 to max_limit)

    Example:
        >>> validate_limit(10)
        10
        >>> validate_limit(500)  # Exceeds max_limit
        200
        >>> validate_limit(0)  # Returns default
        50
    """
    if limit is None or limit <= 0:
        return default

    return min(limit, max_limit)


def validate_offset(offset: int) -> int:
    """Validate an offset parameter for pagination.

    Args:
        offset: Requested offset value

    Returns:
        Validated offset value (minimum 0)

    Example:
        >>> validate_offset(10)
        10
        >>> validate_offset(-5)  # Negative becomes 0
        0
    """
    if offset is None or offset < 0:
        return 0

    return offset


def validate_year(year: int | None, allow_none: bool = True) -> int | None:
    """Validate a year value is within reasonable bounds.

    Args:
        year: Year value to validate
        allow_none: Whether None is acceptable

    Returns:
        Validated year or None

    Raises:
        ValueError: If year is invalid

    Example:
        >>> validate_year(2025)
        2025
        >>> validate_year(None)
        None
        >>> validate_year(1899)
        ValueError: Year must be between 1900 and 2100
    """
    if year is None:
        if allow_none:
            return None
        raise ValueError("Year is required")

    if not isinstance(year, int):
        raise ValueError(f"Year must be an integer, got {type(year).__name__}")

    if year < 1900 or year > 2100:
        raise ValueError("Year must be between 1900 and 2100")

    return year
