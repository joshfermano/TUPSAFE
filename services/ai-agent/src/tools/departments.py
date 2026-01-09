"""
Department Query Tools

This module provides tools for querying department/office information and statistics
from the database. Departments in TUPSAFE are organized hierarchically with colleges
at the top level and departments underneath.

These tools help the AI agent answer questions about organizational structure,
department-level metrics, and office-specific compliance data.
"""

from typing import Any, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.tools.mcp_client import get_mcp_client


class DepartmentListInput(BaseModel):
    """Input schema for listing departments."""

    office_type: Optional[str] = Field(
        None,
        description="Filter by office type: 'academic' or 'administrative'. If None, returns all.",
    )
    include_inactive: bool = Field(
        False, description="Whether to include inactive departments"
    )


class DepartmentStatsInput(BaseModel):
    """Input schema for getting department statistics."""

    department_id: str = Field(
        ..., description="UUID of the department to get statistics for"
    )


@tool(args_schema=DepartmentListInput)
async def get_department_list(
    office_type: Optional[str] = None, include_inactive: bool = False
) -> dict[str, Any]:
    """
    Get a list of all departments/offices in the organization.

    TUPSAFE organizes departments hierarchically:
    - Colleges (parent_college_id is NULL)
    - Departments (have a parent_college_id)

    This tool provides the organizational structure needed for filtering and
    scoping other queries by department.

    Args:
        office_type: Optional filter for 'academic' or 'administrative' offices
        include_inactive: Whether to include departments marked as inactive

    Returns:
        Dictionary containing:
        - departments: List of department objects
        - total_count: Total number of departments
        - office_type: Type filter applied (or 'all')
        - include_inactive: Whether inactive departments are included

    Example:
        >>> result = await get_department_list("academic")
        >>> print(f"Found {result['total_count']} academic departments:")
        >>> for dept in result['departments']:
        ...     parent = f" (under {dept['parent_college_name']})" if dept['parent_college_name'] else ""
        ...     print(f"  {dept['name']} [{dept['code']}]{parent}")
    """
    client = get_mcp_client()

    # Build filters
    filters = []
    if office_type:
        filters.append(f"d.office_type = '{office_type}'")
    if not include_inactive:
        filters.append("d.is_active = true")

    where_clause = "WHERE " + " AND ".join(filters) if filters else ""

    query = f"""
        SELECT
            d.id,
            d.name,
            d.code,
            d.office_type,
            d.parent_id,
            d.parent_college_id,
            d.is_active,
            d.created_at,
            pc.name as parent_college_name,
            pc.code as parent_college_code,
            (SELECT COUNT(*) FROM profiles WHERE department_id = d.id AND user_type = 'employee' AND is_active = true) as employee_count
        FROM departments d
        LEFT JOIN departments pc ON d.parent_college_id = pc.id
        {where_clause}
        ORDER BY d.office_type, d.name
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "departments": [],
            "total_count": 0,
            "office_type": office_type or "all",
            "include_inactive": include_inactive,
            "error": result.error,
        }

    departments = [
        {
            "id": row.get("id"),
            "name": row.get("name"),
            "code": row.get("code"),
            "office_type": row.get("office_type"),
            "parent_id": row.get("parent_id"),
            "parent_college_id": row.get("parent_college_id"),
            "parent_college_name": row.get("parent_college_name"),
            "parent_college_code": row.get("parent_college_code"),
            "is_active": row.get("is_active"),
            "employee_count": row.get("employee_count", 0),
            "is_college": row.get("parent_college_id") is None,
            "created_at": row.get("created_at"),
        }
        for row in result.data
    ]

    return {
        "departments": departments,
        "total_count": len(departments),
        "office_type": office_type or "all",
        "include_inactive": include_inactive,
    }


@tool(args_schema=DepartmentStatsInput)
async def get_department_stats(department_id: str) -> dict[str, Any]:
    """
    Get comprehensive statistics for a specific department.

    This tool provides a complete overview of department metrics including:
    - Employee counts and breakdown
    - PDS/SALN submission statistics
    - Compliance rates
    - Pending reviews

    Useful for department heads and administrators to understand their office's
    compliance status and workload.

    Args:
        department_id: UUID of the department to analyze

    Returns:
        Dictionary containing:
        - department: Basic department information
        - employees: Employee statistics
        - pds_stats: PDS submission and compliance data
        - saln_stats: SALN submission and compliance data
        - pending_reviews: Count of submissions awaiting approval

    Example:
        >>> result = await get_department_stats("123e4567-e89b-12d3-a456-426614174000")
        >>> dept = result['department']
        >>> print(f"Department: {dept['name']} [{dept['code']}]")
        >>> print(f"Employees: {result['employees']['total']}")
        >>> print(f"PDS Compliance: {result['pds_stats']['compliance_rate']:.1f}%")
        >>> print(f"SALN Compliance (2025): {result['saln_stats']['compliance_rate']:.1f}%")
    """
    client = get_mcp_client()

    # Get department basic info
    dept_query = f"""
        SELECT
            d.id,
            d.name,
            d.code,
            d.office_type,
            d.is_active,
            pc.name as parent_college_name,
            pc.code as parent_college_code
        FROM departments d
        LEFT JOIN departments pc ON d.parent_college_id = pc.id
        WHERE d.id = '{department_id}'::uuid
    """

    dept_result = await client.execute_sql(dept_query)

    if not dept_result.success or not dept_result.data:
        return {
            "department": None,
            "error": dept_result.error or "Department not found",
        }

    dept_info = dept_result.data[0]

    # Get employee statistics
    employee_query = f"""
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN employment_category = 'faculty' THEN 1 END) as faculty,
            COUNT(CASE WHEN employment_category = 'administrative' THEN 1 END) as administrative,
            COUNT(CASE WHEN employment_category = 'contractual' THEN 1 END) as contractual
        FROM profiles
        WHERE department_id = '{department_id}'::uuid
            AND user_type = 'employee'
            AND is_active = true
            AND account_status = 'active'
    """

    # Get PDS statistics
    pds_query = f"""
        SELECT
            COUNT(DISTINCT p.id) as total_employees,
            COUNT(DISTINCT CASE WHEN pds.status = 'approved' THEN p.id END) as with_approved_pds,
            COUNT(DISTINCT CASE WHEN pds.status IN ('submitted', 'reviewing') THEN p.id END) as with_pending_pds,
            COUNT(DISTINCT pds.id) as total_pds_submissions
        FROM profiles p
        LEFT JOIN pds_submissions pds ON p.id = pds.user_id
        WHERE p.department_id = '{department_id}'::uuid
            AND p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
    """

    # Get SALN statistics (current year and last year)
    from datetime import datetime

    current_year = datetime.now().year
    saln_query = f"""
        SELECT
            COUNT(DISTINCT p.id) as total_employees,
            COUNT(DISTINCT CASE WHEN saln.year = {current_year} AND saln.status = 'approved' THEN p.id END) as current_year_approved,
            COUNT(DISTINCT CASE WHEN saln.year = {current_year} AND saln.status IN ('submitted', 'reviewing') THEN p.id END) as current_year_pending,
            COUNT(DISTINCT CASE WHEN saln.year = {current_year - 1} AND saln.status = 'approved' THEN p.id END) as last_year_approved,
            COUNT(DISTINCT saln.id) as total_saln_submissions
        FROM profiles p
        LEFT JOIN saln_submissions saln ON p.id = saln.user_id
        WHERE p.department_id = '{department_id}'::uuid
            AND p.user_type = 'employee'
            AND p.is_active = true
            AND p.account_status = 'active'
    """

    # Get pending reviews count
    pending_query = f"""
        SELECT
            COUNT(CASE WHEN pds.status IN ('submitted', 'reviewing') THEN 1 END) as pending_pds,
            COUNT(CASE WHEN saln.status IN ('submitted', 'reviewing') THEN 1 END) as pending_saln
        FROM profiles p
        LEFT JOIN pds_submissions pds ON p.id = pds.user_id
        LEFT JOIN saln_submissions saln ON p.id = saln.user_id
        WHERE p.department_id = '{department_id}'::uuid
            AND p.user_type = 'employee'
    """

    # Execute all queries
    employee_result = await client.execute_sql(employee_query)
    pds_result = await client.execute_sql(pds_query)
    saln_result = await client.execute_sql(saln_query)
    pending_result = await client.execute_sql(pending_query)

    # Parse results
    employee_data = employee_result.data[0] if employee_result.success and employee_result.data else {}
    pds_data = pds_result.data[0] if pds_result.success and pds_result.data else {}
    saln_data = saln_result.data[0] if saln_result.success and saln_result.data else {}
    pending_data = pending_result.data[0] if pending_result.success and pending_result.data else {}

    total_employees = employee_data.get("total", 0)

    # Calculate PDS compliance
    pds_approved = pds_data.get("with_approved_pds", 0)
    pds_pending = pds_data.get("with_pending_pds", 0)
    pds_compliance_rate = (pds_approved / total_employees * 100) if total_employees > 0 else 0.0

    # Calculate SALN compliance (current year)
    saln_approved = saln_data.get("current_year_approved", 0)
    saln_pending = saln_data.get("current_year_pending", 0)
    saln_compliance_rate = (
        (saln_approved / total_employees * 100) if total_employees > 0 else 0.0
    )

    return {
        "department": {
            "id": dept_info.get("id"),
            "name": dept_info.get("name"),
            "code": dept_info.get("code"),
            "office_type": dept_info.get("office_type"),
            "is_active": dept_info.get("is_active"),
            "parent_college_name": dept_info.get("parent_college_name"),
            "parent_college_code": dept_info.get("parent_college_code"),
        },
        "employees": {
            "total": total_employees,
            "faculty": employee_data.get("faculty", 0),
            "administrative": employee_data.get("administrative", 0),
            "contractual": employee_data.get("contractual", 0),
        },
        "pds_stats": {
            "total_submissions": pds_data.get("total_pds_submissions", 0),
            "employees_with_approved": pds_approved,
            "employees_with_pending": pds_pending,
            "employees_without": total_employees - pds_approved - pds_pending,
            "compliance_rate": round(pds_compliance_rate, 2),
        },
        "saln_stats": {
            "total_submissions": saln_data.get("total_saln_submissions", 0),
            "current_year": current_year,
            "current_year_approved": saln_approved,
            "current_year_pending": saln_pending,
            "current_year_without": total_employees - saln_approved - saln_pending,
            "compliance_rate": round(saln_compliance_rate, 2),
            "last_year_approved": saln_data.get("last_year_approved", 0),
        },
        "pending_reviews": {
            "pds": pending_data.get("pending_pds", 0),
            "saln": pending_data.get("pending_saln", 0),
            "total": pending_data.get("pending_pds", 0) + pending_data.get("pending_saln", 0),
        },
    }
