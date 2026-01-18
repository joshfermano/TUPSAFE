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

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string, validate_uuid
from src.tools.base import TUPSAFETool
from src.utils.formatters import format_full_name


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


class PositionApplicationSummaryInput(BaseModel):
    """Input schema for getting position application summary."""

    include_applicant_names: bool = Field(
        False, description="If True, include applicant names for each position"
    )
    applicant_names_limit: int = Field(
        10, ge=1, le=50, description="Maximum number of applicant names to show per position"
    )


class GetJobApplicationStatsTool(TUPSAFETool):
    """Tool for getting job application statistics.

    This tool provides insights into the recruitment pipeline by counting applications
    at each stage of the review process. Useful for understanding application volume,
    conversion rates, and identifying bottlenecks.
    """

    name: str = "get_job_application_stats"
    description: str = """
    Get job application statistics, optionally filtered by status.

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
        >>> result = get_job_application_stats()
        >>> print(f"Total applications: {result['total_applications']}")
        >>> print(f"Active in pipeline: {result['active_applications']}")
    """
    args_schema: type[BaseModel] = JobApplicationStatsInput

    def _run(self, status: Optional[str] = None) -> str:
        """Execute the job application stats query."""
        try:
            # Build query
            query = self._query("job_applications", "id,status")

            if status:
                sanitized_status = sanitize_string(status)
                query = query.eq("status", sanitized_status)

            # Execute query
            response = query.execute()
            applications = response.data if response.data else []

            # Count by status
            status_counts = {
                "pending": 0,
                "under_review": 0,
                "shortlisted": 0,
                "for_interview": 0,
                "interviewed": 0,
                "for_final_review": 0,
                "accepted": 0,
                "rejected": 0,
                "withdrawn": 0,
                "hired": 0,
            }

            active_count = 0
            for app in applications:
                app_status = app.get("status")
                if app_status in status_counts:
                    status_counts[app_status] += 1

                if app_status not in ["rejected", "withdrawn", "hired"]:
                    active_count += 1

            successful = status_counts["accepted"] + status_counts["hired"]

            result = {
                "total_applications": len(applications),
                "status_filter": status or "all",
                "status_breakdown": status_counts,
                "active_applications": active_count,
                "successful_applications": successful,
            }

            return self._format_response(
                [result],
                f"Found {len(applications)} applications",
                {"status_filter": status or "all"}
            )

        except Exception as e:
            return self._handle_error(e, {"status": status})


class GetOpenPositionsByDepartmentTool(TUPSAFETool):
    """Tool for getting open positions breakdown by department.

    This tool provides department-level insights into position availability and hiring activity.
    Useful for understanding recruitment needs across the organization and identifying
    departments with active hiring.
    """

    name: str = "get_open_positions_by_department"
    description: str = """
    Get open positions breakdown by department, with optional filters.

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
        >>> result = get_open_positions_by_department("open", "faculty")
        >>> print(f"Open faculty positions: {result['open_positions']}")
    """
    args_schema: type[BaseModel] = OpenPositionsByDepartmentInput

    def _run(self, position_status: Optional[str] = None, employment_category: Optional[str] = None) -> str:
        """Execute the open positions by department query."""
        try:
            # Build query for positions
            positions_query = self._query("open_positions", "id,department_id,status,employment_category")

            if position_status:
                sanitized_status = sanitize_string(position_status)
                positions_query = positions_query.eq("status", sanitized_status)

            if employment_category:
                sanitized_category = sanitize_string(employment_category)
                positions_query = positions_query.eq("employment_category", sanitized_category)

            positions_response = positions_query.execute()
            positions = positions_response.data if positions_response.data else []

            if not positions:
                return self._format_response(
                    [],
                    "No positions found",
                    {
                        "position_status": position_status or "all",
                        "employment_category": employment_category or "all",
                        "total_positions": 0,
                        "open_positions": 0,
                        "filled_positions": 0,
                    }
                )

            # Get unique department IDs
            dept_ids = list(set(p["department_id"] for p in positions if p.get("department_id")))

            if not dept_ids:
                return self._format_response(
                    [],
                    f"Found {len(positions)} positions with no department assignment",
                    {
                        "position_status": position_status or "all",
                        "employment_category": employment_category or "all",
                        "total_positions": len(positions),
                        "open_positions": 0,
                        "filled_positions": 0,
                    }
                )

            # Get department details
            departments_response = self._query("departments", "id,name,code,office_type").in_("id", dept_ids).execute()
            departments_data = departments_response.data if departments_response.data else []

            # Get all position IDs
            position_ids = [p["id"] for p in positions]

            # Get application counts for these positions
            applications_response = self._query("job_applications", "id,position_id").in_("position_id", position_ids).execute()
            applications = applications_response.data if applications_response.data else []

            # Count applications by position
            app_counts_by_position = {}
            for app in applications:
                pos_id = app["position_id"]
                app_counts_by_position[pos_id] = app_counts_by_position.get(pos_id, 0) + 1

            # Aggregate positions by department
            dept_stats = {}
            for pos in positions:
                dept_id = pos.get("department_id")
                if not dept_id:
                    continue

                if dept_id not in dept_stats:
                    dept_stats[dept_id] = {
                        "total": 0,
                        "open": 0,
                        "closed": 0,
                        "filled": 0,
                        "cancelled": 0,
                        "applications": 0,
                    }

                dept_stats[dept_id]["total"] += 1
                pos_status = pos.get("status")
                if pos_status in dept_stats[dept_id]:
                    dept_stats[dept_id][pos_status] += 1

                # Add application count for this position
                dept_stats[dept_id]["applications"] += app_counts_by_position.get(pos.get("id"), 0)

            # Build result
            departments_list = []
            for dept in departments_data:
                dept_id = dept["id"]
                if dept_id in dept_stats:
                    stats = dept_stats[dept_id]
                    departments_list.append({
                        "id": dept_id,
                        "name": dept.get("name"),
                        "code": dept.get("code"),
                        "office_type": dept.get("office_type"),
                        "total_positions": stats["total"],
                        "open": stats["open"],
                        "closed": stats["closed"],
                        "filled": stats["filled"],
                        "cancelled": stats["cancelled"],
                        "application_count": stats["applications"],
                    })

            # Sort by open positions descending
            departments_list.sort(key=lambda x: (x["open"], x["total_positions"]), reverse=True)

            total_positions = sum(d["total_positions"] for d in departments_list)
            open_positions = sum(d["open"] for d in departments_list)
            filled_positions = sum(d["filled"] for d in departments_list)

            return self._format_response(
                departments_list,
                f"Found {len(departments_list)} departments with positions",
                {
                    "position_status": position_status or "all",
                    "employment_category": employment_category or "all",
                    "total_positions": total_positions,
                    "open_positions": open_positions,
                    "filled_positions": filled_positions,
                }
            )

        except Exception as e:
            return self._handle_error(e, {
                "position_status": position_status,
                "employment_category": employment_category
            })


class GetApplicationFunnelMetricsTool(TUPSAFETool):
    """Tool for getting application funnel metrics.

    This tool provides funnel analysis to understand how applications progress through
    each stage of the recruitment process. Useful for identifying drop-off points and
    optimizing the hiring pipeline.
    """

    name: str = "get_application_funnel_metrics"
    description: str = """
    Get application funnel metrics showing conversion rates through the hiring process.

    Args:
        position_id: Optional position UUID to get funnel for specific position.
                     If None, shows aggregate funnel across all positions.

    Returns:
        Dictionary containing:
        - position_id: Position filter applied (or 'all')
        - funnel_stages: List of stages with counts and conversion rates
        - total_applications: Total applications entered into funnel
        - conversion_rate: Percentage of applications that resulted in hire

    Example:
        >>> result = get_application_funnel_metrics()
        >>> print("Application Funnel:")
        >>> for stage in result['funnel_stages']:
        ...     print(f"  {stage['stage']}: {stage['count']} ({stage['conversion_rate']}%)")
    """
    args_schema: type[BaseModel] = ApplicationFunnelInput

    def _run(self, position_id: Optional[str] = None) -> str:
        """Execute the application funnel metrics query."""
        try:
            # Validate position_id if provided
            pos_id_validated = None
            if position_id:
                if not validate_uuid(position_id):
                    raise ValueError(f"Invalid UUID format for position_id: {position_id}")
                pos_id_validated = position_id

            # Build query
            query = self._query("job_applications", "id,status")

            if pos_id_validated:
                query = query.eq("position_id", pos_id_validated)

            # Execute query
            response = query.execute()
            applications = response.data if response.data else []

            if not applications:
                return self._format_response(
                    [],
                    "No applications found",
                    {
                        "position_id": position_id or "all",
                        "total_applications": 0,
                        "hired": 0,
                        "rejected": 0,
                        "withdrawn": 0,
                        "conversion_rate": 0.0,
                    }
                )

            # Count applications at each stage
            total = len(applications)

            # Define stage hierarchies (later stages include earlier stages)
            entered_review_statuses = ["pending", "under_review", "shortlisted", "for_interview",
                                       "interviewed", "for_final_review", "accepted", "hired"]
            shortlisted_statuses = ["shortlisted", "for_interview", "interviewed",
                                   "for_final_review", "accepted", "hired"]
            interview_stage_statuses = ["for_interview", "interviewed", "for_final_review",
                                        "accepted", "hired"]
            interviewed_statuses = ["interviewed", "for_final_review", "accepted", "hired"]
            final_review_statuses = ["for_final_review", "accepted", "hired"]
            accepted_statuses = ["accepted", "hired"]

            # Count applications at each stage
            counts = {
                "total": total,
                "entered_review": sum(1 for a in applications if a.get("status") in entered_review_statuses),
                "shortlisted": sum(1 for a in applications if a.get("status") in shortlisted_statuses),
                "interview_stage": sum(1 for a in applications if a.get("status") in interview_stage_statuses),
                "interviewed": sum(1 for a in applications if a.get("status") in interviewed_statuses),
                "final_review": sum(1 for a in applications if a.get("status") in final_review_statuses),
                "accepted": sum(1 for a in applications if a.get("status") in accepted_statuses),
                "hired": sum(1 for a in applications if a.get("status") == "hired"),
                "rejected": sum(1 for a in applications if a.get("status") == "rejected"),
                "withdrawn": sum(1 for a in applications if a.get("status") == "withdrawn"),
            }

            def calc_rate(count: int) -> float:
                """Calculate conversion rate as percentage."""
                return round((count / total * 100) if total > 0 else 0.0, 2)

            funnel_stages = [
                {
                    "stage": "Total Applications",
                    "count": counts["total"],
                    "conversion_rate": 100.0,
                },
                {
                    "stage": "Under Review",
                    "count": counts["entered_review"],
                    "conversion_rate": calc_rate(counts["entered_review"]),
                },
                {
                    "stage": "Shortlisted",
                    "count": counts["shortlisted"],
                    "conversion_rate": calc_rate(counts["shortlisted"]),
                },
                {
                    "stage": "Interview Stage",
                    "count": counts["interview_stage"],
                    "conversion_rate": calc_rate(counts["interview_stage"]),
                },
                {
                    "stage": "Interviewed",
                    "count": counts["interviewed"],
                    "conversion_rate": calc_rate(counts["interviewed"]),
                },
                {
                    "stage": "Final Review",
                    "count": counts["final_review"],
                    "conversion_rate": calc_rate(counts["final_review"]),
                },
                {
                    "stage": "Accepted",
                    "count": counts["accepted"],
                    "conversion_rate": calc_rate(counts["accepted"]),
                },
                {
                    "stage": "Hired",
                    "count": counts["hired"],
                    "conversion_rate": calc_rate(counts["hired"]),
                },
            ]

            overall_conversion = calc_rate(counts["hired"])

            return self._format_response(
                funnel_stages,
                f"Funnel analysis for {total} applications",
                {
                    "position_id": position_id or "all",
                    "total_applications": total,
                    "hired": counts["hired"],
                    "rejected": counts["rejected"],
                    "withdrawn": counts["withdrawn"],
                    "conversion_rate": overall_conversion,
                }
            )

        except Exception as e:
            return self._handle_error(e, {"position_id": position_id})


class GetPositionApplicationSummaryTool(TUPSAFETool):
    """Tool for getting position application summary.

    This tool provides a high-level overview of the recruitment landscape, showing
    which positions are available and how many applications each has received.
    Useful for understanding overall hiring activity and position popularity.
    """

    name: str = "get_position_application_summary"
    description: str = """
    Get a summary of open positions and their application metrics.

    Args:
        include_applicant_names: If True, include applicant names for each position (default: False)
        applicant_names_limit: Maximum number of applicant names to show per position (default: 10, max: 50)

    Returns:
        Dictionary containing:
        - total_open_positions: Count of positions with 'open' status
        - positions: List of open positions with application metrics
        - total_applications: Total applications across all open positions
        - average_applications_per_position: Mean applications per position

        When include_applicant_names=True, each position also includes:
        - applicants: List of applicants with full_name, applicant_id, application_status, applied_at

    Example:
        >>> result = get_position_application_summary()
        >>> print(f"Open Positions: {result['total_open_positions']}")
        >>> print(f"Total Applications: {result['total_applications']}")

        >>> result = get_position_application_summary(include_applicant_names=True, applicant_names_limit=5)
        >>> for position in result['data']:
        ...     print(f"{position['title']}: {len(position.get('applicants', []))} applicants")
    """
    args_schema: type[BaseModel] = PositionApplicationSummaryInput

    def _run(self, include_applicant_names: bool = False, applicant_names_limit: int = 10) -> str:
        """Execute the position application summary query."""
        try:
            # Get all open positions
            positions_response = self._query(
                "open_positions",
                "id,position_title,employment_category,department_id,created_at,application_deadline"
            ).eq("status", "open").execute()

            positions = positions_response.data if positions_response.data else []

            if not positions:
                return self._format_response(
                    [],
                    "No open positions found",
                    {
                        "total_open_positions": 0,
                        "total_applications": 0,
                        "average_applications_per_position": 0.0,
                    }
                )

            # Get department IDs
            dept_ids = list(set(p["department_id"] for p in positions if p.get("department_id")))

            # Get department details
            departments_data = {}
            if dept_ids:
                departments_response = self._query("departments", "id,name,code").in_("id", dept_ids).execute()

                for dept in (departments_response.data if departments_response.data else []):
                    departments_data[dept["id"]] = {
                        "name": dept.get("name"),
                        "code": dept.get("code"),
                    }

            # Get position IDs
            position_ids = [p["id"] for p in positions]

            # Get all applications for these positions
            app_fields = "id,position_id,status,created_at"
            if include_applicant_names:
                app_fields += ",user_id"

            applications_response = self._query(
                "job_applications",
                app_fields
            ).in_("position_id", position_ids).execute()

            applications = applications_response.data if applications_response.data else []

            # Count applications by position and status
            position_app_stats = {}
            position_applications = {}  # Store applications grouped by position

            for app in applications:
                pos_id = app["position_id"]
                if pos_id not in position_app_stats:
                    position_app_stats[pos_id] = {
                        "total": 0,
                        "active": 0,
                        "accepted": 0,
                    }
                    position_applications[pos_id] = []

                position_app_stats[pos_id]["total"] += 1
                position_applications[pos_id].append(app)

                app_status = app.get("status")
                if app_status not in ["rejected", "withdrawn", "hired"]:
                    position_app_stats[pos_id]["active"] += 1
                if app_status == "accepted":
                    position_app_stats[pos_id]["accepted"] += 1

            # Get applicant profile data if requested
            applicants_data = {}
            if include_applicant_names and applications:
                # Get unique user IDs from all applications
                user_ids = list(set(app["user_id"] for app in applications if app.get("user_id")))

                if user_ids:
                    # Query profiles table for applicant information
                    profiles_response = self._query(
                        "profiles",
                        "user_id,first_name,middle_name,last_name,name_extension,applicant_id"
                    ).in_("user_id", user_ids).execute()

                    profiles = profiles_response.data if profiles_response.data else []

                    # Build lookup map
                    for profile in profiles:
                        user_id = profile.get("user_id")
                        if user_id:
                            applicants_data[user_id] = {
                                "first_name": profile.get("first_name"),
                                "middle_name": profile.get("middle_name"),
                                "last_name": profile.get("last_name"),
                                "name_extension": profile.get("name_extension"),
                                "applicant_id": profile.get("applicant_id"),
                            }

            # Build result
            positions_list = []
            for pos in positions:
                pos_id = pos.get("id")
                dept = departments_data.get(pos.get("department_id"), {})
                stats = position_app_stats.get(pos_id, {"total": 0, "active": 0, "accepted": 0})

                position_obj = {
                    "id": pos_id,
                    "title": pos.get("position_title"),
                    "employment_category": pos.get("employment_category"),
                    "department_name": dept.get("name"),
                    "department_code": dept.get("code"),
                    "application_count": stats["total"],
                    "active_applications": stats["active"],
                    "accepted_applications": stats["accepted"],
                    "created_at": pos.get("created_at"),
                    "application_deadline": pos.get("application_deadline"),
                }

                # Add applicant names if requested
                if include_applicant_names and pos_id in position_applications:
                    applicants_list = []
                    apps = position_applications[pos_id][:applicant_names_limit]

                    for app in apps:
                        user_id = app.get("user_id")
                        profile_data = applicants_data.get(user_id, {})

                        if profile_data:
                            full_name = format_full_name(
                                profile_data.get("first_name"),
                                profile_data.get("last_name"),
                                profile_data.get("middle_name")
                            )

                            applicants_list.append({
                                "full_name": full_name,
                                "applicant_id": profile_data.get("applicant_id"),
                                "application_status": app.get("status"),
                                "applied_at": app.get("created_at"),
                            })

                    position_obj["applicants"] = applicants_list

                positions_list.append(position_obj)

            # Sort by application count descending
            positions_list.sort(key=lambda x: x["application_count"], reverse=True)

            total_positions = len(positions_list)
            total_applications = sum(p["application_count"] for p in positions_list)
            avg_applications = (
                round(total_applications / total_positions, 2) if total_positions > 0 else 0.0
            )

            return self._format_response(
                positions_list,
                f"Found {total_positions} open positions with {total_applications} total applications",
                {
                    "total_open_positions": total_positions,
                    "total_applications": total_applications,
                    "average_applications_per_position": avg_applications,
                }
            )

        except Exception as e:
            return self._handle_error(e)


# Create tool instances for export
get_job_application_stats = GetJobApplicationStatsTool()
get_open_positions_by_department = GetOpenPositionsByDepartmentTool()
get_application_funnel_metrics = GetApplicationFunnelMetricsTool()
get_position_application_summary = GetPositionApplicationSummaryTool()
