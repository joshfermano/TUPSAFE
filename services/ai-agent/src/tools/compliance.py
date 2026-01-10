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

from pydantic import BaseModel, Field

from src.db.validators import validate_uuid
from src.tools.base import TUPSAFETool


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


class GetSALNComplianceRateTool(TUPSAFETool):
    """Calculate SALN compliance rate for a specific year, optionally filtered by department.

    SALN (Statement of Assets, Liabilities, and Net Worth) is required annually for all
    government employees per CSC regulations. This tool calculates what percentage of
    active employees have filed SALN for the specified year.

    Compliance is measured as: (Employees with approved SALN / Total active employees) × 100
    """

    name: str = "get_saln_compliance_rate"
    description: str = """
    Calculate SALN compliance rate for a specific year, optionally filtered by department.

    SALN (Statement of Assets, Liabilities, and Net Worth) is required annually for all
    government employees per CSC regulations.

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
        >>> result = get_saln_compliance_rate(2025)
        >>> print(f"SALN Compliance for 2025: {result['compliance_rate']:.1f}%")
    """
    args_schema: type[BaseModel] = SALNComplianceRateInput

    def _run(self, year: int, department_id: Optional[str] = None) -> str:
        """Execute the SALN compliance rate calculation.

        Args:
            year: Year for SALN filing
            department_id: Optional department UUID filter

        Returns:
            JSON string with compliance metrics
        """
        try:
            # Validate inputs
            if year <= 0:
                raise ValueError("Year must be a positive integer")

            dept_id_validated = None
            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                dept_id_validated = department_id

            # Get total active employees
            total_query = self._query("profiles", "id").eq("user_type", "employee").eq("is_active", True).eq("account_status", "active")

            if dept_id_validated:
                total_query = total_query.eq("department_id", dept_id_validated)

            total_response = total_query.execute()
            total_employees = len(total_response.data) if total_response.data else 0

            if total_employees == 0:
                result = {
                    "year": year,
                    "department_id": department_id or "all",
                    "total_employees": 0,
                    "employees_compliant": 0,
                    "employees_pending": 0,
                    "employees_non_compliant": 0,
                    "compliance_rate": 0.0,
                    "submission_rate": 0.0,
                }
                return self._format_single_response(
                    result,
                    f"No active employees found for SALN compliance calculation (year: {year})"
                )

            # Get all active employee IDs
            employees_query = self._query("profiles", "id").eq("user_type", "employee").eq("is_active", True).eq("account_status", "active")

            if dept_id_validated:
                employees_query = employees_query.eq("department_id", dept_id_validated)

            employees_response = employees_query.execute()
            employee_ids = [e["id"] for e in (employees_response.data or [])]

            if not employee_ids:
                result = {
                    "year": year,
                    "department_id": department_id or "all",
                    "total_employees": total_employees,
                    "employees_compliant": 0,
                    "employees_pending": 0,
                    "employees_non_compliant": total_employees,
                    "compliance_rate": 0.0,
                    "submission_rate": 0.0,
                }
                return self._format_single_response(
                    result,
                    f"No employee IDs found for SALN compliance calculation (year: {year})"
                )

            # Get approved SALN submissions for this year
            approved_response = self._query("saln_submissions", "user_id").eq("year", year).eq("status", "approved").in_("user_id", employee_ids).execute()

            approved_user_ids = set(s["user_id"] for s in (approved_response.data or []))
            employees_compliant = len(approved_user_ids)

            # Get pending SALN submissions for this year
            pending_response = self._query("saln_submissions", "user_id").eq("year", year).in_("status", ["submitted", "reviewing"]).in_("user_id", employee_ids).execute()

            pending_user_ids = set(s["user_id"] for s in (pending_response.data or []))
            employees_pending = len(pending_user_ids)

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

            result = {
                "year": year,
                "department_id": department_id or "all",
                "total_employees": total_employees,
                "employees_compliant": employees_compliant,
                "employees_pending": employees_pending,
                "employees_non_compliant": employees_non_compliant,
                "compliance_rate": round(compliance_rate, 2),
                "submission_rate": round(submission_rate, 2),
            }

            return self._format_single_response(
                result,
                f"SALN compliance rate for {year}: {compliance_rate:.1f}% ({employees_compliant}/{total_employees} employees)"
            )

        except Exception as e:
            return self._handle_error(e, {"year": year, "department_id": department_id})


class GetPDSComplianceRateTool(TUPSAFETool):
    """Calculate PDS compliance rate, optionally filtered by department.

    PDS (Personal Data Sheet) is required for all government employees and must be kept
    up-to-date. This tool calculates what percentage of active employees have an
    approved PDS on file.

    Unlike SALN which is annual, PDS compliance is measured as having any approved PDS,
    regardless of year.
    """

    name: str = "get_pds_compliance_rate"
    description: str = """
    Calculate PDS compliance rate, optionally filtered by department.

    PDS (Personal Data Sheet) is required for all government employees and must be kept
    up-to-date. Unlike SALN which is annual, PDS compliance is measured as having any
    approved PDS on file.

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
        >>> result = get_pds_compliance_rate()
        >>> print(f"Overall PDS Compliance: {result['compliance_rate']:.1f}%")
    """
    args_schema: type[BaseModel] = PDSComplianceRateInput

    def _run(self, department_id: Optional[str] = None) -> str:
        """Execute the PDS compliance rate calculation.

        Args:
            department_id: Optional department UUID filter

        Returns:
            JSON string with compliance metrics
        """
        try:
            # Validate input
            dept_id_validated = None
            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                dept_id_validated = department_id

            # Get total active employees
            total_query = self._query("profiles", "id").eq("user_type", "employee").eq("is_active", True).eq("account_status", "active")

            if dept_id_validated:
                total_query = total_query.eq("department_id", dept_id_validated)

            total_response = total_query.execute()
            total_employees = len(total_response.data) if total_response.data else 0

            if total_employees == 0:
                result = {
                    "department_id": department_id or "all",
                    "total_employees": 0,
                    "employees_compliant": 0,
                    "employees_pending": 0,
                    "employees_non_compliant": 0,
                    "compliance_rate": 0.0,
                    "submission_rate": 0.0,
                }
                return self._format_single_response(
                    result,
                    "No active employees found for PDS compliance calculation"
                )

            # Get all active employee IDs
            employees_query = self._query("profiles", "id").eq("user_type", "employee").eq("is_active", True).eq("account_status", "active")

            if dept_id_validated:
                employees_query = employees_query.eq("department_id", dept_id_validated)

            employees_response = employees_query.execute()
            employee_ids = [e["id"] for e in (employees_response.data or [])]

            if not employee_ids:
                result = {
                    "department_id": department_id or "all",
                    "total_employees": total_employees,
                    "employees_compliant": 0,
                    "employees_pending": 0,
                    "employees_non_compliant": total_employees,
                    "compliance_rate": 0.0,
                    "submission_rate": 0.0,
                }
                return self._format_single_response(
                    result,
                    "No employee IDs found for PDS compliance calculation"
                )

            # Get approved PDS submissions
            approved_response = self._query("pds_submissions", "user_id").eq("status", "approved").in_("user_id", employee_ids).execute()

            approved_user_ids = set(s["user_id"] for s in (approved_response.data or []))
            employees_compliant = len(approved_user_ids)

            # Get pending PDS submissions
            pending_response = self._query("pds_submissions", "user_id").in_("status", ["submitted", "reviewing"]).in_("user_id", employee_ids).execute()

            pending_user_ids = set(s["user_id"] for s in (pending_response.data or []))
            employees_pending = len(pending_user_ids)

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

            result = {
                "department_id": department_id or "all",
                "total_employees": total_employees,
                "employees_compliant": employees_compliant,
                "employees_pending": employees_pending,
                "employees_non_compliant": employees_non_compliant,
                "compliance_rate": round(compliance_rate, 2),
                "submission_rate": round(submission_rate, 2),
            }

            return self._format_single_response(
                result,
                f"PDS compliance rate: {compliance_rate:.1f}% ({employees_compliant}/{total_employees} employees)"
            )

        except Exception as e:
            return self._handle_error(e, {"department_id": department_id})


class GetPendingSubmissionsByDepartmentTool(TUPSAFETool):
    """Get a breakdown of pending submissions by department.

    This tool helps HR/admin staff prioritize review workload by identifying which
    departments have submissions awaiting approval. Useful for ensuring timely processing
    and identifying bottlenecks.
    """

    name: str = "get_pending_submissions_by_department"
    description: str = """
    Get a breakdown of pending submissions (submitted or reviewing status) by department.

    This tool helps HR/admin staff prioritize review workload by identifying which
    departments have submissions awaiting approval.

    Args:
        submission_type: Optional filter for 'pds' or 'saln'. If None, includes both.

    Returns:
        Dictionary containing:
        - departments: List of departments with pending submission counts
        - submission_type: Type filter applied (or 'all')
        - total_pending: Total pending submissions across all departments

    Example:
        >>> result = get_pending_submissions_by_department("saln")
        >>> print(f"Total pending SALN: {result['total_pending']}")
    """
    args_schema: type[BaseModel] = PendingSubmissionsByDepartmentInput

    def _run(self, submission_type: Optional[str] = None) -> str:
        """Execute the pending submissions by department query.

        Args:
            submission_type: Optional filter for 'pds' or 'saln'

        Returns:
            JSON string with department breakdown
        """
        try:
            # Validate input
            if submission_type and submission_type not in ["pds", "saln"]:
                raise ValueError(f"Invalid submission_type: {submission_type}. Must be 'pds', 'saln', or None")

            # Determine which tables to query
            if submission_type:
                table = "pds_submissions" if submission_type == "pds" else "saln_submissions"
                tables = [table]
            else:
                tables = ["pds_submissions", "saln_submissions"]

            all_departments: dict[str, dict[str, Any]] = {}

            for table in tables:
                # Get all pending submissions
                submissions_response = self._query(table, "id,user_id,status").in_("status", ["submitted", "reviewing"]).execute()

                submissions = submissions_response.data or []

                if not submissions:
                    continue

                # Get unique user IDs
                user_ids = list(set(s["user_id"] for s in submissions))

                # Get profiles with department info
                profiles_response = self._query("profiles", "id,department_id").eq("user_type", "employee").in_("id", user_ids).execute()

                profiles = profiles_response.data or []

                # Get unique department IDs
                dept_ids = list(set(p["department_id"] for p in profiles if p.get("department_id")))

                if not dept_ids:
                    continue

                # Get department details
                departments_response = self._query("departments", "id,name,code").in_("id", dept_ids).eq("is_active", True).execute()

                departments_data = departments_response.data or []

                # Create mapping of user_id to department_id
                user_to_dept = {p["id"]: p.get("department_id") for p in profiles}

                # Aggregate by department
                for sub in submissions:
                    dept_id = user_to_dept.get(sub["user_id"])
                    if dept_id:
                        # Find department details
                        dept_details = next((d for d in departments_data if d["id"] == dept_id), None)
                        if dept_details:
                            if dept_id not in all_departments:
                                all_departments[dept_id] = {
                                    "id": dept_id,
                                    "name": dept_details.get("name"),
                                    "code": dept_details.get("code"),
                                    "submitted": 0,
                                    "reviewing": 0,
                                    "total_pending": 0,
                                }

                            status = sub.get("status")
                            if status == "submitted":
                                all_departments[dept_id]["submitted"] += 1
                            elif status == "reviewing":
                                all_departments[dept_id]["reviewing"] += 1

                            all_departments[dept_id]["total_pending"] += 1

            # Convert to sorted list
            departments_list = sorted(
                all_departments.values(), key=lambda x: x["total_pending"], reverse=True
            )

            total_pending = sum(dept["total_pending"] for dept in departments_list)

            result = {
                "departments": departments_list,
                "submission_type": submission_type or "all",
                "total_pending": total_pending,
            }

            return self._format_single_response(
                result,
                f"Found {total_pending} pending submissions across {len(departments_list)} departments"
            )

        except Exception as e:
            return self._handle_error(e, {"submission_type": submission_type})


# Export tool instances for LangChain agent
get_saln_compliance_rate = GetSALNComplianceRateTool()
get_pds_compliance_rate = GetPDSComplianceRateTool()
get_pending_submissions_by_department = GetPendingSubmissionsByDepartmentTool()
