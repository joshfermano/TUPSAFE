"""
Compliance Calculation Tools

This module provides tools for calculating PDS and SALN compliance rates and identifying
non-compliant employees. These metrics are critical for CSC (Civil Service Commission)
compliance reporting and tracking organizational adherence to filing requirements.

Key compliance metrics:
- SALN Compliance Rate: Percentage of employees who filed SALN for a given year
- PDS Compliance Rate: Percentage of employees with approved PDS on file
- Pending Review: Submissions awaiting approval by department/office
"""

from typing import Any, Literal, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.tools.mcp_client import get_mcp_client


class SALNComplianceRateInput(BaseModel):
    """Input schema for calculating SALN compliance rate."""

    year: int = Field(
        ..., description="Year for which to calculate SALN compliance (e.g., 2025)"
    )
    department_id: Optional[str] = Field(
        None, description="Filter by specific department UUID. If None, calculates for entire organization."
    )


class PDSComplianceRateInput(BaseModel):
    """Input schema for calculating PDS compliance rate."""

    department_id: Optional[str] = Field(
        None, description="Filter by specific department UUID. If None, calculates for entire organization."
    )


class PendingSubmissionsByDepartmentInput(BaseModel):
    """Input schema for getting pending submissions by department."""

    submission_type: Optional[Literal["pds", "saln"]] = Field(
        None, description="Filter by submission type. If None, includes both."
    )


@tool(args_schema=SALNComplianceRateInput)
async def get_saln_compliance_rate(
    year: int, department_id: Optional[str] = None
) -> dict[str, Any]:
    """
    Calculate SALN compliance rate for a specific year, optionally filtered by department.

    SALN (Statement of Assets, Liabilities, and Net Worth) is required annually for all
    government employees per CSC regulations. This tool calculates what percentage of
    active employees have filed SALN for the specified year.

    Compliance is measured as: (Employees with approved SALN / Total active employees) × 100

    Args:
        year: Year for SALN filing (e.g., 2025 for "SALN - CY 2025")
        department_id: Optional department UUID to scope the calculation

    Returns:
        Dictionary containing:
        - year: Year for which compliance was calculated
        - department_id: Department filter (or 'all')
        - total_employees: Total active employees in scope
        - employees_compliant: Employees with approved SALN
        - employees_pending: Employees with submitted/reviewing SALN
        - employees_non_compliant: Employees without SALN
        - compliance_rate: Percentage compliant (approved)
        - submission_rate: Percentage with any submission (approved + pending)

    Example:
        >>> result = await get_saln_compliance_rate(2025)
        >>> print(f"SALN Compliance for 2025: {result['compliance_rate']:.1f}%")
        >>> print(f"  Compliant: {result['employees_compliant']} employees")
        >>> print(f"  Pending: {result['employees_pending']} employees")
        >>> print(f"  Non-compliant: {result['employees_non_compliant']} employees")
    """
    client = get_mcp_client()

    # Build department filter
    dept_filter = f"AND p.department_id = '{department_id}'::uuid" if department_id else ""

    # Query for total active employees
    total_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            {dept_filter}
    """

    # Query for employees with approved SALN
    compliant_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        INNER JOIN saln_submissions s ON p.id = s.user_id
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            AND s.year = {year}
            AND s.status = 'approved'
            {dept_filter}
    """

    # Query for employees with pending SALN (submitted or reviewing)
    pending_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        INNER JOIN saln_submissions s ON p.id = s.user_id
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            AND s.year = {year}
            AND s.status IN ('submitted', 'reviewing')
            {dept_filter}
    """

    # Execute queries
    total_result = await client.execute_sql(total_query)
    compliant_result = await client.execute_sql(compliant_query)
    pending_result = await client.execute_sql(pending_query)

    if not total_result.success:
        return {
            "year": year,
            "department_id": department_id or "all",
            "total_employees": 0,
            "employees_compliant": 0,
            "employees_pending": 0,
            "employees_non_compliant": 0,
            "compliance_rate": 0.0,
            "submission_rate": 0.0,
            "error": total_result.error,
        }

    total_employees = total_result.data[0].get("count", 0) if total_result.data else 0
    employees_compliant = compliant_result.data[0].get("count", 0) if compliant_result.data else 0
    employees_pending = pending_result.data[0].get("count", 0) if pending_result.data else 0
    employees_non_compliant = total_employees - employees_compliant - employees_pending

    # Calculate rates
    compliance_rate = (
        (employees_compliant / total_employees * 100) if total_employees > 0 else 0.0
    )
    submission_rate = (
        ((employees_compliant + employees_pending) / total_employees * 100)
        if total_employees > 0
        else 0.0
    )

    return {
        "year": year,
        "department_id": department_id or "all",
        "total_employees": total_employees,
        "employees_compliant": employees_compliant,
        "employees_pending": employees_pending,
        "employees_non_compliant": employees_non_compliant,
        "compliance_rate": round(compliance_rate, 2),
        "submission_rate": round(submission_rate, 2),
    }


@tool(args_schema=PDSComplianceRateInput)
async def get_pds_compliance_rate(department_id: Optional[str] = None) -> dict[str, Any]:
    """
    Calculate PDS compliance rate, optionally filtered by department.

    PDS (Personal Data Sheet) is required for all government employees and must be kept
    up-to-date. This tool calculates what percentage of active employees have an
    approved PDS on file.

    Unlike SALN which is annual, PDS compliance is measured as having any approved PDS,
    regardless of year.

    Args:
        department_id: Optional department UUID to scope the calculation

    Returns:
        Dictionary containing:
        - department_id: Department filter (or 'all')
        - total_employees: Total active employees in scope
        - employees_compliant: Employees with approved PDS
        - employees_pending: Employees with submitted/reviewing PDS
        - employees_non_compliant: Employees without PDS
        - compliance_rate: Percentage compliant (approved)
        - submission_rate: Percentage with any submission (approved + pending)

    Example:
        >>> result = await get_pds_compliance_rate()
        >>> print(f"Overall PDS Compliance: {result['compliance_rate']:.1f}%")
        >>> if result['employees_non_compliant'] > 0:
        ...     print(f"WARNING: {result['employees_non_compliant']} employees have no PDS on file")
    """
    client = get_mcp_client()

    # Build department filter
    dept_filter = f"AND p.department_id = '{department_id}'::uuid" if department_id else ""

    # Query for total active employees
    total_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            {dept_filter}
    """

    # Query for employees with approved PDS
    compliant_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        INNER JOIN pds_submissions s ON p.id = s.user_id
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            AND s.status = 'approved'
            {dept_filter}
    """

    # Query for employees with pending PDS (submitted or reviewing)
    pending_query = f"""
        SELECT COUNT(DISTINCT p.id) as count
        FROM profiles p
        INNER JOIN pds_submissions s ON p.id = s.user_id
        WHERE p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
            AND s.status IN ('submitted', 'reviewing')
            {dept_filter}
    """

    # Execute queries
    total_result = await client.execute_sql(total_query)
    compliant_result = await client.execute_sql(compliant_query)
    pending_result = await client.execute_sql(pending_query)

    if not total_result.success:
        return {
            "department_id": department_id or "all",
            "total_employees": 0,
            "employees_compliant": 0,
            "employees_pending": 0,
            "employees_non_compliant": 0,
            "compliance_rate": 0.0,
            "submission_rate": 0.0,
            "error": total_result.error,
        }

    total_employees = total_result.data[0].get("count", 0) if total_result.data else 0
    employees_compliant = compliant_result.data[0].get("count", 0) if compliant_result.data else 0
    employees_pending = pending_result.data[0].get("count", 0) if pending_result.data else 0
    employees_non_compliant = total_employees - employees_compliant - employees_pending

    # Calculate rates
    compliance_rate = (
        (employees_compliant / total_employees * 100) if total_employees > 0 else 0.0
    )
    submission_rate = (
        ((employees_compliant + employees_pending) / total_employees * 100)
        if total_employees > 0
        else 0.0
    )

    return {
        "department_id": department_id or "all",
        "total_employees": total_employees,
        "employees_compliant": employees_compliant,
        "employees_pending": employees_pending,
        "employees_non_compliant": employees_non_compliant,
        "compliance_rate": round(compliance_rate, 2),
        "submission_rate": round(submission_rate, 2),
    }


@tool(args_schema=PendingSubmissionsByDepartmentInput)
async def get_pending_submissions_by_department(
    submission_type: Optional[str] = None,
) -> dict[str, Any]:
    """
    Get a breakdown of pending submissions (submitted or reviewing status) by department.

    This tool helps HR/admin staff prioritize review workload by identifying which
    departments have submissions awaiting approval. Useful for ensuring timely processing
    and identifying bottlenecks.

    Args:
        submission_type: Optional filter for 'pds' or 'saln'. If None, includes both.

    Returns:
        Dictionary containing:
        - departments: List of departments with pending submission counts
        - submission_type: Type filter applied (or 'all')
        - total_pending: Total pending submissions across all departments

    Example:
        >>> result = await get_pending_submissions_by_department("saln")
        >>> print(f"Total pending SALN: {result['total_pending']}")
        >>> print("\\nBy department:")
        >>> for dept in result['departments']:
        ...     print(f"  {dept['name']}: {dept['submitted']} submitted, {dept['reviewing']} reviewing")
    """
    client = get_mcp_client()

    if submission_type:
        table = "pds_submissions" if submission_type == "pds" else "saln_submissions"
        tables = [table]
    else:
        tables = ["pds_submissions", "saln_submissions"]

    all_departments = {}

    for table in tables:
        query = f"""
            SELECT
                d.id as department_id,
                d.name as department_name,
                d.code as department_code,
                s.status,
                COUNT(s.id) as count
            FROM {table} s
            INNER JOIN profiles p ON s.user_id = p.id
            INNER JOIN departments d ON p.department_id = d.id
            WHERE s.status IN ('submitted', 'reviewing')
                AND p.user_type = 'employee'
                AND d.is_active = true
            GROUP BY d.id, d.name, d.code, s.status
            ORDER BY d.name
        """

        result = await client.execute_sql(query)

        if result.success and result.data:
            for row in result.data:
                dept_id = row.get("department_id")
                if dept_id not in all_departments:
                    all_departments[dept_id] = {
                        "id": dept_id,
                        "name": row.get("department_name"),
                        "code": row.get("department_code"),
                        "submitted": 0,
                        "reviewing": 0,
                        "total_pending": 0,
                    }

                status = row.get("status")
                count = row.get("count", 0)

                if status == "submitted":
                    all_departments[dept_id]["submitted"] += count
                elif status == "reviewing":
                    all_departments[dept_id]["reviewing"] += count

                all_departments[dept_id]["total_pending"] += count

    # Convert to sorted list
    departments_list = sorted(
        all_departments.values(), key=lambda x: x["total_pending"], reverse=True
    )

    total_pending = sum(dept["total_pending"] for dept in departments_list)

    return {
        "departments": departments_list,
        "submission_type": submission_type or "all",
        "total_pending": total_pending,
    }
