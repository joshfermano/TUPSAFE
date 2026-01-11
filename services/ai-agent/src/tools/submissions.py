"""
PDS and SALN Submission Query Tools

This module provides tools for querying PDS (Personal Data Sheet) and SALN
(Statement of Assets, Liabilities, and Net Worth) submission data from the database.

These tools are used by the AI agent to answer questions about submission statistics,
status breakdowns, and department-level insights.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string
from src.tools.base import TUPSAFETool


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


class GetSubmissionCountTool(TUPSAFETool):
    """Get the count of PDS or SALN submissions filtered by status.

    This tool counts submissions in the database, optionally filtering by their approval status.
    Useful for understanding submission volumes and approval pipeline.
    """

    name: str = "get_submission_count"
    description: str = """Get the count of PDS or SALN submissions filtered by status.

    This tool counts submissions in the database, optionally filtering by their approval status.
    Useful for understanding submission volumes and approval pipeline.

    Args:
        submission_type: Type of submission to count ('pds' or 'saln')
        status: Optional status filter ('draft', 'submitted', 'reviewing', 'approved', 'rejected')

    Returns:
        JSON string containing:
        - count: Total number of matching submissions
        - submission_type: Type that was queried
        - status: Status filter applied (or 'all')

    Example:
        >>> result = get_submission_count("pds", "approved")
        >>> # Returns: {"data": [{"count": 42, "submission_type": "pds", "status": "approved"}], ...}
    """
    args_schema: type[BaseModel] = SubmissionCountInput

    def _run(self, submission_type: str, status: Optional[str] = None) -> str:
        """Execute the tool to get submission count.

        Args:
            submission_type: Type of submission to count ('pds' or 'saln')
            status: Optional status filter

        Returns:
            JSON string with count results
        """
        try:
            # Validate inputs
            submission_type = validate_enum(
                submission_type,
                ["pds", "saln"],
                "submission_type"
            )

            if status:
                status = validate_enum(
                    status,
                    ["draft", "submitted", "reviewing", "approved", "rejected"],
                    "status"
                )

            # Determine table name
            table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

            # Build query
            query = self._query(table, "id")

            if status:
                query = query.eq("status", sanitize_string(status))

            # Execute query
            response = query.execute()
            count = len(response.data) if response.data else 0

            return self._format_response(
                [{"count": count, "submission_type": submission_type, "status": status or "all"}],
                f"Found {count} {submission_type} submissions"
            )

        except Exception as e:
            return self._handle_error(e, {"submission_type": submission_type, "status": status})


class GetSubmissionsByDepartmentTool(TUPSAFETool):
    """Get a breakdown of submissions by department, optionally filtered by year.

    This tool provides department-level statistics showing submission volumes across
    the organization. Useful for identifying departments with high/low compliance.
    """

    name: str = "get_submissions_by_department"
    description: str = """Get a breakdown of submissions by department, optionally filtered by year.

    This tool provides department-level statistics showing submission volumes across
    the organization. Useful for identifying departments with high/low compliance.

    Args:
        submission_type: Type of submission ('pds' or 'saln')
        year: Optional year filter to focus on specific annual submissions

    Returns:
        JSON string containing:
        - departments: List of departments with submission counts
        - submission_type: Type that was queried
        - year: Year filter applied (or 'all')
        - total_submissions: Total across all departments

    Example:
        >>> result = get_submissions_by_department("saln", 2025)
        >>> # Returns departments ranked by submission count for 2025
    """
    args_schema: type[BaseModel] = SubmissionsByDepartmentInput

    def _run(self, submission_type: str, year: Optional[int] = None) -> str:
        """Execute the tool to get submissions by department.

        Args:
            submission_type: Type of submission ('pds' or 'saln')
            year: Optional year filter

        Returns:
            JSON string with department breakdown
        """
        try:
            # Validate inputs
            submission_type = validate_enum(
                submission_type,
                ["pds", "saln"],
                "submission_type"
            )

            if year is not None:
                year = validate_positive_integer(year, "year", allow_zero=False)

            table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

            # Build query - select all submissions with user_id
            query = self._query(table, "id,user_id,year")

            if year:
                query = query.eq("year", year)

            submissions_response = query.execute()
            submissions = submissions_response.data or []

            if not submissions:
                return self._format_response(
                    [],
                    "No submissions found",
                    {"submission_type": submission_type, "year": year or "all", "total_submissions": 0}
                )

            # Get unique user IDs
            user_ids = list(set(sub["user_id"] for sub in submissions))

            # Get profiles with department info for these users
            profiles_response = self._query("profiles", "id,department_id").eq(
                "user_type", "employee"
            ).in_("id", user_ids).execute()

            profiles = profiles_response.data or []

            # Get unique department IDs
            dept_ids = list(set(p["department_id"] for p in profiles if p["department_id"]))

            if not dept_ids:
                return self._format_response(
                    [],
                    "No department data found",
                    {"submission_type": submission_type, "year": year or "all", "total_submissions": len(submissions)}
                )

            # Get department details
            departments_response = self._query("departments", "id,name,code").in_(
                "id", dept_ids
            ).execute()

            departments_data = departments_response.data or []

            # Create mapping of user_id to department_id
            user_to_dept = {p["id"]: p["department_id"] for p in profiles}

            # Aggregate submissions by department
            dept_counts = {}
            for sub in submissions:
                dept_id = user_to_dept.get(sub["user_id"])
                if dept_id:
                    dept_counts[dept_id] = dept_counts.get(dept_id, 0) + 1

            # Build result with department details
            departments_list = []
            for dept in departments_data:
                dept_id = dept["id"]
                if dept_id in dept_counts:
                    departments_list.append({
                        "id": dept_id,
                        "name": dept.get("name", "Unknown Department"),
                        "code": dept.get("code"),
                        "count": dept_counts[dept_id],
                    })

            # Sort by count descending
            departments_list.sort(key=lambda x: x["count"], reverse=True)

            total = sum(d["count"] for d in departments_list)

            return self._format_response(
                departments_list,
                f"Found {len(departments_list)} departments with {total} total submissions",
                {"submission_type": submission_type, "year": year or "all", "total_submissions": total}
            )

        except Exception as e:
            return self._handle_error(e, {"submission_type": submission_type, "year": year})


class GetPendingSubmissionsTool(TUPSAFETool):
    """Get the count of submissions pending review (status: 'submitted' or 'reviewing').

    This tool helps identify workload for HR/admin staff by counting submissions
    awaiting approval action.
    """

    name: str = "get_pending_submissions"
    description: str = """Get the count of submissions pending review (status: 'submitted' or 'reviewing').

    This tool helps identify workload for HR/admin staff by counting submissions
    awaiting approval action.

    Args:
        submission_type: Optional filter for 'pds' or 'saln'. If None, counts both.

    Returns:
        JSON string containing:
        - pending_count: Total pending submissions
        - submitted_count: Submissions in 'submitted' status
        - reviewing_count: Submissions in 'reviewing' status
        - submission_type: Type filter applied (or 'all')

    Example:
        >>> result = get_pending_submissions()
        >>> # Returns: {"data": [{"pending_count": 15, "submitted_count": 10, "reviewing_count": 5, ...}], ...}
    """
    args_schema: type[BaseModel] = PendingSubmissionsInput

    def _run(self, submission_type: Optional[str] = None) -> str:
        """Execute the tool to get pending submissions count.

        Args:
            submission_type: Optional filter for 'pds' or 'saln'

        Returns:
            JSON string with pending submission counts
        """
        try:
            # Validate input
            if submission_type:
                submission_type = validate_enum(
                    submission_type,
                    ["pds", "saln"],
                    "submission_type"
                )

            if submission_type:
                table = "pds_submissions" if submission_type == "pds" else "saln_submissions"
                tables = [table]
            else:
                tables = ["pds_submissions", "saln_submissions"]

            results = {"submitted": 0, "reviewing": 0}

            for table in tables:
                # Count submitted status
                submitted_response = self._query(table, "id").eq(
                    "status", "submitted"
                ).execute()

                results["submitted"] += len(submitted_response.data) if submitted_response.data else 0

                # Count reviewing status
                reviewing_response = self._query(table, "id").eq(
                    "status", "reviewing"
                ).execute()

                results["reviewing"] += len(reviewing_response.data) if reviewing_response.data else 0

            total_pending = results["submitted"] + results["reviewing"]

            return self._format_response(
                [{
                    "pending_count": total_pending,
                    "submitted_count": results["submitted"],
                    "reviewing_count": results["reviewing"],
                    "submission_type": submission_type or "all"
                }],
                f"Found {total_pending} pending submissions ({results['submitted']} submitted, {results['reviewing']} reviewing)"
            )

        except Exception as e:
            return self._handle_error(e, {"submission_type": submission_type})


class GetOfficesWithMostSubmissionsTool(TUPSAFETool):
    """Get top offices/departments ranked by total submission count.

    This tool identifies which offices have the highest submission volumes,
    useful for recognizing high compliance or targeting low performers.
    """

    name: str = "get_offices_with_most_submissions"
    description: str = """Get top offices/departments ranked by total submission count.

    This tool identifies which offices have the highest submission volumes,
    useful for recognizing high compliance or targeting low performers.

    Args:
        submission_type: Type of submission ('pds' or 'saln')
        limit: Maximum number of top offices to return (1-50)

    Returns:
        JSON string containing:
        - top_offices: List of offices with submission counts, ranked
        - submission_type: Type that was queried
        - limit: Number of results returned

    Example:
        >>> result = get_offices_with_most_submissions("pds", limit=5)
        >>> # Returns top 5 offices by PDS submissions with detailed statistics
    """
    args_schema: type[BaseModel] = OfficesWithMostSubmissionsInput

    def _run(self, submission_type: str, limit: int = 10) -> str:
        """Execute the tool to get offices with most submissions.

        Args:
            submission_type: Type of submission ('pds' or 'saln')
            limit: Maximum number of top offices to return

        Returns:
            JSON string with top offices ranked by submission count
        """
        try:
            # Validate inputs
            submission_type = validate_enum(
                submission_type,
                ["pds", "saln"],
                "submission_type"
            )

            limit = validate_positive_integer(limit, "limit", allow_zero=False)
            limit = max(1, min(limit, 50))  # Clamp between 1 and 50

            table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

            # Get all submissions with user_id and status
            submissions_response = self._query(table, "id,user_id,status").execute()
            submissions = submissions_response.data or []

            if not submissions:
                return self._format_response(
                    [],
                    "No submissions found",
                    {"submission_type": submission_type, "limit": limit}
                )

            # Get unique user IDs
            user_ids = list(set(sub["user_id"] for sub in submissions))

            # Get profiles with department info
            profiles_response = self._query("profiles", "id,department_id").eq(
                "user_type", "employee"
            ).in_("id", user_ids).execute()

            profiles = profiles_response.data or []

            # Get unique department IDs
            dept_ids = list(set(p["department_id"] for p in profiles if p["department_id"]))

            if not dept_ids:
                return self._format_response(
                    [],
                    "No department data found",
                    {"submission_type": submission_type, "limit": limit}
                )

            # Get department details
            departments_response = self._query("departments", "id,name,code,office_type").in_(
                "id", dept_ids
            ).eq("is_active", True).execute()

            departments_data = departments_response.data or []

            # Create mapping of user_id to department_id
            user_to_dept = {p["id"]: p["department_id"] for p in profiles}

            # Aggregate submissions by department with status breakdown
            dept_stats = {}
            for sub in submissions:
                dept_id = user_to_dept.get(sub["user_id"])
                if dept_id:
                    if dept_id not in dept_stats:
                        dept_stats[dept_id] = {
                            "total": 0,
                            "approved": 0,
                            "submitted": 0,
                            "reviewing": 0,
                        }
                    dept_stats[dept_id]["total"] += 1
                    status = sub.get("status")
                    if status == "approved":
                        dept_stats[dept_id]["approved"] += 1
                    elif status == "submitted":
                        dept_stats[dept_id]["submitted"] += 1
                    elif status == "reviewing":
                        dept_stats[dept_id]["reviewing"] += 1

            # Build result with department details
            offices_list = []
            for dept in departments_data:
                dept_id = dept["id"]
                if dept_id in dept_stats:
                    stats = dept_stats[dept_id]
                    offices_list.append({
                        "id": dept_id,
                        "name": dept.get("name"),
                        "code": dept.get("code"),
                        "office_type": dept.get("office_type"),
                        "total_submissions": stats["total"],
                        "approved": stats["approved"],
                        "submitted": stats["submitted"],
                        "reviewing": stats["reviewing"],
                    })

            # Sort by total submissions descending, then by approved count
            offices_list.sort(
                key=lambda x: (x["total_submissions"], x["approved"]),
                reverse=True
            )

            # Limit results and add rank
            top_offices = [
                {**office, "rank": idx + 1}
                for idx, office in enumerate(offices_list[:limit])
            ]

            return self._format_response(
                top_offices,
                f"Found top {len(top_offices)} offices by {submission_type} submissions",
                {"submission_type": submission_type, "limit": limit}
            )

        except Exception as e:
            return self._handle_error(e, {"submission_type": submission_type, "limit": limit})


# Create tool instances for export
get_submission_count = GetSubmissionCountTool()
get_submissions_by_department = GetSubmissionsByDepartmentTool()
get_pending_submissions = GetPendingSubmissionsTool()
get_offices_with_most_submissions = GetOfficesWithMostSubmissionsTool()
