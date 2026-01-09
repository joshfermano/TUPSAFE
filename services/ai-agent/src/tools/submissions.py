"""
PDS and SALN Submission Query Tools

This module provides tools for querying PDS (Personal Data Sheet) and SALN
(Statement of Assets, Liabilities, and Net Worth) submission data from the database.

These tools are used by the AI agent to answer questions about submission statistics,
status breakdowns, and department-level insights.
"""

from typing import Any, Literal, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.tools.mcp_client import get_mcp_client


class SubmissionCountInput(BaseModel):
    """Input schema for getting submission counts by status."""

    submission_type: Literal["pds", "saln"] = Field(
        ..., description="Type of submission to count: 'pds' or 'saln'"
    )
    status: Optional[
        Literal["draft", "submitted", "reviewing", "approved", "rejected"]
    ] = Field(None, description="Filter by specific status. If None, counts all submissions.")


class SubmissionsByDepartmentInput(BaseModel):
    """Input schema for getting submission breakdown by department."""

    submission_type: Literal["pds", "saln"] = Field(
        ..., description="Type of submission: 'pds' or 'saln'"
    )
    year: Optional[int] = Field(
        None, description="Filter by specific year. If None, includes all years."
    )


class PendingSubmissionsInput(BaseModel):
    """Input schema for getting pending submissions count."""

    submission_type: Optional[Literal["pds", "saln"]] = Field(
        None, description="Filter by submission type. If None, counts both PDS and SALN."
    )


class OfficesWithMostSubmissionsInput(BaseModel):
    """Input schema for getting offices ranked by submission count."""

    submission_type: Literal["pds", "saln"] = Field(
        ..., description="Type of submission: 'pds' or 'saln'"
    )
    limit: int = Field(
        10, description="Number of top offices to return", ge=1, le=50
    )


@tool(args_schema=SubmissionCountInput)
async def get_submission_count(submission_type: str, status: Optional[str] = None) -> dict[str, Any]:
    """
    Get the count of PDS or SALN submissions filtered by status.

    This tool counts submissions in the database, optionally filtering by their approval status.
    Useful for understanding submission volumes and approval pipeline.

    Args:
        submission_type: Type of submission to count ('pds' or 'saln')
        status: Optional status filter ('draft', 'submitted', 'reviewing', 'approved', 'rejected')

    Returns:
        Dictionary containing:
        - count: Total number of matching submissions
        - submission_type: Type that was queried
        - status: Status filter applied (or 'all')

    Example:
        >>> result = await get_submission_count("pds", "approved")
        >>> print(f"Approved PDS: {result['count']}")
    """
    client = get_mcp_client()

    # Build the SQL query based on submission type
    table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

    if status:
        query = f"""
            SELECT COUNT(*) as count
            FROM {table}
            WHERE status = '{status}'
        """
    else:
        query = f"""
            SELECT COUNT(*) as count
            FROM {table}
        """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "count": 0,
            "submission_type": submission_type,
            "status": status or "all",
            "error": result.error,
        }

    return {
        "count": result.data[0].get("count", 0),
        "submission_type": submission_type,
        "status": status or "all",
    }


@tool(args_schema=SubmissionsByDepartmentInput)
async def get_submissions_by_department(
    submission_type: str, year: Optional[int] = None
) -> dict[str, Any]:
    """
    Get a breakdown of submissions by department, optionally filtered by year.

    This tool provides department-level statistics showing submission volumes across
    the organization. Useful for identifying departments with high/low compliance.

    Args:
        submission_type: Type of submission ('pds' or 'saln')
        year: Optional year filter to focus on specific annual submissions

    Returns:
        Dictionary containing:
        - departments: List of departments with submission counts
        - submission_type: Type that was queried
        - year: Year filter applied (or 'all')
        - total_submissions: Total across all departments

    Example:
        >>> result = await get_submissions_by_department("saln", 2025)
        >>> for dept in result['departments']:
        ...     print(f"{dept['name']}: {dept['count']}")
    """
    client = get_mcp_client()

    table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

    # Join with profiles to get department, then with departments to get name
    year_filter = f"AND s.year = {year}" if year else ""

    query = f"""
        SELECT
            d.id as department_id,
            d.name as department_name,
            d.code as department_code,
            COUNT(s.id) as submission_count
        FROM {table} s
        INNER JOIN profiles p ON s.user_id = p.id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.user_type = 'employee'
            {year_filter}
        GROUP BY d.id, d.name, d.code
        ORDER BY submission_count DESC
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "departments": [],
            "submission_type": submission_type,
            "year": year or "all",
            "total_submissions": 0,
            "error": result.error,
        }

    total = sum(row.get("submission_count", 0) for row in result.data)

    return {
        "departments": [
            {
                "id": row.get("department_id"),
                "name": row.get("department_name", "Unknown Department"),
                "code": row.get("department_code"),
                "count": row.get("submission_count", 0),
            }
            for row in result.data
        ],
        "submission_type": submission_type,
        "year": year or "all",
        "total_submissions": total,
    }


@tool(args_schema=PendingSubmissionsInput)
async def get_pending_submissions(submission_type: Optional[str] = None) -> dict[str, Any]:
    """
    Get the count of submissions pending review (status: 'submitted' or 'reviewing').

    This tool helps identify workload for HR/admin staff by counting submissions
    awaiting approval action.

    Args:
        submission_type: Optional filter for 'pds' or 'saln'. If None, counts both.

    Returns:
        Dictionary containing:
        - pending_count: Total pending submissions
        - submitted_count: Submissions in 'submitted' status
        - reviewing_count: Submissions in 'reviewing' status
        - submission_type: Type filter applied (or 'all')

    Example:
        >>> result = await get_pending_submissions()
        >>> print(f"Total pending: {result['pending_count']}")
        >>> print(f"  Submitted: {result['submitted_count']}")
        >>> print(f"  Under Review: {result['reviewing_count']}")
    """
    client = get_mcp_client()

    if submission_type:
        table = "pds_submissions" if submission_type == "pds" else "saln_submissions"
        tables = [table]
    else:
        tables = ["pds_submissions", "saln_submissions"]

    results = {"submitted": 0, "reviewing": 0}

    for table in tables:
        query = f"""
            SELECT
                status,
                COUNT(*) as count
            FROM {table}
            WHERE status IN ('submitted', 'reviewing')
            GROUP BY status
        """

        result = await client.execute_sql(query)

        if result.success and result.data:
            for row in result.data:
                status = row.get("status")
                count = row.get("count", 0)
                if status in results:
                    results[status] += count

    total_pending = results["submitted"] + results["reviewing"]

    return {
        "pending_count": total_pending,
        "submitted_count": results["submitted"],
        "reviewing_count": results["reviewing"],
        "submission_type": submission_type or "all",
    }


@tool(args_schema=OfficesWithMostSubmissionsInput)
async def get_offices_with_most_submissions(
    submission_type: str, limit: int = 10
) -> dict[str, Any]:
    """
    Get top offices/departments ranked by total submission count.

    This tool identifies which offices have the highest submission volumes,
    useful for recognizing high compliance or targeting low performers.

    Args:
        submission_type: Type of submission ('pds' or 'saln')
        limit: Maximum number of top offices to return (1-50)

    Returns:
        Dictionary containing:
        - top_offices: List of offices with submission counts, ranked
        - submission_type: Type that was queried
        - limit: Number of results returned

    Example:
        >>> result = await get_offices_with_most_submissions("pds", limit=5)
        >>> print("Top 5 offices by PDS submissions:")
        >>> for i, office in enumerate(result['top_offices'], 1):
        ...     print(f"{i}. {office['name']}: {office['count']}")
    """
    client = get_mcp_client()

    table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

    # Limit parameter validation
    limit = max(1, min(limit, 50))

    query = f"""
        SELECT
            d.id as department_id,
            d.name as department_name,
            d.code as department_code,
            d.office_type,
            COUNT(s.id) as submission_count,
            COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN s.status = 'reviewing' THEN 1 END) as reviewing_count
        FROM {table} s
        INNER JOIN profiles p ON s.user_id = p.id
        INNER JOIN departments d ON p.department_id = d.id
        WHERE p.user_type = 'employee'
            AND d.is_active = true
        GROUP BY d.id, d.name, d.code, d.office_type
        HAVING COUNT(s.id) > 0
        ORDER BY submission_count DESC, approved_count DESC
        LIMIT {limit}
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "top_offices": [],
            "submission_type": submission_type,
            "limit": limit,
            "error": result.error,
        }

    return {
        "top_offices": [
            {
                "rank": idx + 1,
                "id": row.get("department_id"),
                "name": row.get("department_name"),
                "code": row.get("department_code"),
                "office_type": row.get("office_type"),
                "total_submissions": row.get("submission_count", 0),
                "approved": row.get("approved_count", 0),
                "submitted": row.get("submitted_count", 0),
                "reviewing": row.get("reviewing_count", 0),
            }
            for idx, row in enumerate(result.data)
        ],
        "submission_type": submission_type,
        "limit": limit,
    }
