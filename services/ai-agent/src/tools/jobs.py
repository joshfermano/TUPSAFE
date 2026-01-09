"""
Job Application Query Tools

This module provides tools for querying job application and open position data from the database.
These tools help the AI agent answer questions about recruitment pipeline metrics, application
statistics, and position management.

Key features:
- Job application status tracking
- Open position statistics by department
- Application funnel analysis
- Position availability insights
"""

from typing import Any, Literal, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from src.tools.mcp_client import get_mcp_client


class JobApplicationStatsInput(BaseModel):
    """Input schema for getting job application statistics."""

    status: Optional[
        Literal[
            "pending",
            "under_review",
            "shortlisted",
            "for_interview",
            "interviewed",
            "for_final_review",
            "accepted",
            "rejected",
            "withdrawn",
            "hired",
        ]
    ] = Field(None, description="Filter by specific application status. If None, gets all statuses.")


class OpenPositionsByDepartmentInput(BaseModel):
    """Input schema for getting open positions by department."""

    position_status: Optional[Literal["open", "closed", "filled", "cancelled"]] = Field(
        None, description="Filter by position status. If None, shows all statuses."
    )
    employment_category: Optional[Literal["faculty", "administrative", "contractual"]] = Field(
        None, description="Filter by employment category. If None, shows all categories."
    )


class ApplicationFunnelInput(BaseModel):
    """Input schema for getting application funnel metrics."""

    position_id: Optional[str] = Field(
        None, description="Filter by specific position UUID. If None, shows aggregate funnel."
    )


@tool(args_schema=JobApplicationStatsInput)
async def get_job_application_stats(status: Optional[str] = None) -> dict[str, Any]:
    """
    Get job application statistics, optionally filtered by status.

    This tool provides insights into the recruitment pipeline by counting applications
    at each stage of the review process. Useful for understanding application volume,
    conversion rates, and identifying bottlenecks.

    Args:
        status: Optional status filter - 'pending', 'under_review', 'shortlisted',
                'for_interview', 'interviewed', 'for_final_review', 'accepted',
                'rejected', 'withdrawn', 'hired'

    Returns:
        Dictionary containing:
        - total_applications: Total number of applications
        - status_filter: Status filter applied (or 'all')
        - status_breakdown: Count by each status
        - active_applications: Applications still in pipeline (not rejected/withdrawn)
        - successful_applications: Applications accepted or hired

    Example:
        >>> result = await get_job_application_stats()
        >>> print(f"Total applications: {result['total_applications']}")
        >>> print(f"Active in pipeline: {result['active_applications']}")
        >>> for status, count in result['status_breakdown'].items():
        ...     print(f"  {status}: {count}")
    """
    client = get_mcp_client()

    # Build query based on status filter
    filters = []
    if status:
        filters.append(f"status = '{status}'")

    where_clause = "WHERE " + " AND ".join(filters) if filters else ""

    # Get total count and breakdown
    query = f"""
        SELECT
            COUNT(*) as total_applications,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
            COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
            COUNT(CASE WHEN status = 'for_interview' THEN 1 END) as for_interview,
            COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviewed,
            COUNT(CASE WHEN status = 'for_final_review' THEN 1 END) as for_final_review,
            COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
            COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired,
            COUNT(CASE WHEN status NOT IN ('rejected', 'withdrawn', 'hired') THEN 1 END) as active
        FROM job_applications
        {where_clause}
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "total_applications": 0,
            "status_filter": status or "all",
            "status_breakdown": {},
            "active_applications": 0,
            "successful_applications": 0,
            "error": result.error,
        }

    data = result.data[0]

    status_breakdown = {
        "pending": data.get("pending", 0),
        "under_review": data.get("under_review", 0),
        "shortlisted": data.get("shortlisted", 0),
        "for_interview": data.get("for_interview", 0),
        "interviewed": data.get("interviewed", 0),
        "for_final_review": data.get("for_final_review", 0),
        "accepted": data.get("accepted", 0),
        "rejected": data.get("rejected", 0),
        "withdrawn": data.get("withdrawn", 0),
        "hired": data.get("hired", 0),
    }

    return {
        "total_applications": data.get("total_applications", 0),
        "status_filter": status or "all",
        "status_breakdown": status_breakdown,
        "active_applications": data.get("active", 0),
        "successful_applications": data.get("accepted", 0) + data.get("hired", 0),
    }


@tool(args_schema=OpenPositionsByDepartmentInput)
async def get_open_positions_by_department(
    position_status: Optional[str] = None, employment_category: Optional[str] = None
) -> dict[str, Any]:
    """
    Get open positions breakdown by department, with optional filters.

    This tool provides department-level insights into position availability and hiring activity.
    Useful for understanding recruitment needs across the organization and identifying
    departments with active hiring.

    Args:
        position_status: Optional filter - 'open', 'closed', 'filled', 'cancelled'
        employment_category: Optional filter - 'faculty', 'administrative', 'contractual'

    Returns:
        Dictionary containing:
        - departments: List of departments with position counts
        - position_status: Status filter applied (or 'all')
        - employment_category: Category filter applied (or 'all')
        - total_positions: Total positions across all departments
        - open_positions: Count of positions with 'open' status
        - filled_positions: Count of positions with 'filled' status

    Example:
        >>> result = await get_open_positions_by_department("open", "faculty")
        >>> print(f"Open faculty positions: {result['open_positions']}")
        >>> for dept in result['departments']:
        ...     print(f"  {dept['name']}: {dept['total_positions']} positions")
        ...     print(f"    Open: {dept['open']}, Applications: {dept['application_count']}")
    """
    client = get_mcp_client()

    # Build filters
    filters = []
    if position_status:
        filters.append(f"op.status = '{position_status}'")
    if employment_category:
        filters.append(f"op.employment_category = '{employment_category}'")

    where_clause = "WHERE " + " AND ".join(filters) if filters else ""

    query = f"""
        SELECT
            d.id as department_id,
            d.name as department_name,
            d.code as department_code,
            d.office_type,
            COUNT(op.id) as total_positions,
            COUNT(CASE WHEN op.status = 'open' THEN 1 END) as open_positions,
            COUNT(CASE WHEN op.status = 'closed' THEN 1 END) as closed_positions,
            COUNT(CASE WHEN op.status = 'filled' THEN 1 END) as filled_positions,
            COUNT(CASE WHEN op.status = 'cancelled' THEN 1 END) as cancelled_positions,
            COUNT(DISTINCT ja.id) as application_count
        FROM open_positions op
        INNER JOIN departments d ON op.department_id = d.id
        LEFT JOIN job_applications ja ON op.id = ja.position_id
        {where_clause}
        GROUP BY d.id, d.name, d.code, d.office_type
        HAVING COUNT(op.id) > 0
        ORDER BY open_positions DESC, total_positions DESC
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "departments": [],
            "position_status": position_status or "all",
            "employment_category": employment_category or "all",
            "total_positions": 0,
            "open_positions": 0,
            "filled_positions": 0,
            "error": result.error,
        }

    departments = [
        {
            "id": row.get("department_id"),
            "name": row.get("department_name"),
            "code": row.get("department_code"),
            "office_type": row.get("office_type"),
            "total_positions": row.get("total_positions", 0),
            "open": row.get("open_positions", 0),
            "closed": row.get("closed_positions", 0),
            "filled": row.get("filled_positions", 0),
            "cancelled": row.get("cancelled_positions", 0),
            "application_count": row.get("application_count", 0),
        }
        for row in result.data
    ]

    total_positions = sum(dept["total_positions"] for dept in departments)
    open_positions = sum(dept["open"] for dept in departments)
    filled_positions = sum(dept["filled"] for dept in departments)

    return {
        "departments": departments,
        "position_status": position_status or "all",
        "employment_category": employment_category or "all",
        "total_positions": total_positions,
        "open_positions": open_positions,
        "filled_positions": filled_positions,
    }


@tool(args_schema=ApplicationFunnelInput)
async def get_application_funnel_metrics(position_id: Optional[str] = None) -> dict[str, Any]:
    """
    Get application funnel metrics showing conversion rates through the hiring process.

    This tool provides funnel analysis to understand how applications progress through
    each stage of the recruitment process. Useful for identifying drop-off points and
    optimizing the hiring pipeline.

    Args:
        position_id: Optional position UUID to get funnel for specific position.
                     If None, shows aggregate funnel across all positions.

    Returns:
        Dictionary containing:
        - position_id: Position filter applied (or 'all')
        - funnel_stages: List of stages with counts and conversion rates
        - total_applications: Total applications entered into funnel
        - conversion_rate: Percentage of applications that resulted in hire
        - average_time_to_hire: Average days from application to hire (if available)

    Example:
        >>> result = await get_application_funnel_metrics()
        >>> print("Application Funnel:")
        >>> for stage in result['funnel_stages']:
        ...     print(f"  {stage['stage']}: {stage['count']} ({stage['conversion_rate']}%)")
        >>> print(f"Overall conversion to hire: {result['conversion_rate']}%")
    """
    client = get_mcp_client()

    # Build position filter
    position_filter = f"WHERE ja.position_id = '{position_id}'::uuid" if position_id else ""

    # Get funnel metrics
    query = f"""
        SELECT
            COUNT(*) as total_applications,
            COUNT(CASE WHEN status IN ('pending', 'under_review', 'shortlisted', 'for_interview',
                                       'interviewed', 'for_final_review', 'accepted', 'hired') THEN 1 END) as entered_review,
            COUNT(CASE WHEN status IN ('shortlisted', 'for_interview', 'interviewed',
                                       'for_final_review', 'accepted', 'hired') THEN 1 END) as shortlisted,
            COUNT(CASE WHEN status IN ('for_interview', 'interviewed', 'for_final_review',
                                       'accepted', 'hired') THEN 1 END) as interview_stage,
            COUNT(CASE WHEN status IN ('interviewed', 'for_final_review', 'accepted', 'hired') THEN 1 END) as interviewed,
            COUNT(CASE WHEN status IN ('for_final_review', 'accepted', 'hired') THEN 1 END) as final_review,
            COUNT(CASE WHEN status IN ('accepted', 'hired') THEN 1 END) as accepted,
            COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn
        FROM job_applications ja
        {position_filter}
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "position_id": position_id or "all",
            "funnel_stages": [],
            "total_applications": 0,
            "conversion_rate": 0.0,
            "error": result.error,
        }

    data = result.data[0]
    total = data.get("total_applications", 0)

    def calc_rate(count: int) -> float:
        """Calculate conversion rate as percentage."""
        return round((count / total * 100) if total > 0 else 0.0, 2)

    funnel_stages = [
        {
            "stage": "Total Applications",
            "count": total,
            "conversion_rate": 100.0,
        },
        {
            "stage": "Under Review",
            "count": data.get("entered_review", 0),
            "conversion_rate": calc_rate(data.get("entered_review", 0)),
        },
        {
            "stage": "Shortlisted",
            "count": data.get("shortlisted", 0),
            "conversion_rate": calc_rate(data.get("shortlisted", 0)),
        },
        {
            "stage": "Interview Stage",
            "count": data.get("interview_stage", 0),
            "conversion_rate": calc_rate(data.get("interview_stage", 0)),
        },
        {
            "stage": "Interviewed",
            "count": data.get("interviewed", 0),
            "conversion_rate": calc_rate(data.get("interviewed", 0)),
        },
        {
            "stage": "Final Review",
            "count": data.get("final_review", 0),
            "conversion_rate": calc_rate(data.get("final_review", 0)),
        },
        {
            "stage": "Accepted",
            "count": data.get("accepted", 0),
            "conversion_rate": calc_rate(data.get("accepted", 0)),
        },
        {
            "stage": "Hired",
            "count": data.get("hired", 0),
            "conversion_rate": calc_rate(data.get("hired", 0)),
        },
    ]

    hired_count = data.get("hired", 0)
    overall_conversion = calc_rate(hired_count)

    return {
        "position_id": position_id or "all",
        "funnel_stages": funnel_stages,
        "total_applications": total,
        "hired": hired_count,
        "rejected": data.get("rejected", 0),
        "withdrawn": data.get("withdrawn", 0),
        "conversion_rate": overall_conversion,
    }


@tool
async def get_position_application_summary() -> dict[str, Any]:
    """
    Get a summary of open positions and their application metrics.

    This tool provides a high-level overview of the recruitment landscape, showing
    which positions are available and how many applications each has received.
    Useful for understanding overall hiring activity and position popularity.

    Returns:
        Dictionary containing:
        - total_open_positions: Count of positions with 'open' status
        - positions: List of open positions with application metrics
        - total_applications: Total applications across all open positions
        - average_applications_per_position: Mean applications per position

    Example:
        >>> result = await get_position_application_summary()
        >>> print(f"Open Positions: {result['total_open_positions']}")
        >>> print(f"Total Applications: {result['total_applications']}")
        >>> print(f"\\nTop positions by applications:")
        >>> for pos in result['positions'][:5]:
        ...     print(f"  {pos['title']} - {pos['application_count']} applications")
    """
    client = get_mcp_client()

    query = """
        SELECT
            op.id,
            op.position_title,
            op.employment_category,
            d.name as department_name,
            d.code as department_code,
            op.created_at,
            op.application_deadline,
            COUNT(ja.id) as application_count,
            COUNT(CASE WHEN ja.status IN ('pending', 'under_review', 'shortlisted',
                                          'for_interview', 'interviewed', 'for_final_review') THEN 1 END) as active_applications,
            COUNT(CASE WHEN ja.status = 'accepted' THEN 1 END) as accepted_applications
        FROM open_positions op
        INNER JOIN departments d ON op.department_id = d.id
        LEFT JOIN job_applications ja ON op.id = ja.position_id
        WHERE op.status = 'open'
        GROUP BY op.id, op.position_title, op.employment_category, d.name, d.code,
                 op.created_at, op.application_deadline
        ORDER BY application_count DESC, op.created_at DESC
    """

    result = await client.execute_sql(query)

    if not result.success or not result.data:
        return {
            "total_open_positions": 0,
            "positions": [],
            "total_applications": 0,
            "average_applications_per_position": 0.0,
            "error": result.error,
        }

    positions = [
        {
            "id": row.get("id"),
            "title": row.get("position_title"),
            "employment_category": row.get("employment_category"),
            "department_name": row.get("department_name"),
            "department_code": row.get("department_code"),
            "application_count": row.get("application_count", 0),
            "active_applications": row.get("active_applications", 0),
            "accepted_applications": row.get("accepted_applications", 0),
            "created_at": row.get("created_at"),
            "application_deadline": row.get("application_deadline"),
        }
        for row in result.data
    ]

    total_positions = len(positions)
    total_applications = sum(pos["application_count"] for pos in positions)
    avg_applications = (
        round(total_applications / total_positions, 2) if total_positions > 0 else 0.0
    )

    return {
        "total_open_positions": total_positions,
        "positions": positions,
        "total_applications": total_applications,
        "average_applications_per_position": avg_applications,
    }
