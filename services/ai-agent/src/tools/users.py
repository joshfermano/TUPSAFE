"""
User and Employee Query Tools

This module provides tools for querying user and employee data from the database,
including counts, active status, and submission participation statistics.

These tools help the AI agent answer questions about the user base, workforce composition,
and employee engagement with the PDS/SALN systems.
"""

from typing import Any, Literal, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.tools.mcp_client import get_mcp_client


class EmployeeCountInput(BaseModel):
    """Input schema for counting employees."""

    employment_category: Optional[Literal["faculty", "administrative", "contractual"]] = Field(
        None, description="Filter by employment category. If None, counts all employees."
    )
    include_inactive: bool = Field(
        False, description="Whether to include inactive employees in the count"
    )


class ApplicantCountInput(BaseModel):
    """Input schema for counting applicants."""

    account_status: Optional[Literal["pending", "active", "suspended", "rejected"]] = Field(
        None, description="Filter by account status. If None, counts all applicants."
    )


class EmployeesWithSubmissionsInput(BaseModel):
    """Input schema for counting employees with submissions."""

    submission_type: Literal["pds", "saln", "both"] = Field(
        ..., description="Type of submission: 'pds', 'saln', or 'both'"
    )
    year: Optional[int] = Field(
        None, description="Filter by specific year. If None, includes all years."
    )


@tool(args_schema=EmployeeCountInput)
async def get_employee_count(
    employment_category: Optional[str] = None, include_inactive: bool = False
) -> dict[str, Any]:
    """
    Get the count of employees in the system, optionally filtered by employment category and active status.

    This tool provides workforce statistics, helping understand the size and composition
    of the employee base that needs to maintain PDS/SALN compliance.

    Args:
        employment_category: Optional filter for 'faculty', 'administrative', or 'contractual'
        include_inactive: Whether to include employees with is_active=false (default: False)

    Returns:
        Dictionary containing:
        - total_employees: Total count of employees
        - employment_category: Category filter applied (or 'all')
        - include_inactive: Whether inactive employees are included
        - breakdown: Count by employment category

    Example:
        >>> result = await get_employee_count()
        >>> print(f"Total active employees: {result['total_employees']}")
        >>> for category, count in result['breakdown'].items():
        ...     print(f"  {category}: {count}")
    """
    client = get_mcp_client()

    # Build filters
    filters = ["user_type = 'employee'"]

    if not include_inactive:
        filters.append("is_active = true")

    if employment_category:
        filters.append(f"employment_category = '{employment_category}'")

    where_clause = " AND ".join(filters)

    # Get total count
    total_query = f"""
        SELECT COUNT(*) as count
        FROM profiles
        WHERE {where_clause}
    """

    # Get breakdown by category
    breakdown_query = f"""
        SELECT
            employment_category,
            COUNT(*) as count
        FROM profiles
        WHERE user_type = 'employee'
            {'AND is_active = true' if not include_inactive else ''}
        GROUP BY employment_category
        ORDER BY count DESC
    """

    # Execute both queries
    total_result = await client.execute_sql(total_query)
    breakdown_result = await client.execute_sql(breakdown_query)

    if not total_result.success:
        return {
            "total_employees": 0,
            "employment_category": employment_category or "all",
            "include_inactive": include_inactive,
            "breakdown": {},
            "error": total_result.error,
        }

    total_count = total_result.data[0].get("count", 0) if total_result.data else 0

    breakdown = {}
    if breakdown_result.success and breakdown_result.data:
        for row in breakdown_result.data:
            category = row.get("employment_category", "not_applicable")
            count = row.get("count", 0)
            breakdown[category] = count

    return {
        "total_employees": total_count,
        "employment_category": employment_category or "all",
        "include_inactive": include_inactive,
        "breakdown": breakdown,
    }


@tool(args_schema=ApplicantCountInput)
async def get_applicant_count(account_status: Optional[str] = None) -> dict[str, Any]:
    """
    Get the count of applicants in the system, optionally filtered by account status.

    This tool helps track recruitment pipeline metrics by counting applicants at various
    stages of the account approval process.

    Args:
        account_status: Optional filter for 'pending', 'active', 'suspended', or 'rejected'

    Returns:
        Dictionary containing:
        - total_applicants: Total count of applicants
        - account_status: Status filter applied (or 'all')
        - breakdown: Count by account status

    Example:
        >>> result = await get_applicant_count("pending")
        >>> print(f"Pending applicants: {result['total_applicants']}")
    """
    client = get_mcp_client()

    # Build query
    filters = ["user_type = 'applicant'"]

    if account_status:
        filters.append(f"account_status = '{account_status}'")

    where_clause = " AND ".join(filters)

    # Get total count
    total_query = f"""
        SELECT COUNT(*) as count
        FROM profiles
        WHERE {where_clause}
    """

    # Get breakdown by status
    breakdown_query = """
        SELECT
            account_status,
            COUNT(*) as count
        FROM profiles
        WHERE user_type = 'applicant'
        GROUP BY account_status
        ORDER BY count DESC
    """

    # Execute both queries
    total_result = await client.execute_sql(total_query)
    breakdown_result = await client.execute_sql(breakdown_query)

    if not total_result.success:
        return {
            "total_applicants": 0,
            "account_status": account_status or "all",
            "breakdown": {},
            "error": total_result.error,
        }

    total_count = total_result.data[0].get("count", 0) if total_result.data else 0

    breakdown = {}
    if breakdown_result.success and breakdown_result.data:
        for row in breakdown_result.data:
            status = row.get("account_status", "unknown")
            count = row.get("count", 0)
            breakdown[status] = count

    return {
        "total_applicants": total_count,
        "account_status": account_status or "all",
        "breakdown": breakdown,
    }


@tool(args_schema=EmployeesWithSubmissionsInput)
async def get_employees_with_submissions(
    submission_type: str, year: Optional[int] = None
) -> dict[str, Any]:
    """
    Get the count of employees who have submitted PDS/SALN, optionally filtered by year.

    This tool measures employee engagement with compliance requirements by counting
    how many employees have active submissions on file.

    Args:
        submission_type: Type to check - 'pds', 'saln', or 'both'
        year: Optional year filter for annual submissions

    Returns:
        Dictionary containing:
        - employees_with_submissions: Count of employees with submissions
        - total_employees: Total active employees (for calculating percentage)
        - submission_type: Type that was queried
        - year: Year filter applied (or 'all')
        - compliance_rate: Percentage of employees with submissions

    Example:
        >>> result = await get_employees_with_submissions("saln", 2025)
        >>> print(f"SALN compliance for 2025: {result['compliance_rate']:.1f}%")
        >>> print(f"  {result['employees_with_submissions']} of {result['total_employees']} employees")
    """
    client = get_mcp_client()

    # Get total active employees
    total_query = """
        SELECT COUNT(DISTINCT id) as count
        FROM profiles
        WHERE user_type = 'employee'
            AND is_active = true
            AND account_status = 'active'
    """

    total_result = await client.execute_sql(total_query)
    total_employees = total_result.data[0].get("count", 0) if total_result.data else 0

    # Build submission query based on type
    year_filter = f"AND s.year = {year}" if year else ""

    if submission_type == "both":
        # Count employees with either PDS or SALN (or both)
        query = f"""
            SELECT COUNT(DISTINCT p.id) as count
            FROM profiles p
            WHERE p.user_type = 'employee'
                AND p.is_active = true
                AND p.account_status = 'active'
                AND (
                    EXISTS (
                        SELECT 1 FROM pds_submissions s
                        WHERE s.user_id = p.id {year_filter}
                    )
                    OR EXISTS (
                        SELECT 1 FROM saln_submissions s
                        WHERE s.user_id = p.id {year_filter}
                    )
                )
        """
    else:
        table = "pds_submissions" if submission_type == "pds" else "saln_submissions"
        query = f"""
            SELECT COUNT(DISTINCT p.id) as count
            FROM profiles p
            INNER JOIN {table} s ON p.id = s.user_id
            WHERE p.user_type = 'employee'
                AND p.is_active = true
                AND p.account_status = 'active'
                {year_filter}
        """

    result = await client.execute_sql(query)

    if not result.success:
        return {
            "employees_with_submissions": 0,
            "total_employees": total_employees,
            "submission_type": submission_type,
            "year": year or "all",
            "compliance_rate": 0.0,
            "error": result.error,
        }

    employees_with_submissions = result.data[0].get("count", 0) if result.data else 0

    # Calculate compliance rate
    compliance_rate = (
        (employees_with_submissions / total_employees * 100) if total_employees > 0 else 0.0
    )

    return {
        "employees_with_submissions": employees_with_submissions,
        "total_employees": total_employees,
        "submission_type": submission_type,
        "year": year or "all",
        "compliance_rate": round(compliance_rate, 2),
    }
