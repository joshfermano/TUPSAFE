"""User and Employee Query Tools

This module provides tools for querying user and employee data from the database,
including counts, active status, and submission participation statistics.

These tools help the AI agent answer questions about the user base, workforce composition,
and employee engagement with the PDS/SALN systems.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string
from src.tools.base import TUPSAFETool
from src.utils.formatters import calculate_age, format_full_name


# ============================================================================
# Input Schemas
# ============================================================================


class EmployeeCountInput(BaseModel):
    """Input schema for counting employees."""

    employment_category: Optional[Literal["faculty", "administrative", "contractual"]] = Field(
        None, description="Filter by employment category. If None, counts all employees."
    )
    include_inactive: bool = Field(
        False, description="Whether to include inactive employees in the count"
    )
    include_details: bool = Field(
        False, description="If True, include a list of employee names with the count"
    )
    details_limit: int = Field(
        20, ge=1, le=100, description="Maximum number of employee names to return when include_details is True"
    )


class ApplicantCountInput(BaseModel):
    """Input schema for counting applicants."""

    account_status: Optional[Literal["pending", "active", "suspended", "rejected"]] = Field(
        None, description="Filter by account status. If None, counts all applicants."
    )
    include_details: bool = Field(
        False, description="If True, include a list of applicant names with the count"
    )
    details_limit: int = Field(
        20, ge=1, le=100, description="Maximum number of applicant names to return when include_details is True"
    )


class EmployeesWithSubmissionsInput(BaseModel):
    """Input schema for counting employees with submissions."""

    submission_type: Literal["pds", "saln", "both"] = Field(
        ..., description="Type of submission: 'pds', 'saln', or 'both'"
    )
    year: Optional[int] = Field(
        None, description="Filter by specific year. If None, includes all years."
    )


# ============================================================================
# Tool Classes
# ============================================================================


class GetEmployeeCountTool(TUPSAFETool):
    """Get the count of employees in the system, optionally filtered by employment category and active status.

    This tool provides workforce statistics, helping understand the size and composition
    of the employee base that needs to maintain PDS/SALN compliance.
    Optionally includes detailed employee information with names, IDs, and ages.
    """

    name: str = "get_employee_count"
    description: str = """Get the count of employees in the system, optionally filtered by employment category and active status.

Returns:
- total_employees: Total count of employees
- employment_category: Category filter applied (or 'all')
- include_inactive: Whether inactive employees are included
- breakdown: Count by employment category
- employees: List of employee details (when include_details=True)

Example: get_employee_count(employment_category="faculty", include_inactive=False, include_details=True)"""
    args_schema: type[BaseModel] = EmployeeCountInput

    def _run(
        self,
        employment_category: Optional[str] = None,
        include_inactive: bool = False,
        include_details: bool = False,
        details_limit: int = 20,
    ) -> str:
        """Execute the employee count query.

        Args:
            employment_category: Optional filter for 'faculty', 'administrative', or 'contractual'
            include_inactive: Whether to include employees with is_active=false (default: False)
            include_details: Whether to include employee names and details (default: False)
            details_limit: Maximum number of employees to return in details (default: 20)

        Returns:
            JSON string with employee count, breakdown by category, and optional employee details
        """
        try:
            # Sanitize employment_category if provided
            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Determine which columns to select
            select_columns = (
                "id,first_name,last_name,middle_name,employee_id,department_id,position_title,date_of_birth"
                if include_details
                else "id"
            )

            # Build base query for total count
            query = self._query("profiles", select_columns).eq("user_type", "employee")

            if not include_inactive:
                query = query.eq("is_active", True)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Limit if we're getting details
            if include_details:
                query = query.limit(details_limit)

            # Execute total count query
            total_response = query.execute()
            total_count = len(total_response.data) if total_response.data else 0

            # Get breakdown by category
            breakdown_query = self._query("profiles", "employment_category").eq(
                "user_type", "employee"
            )

            if not include_inactive:
                breakdown_query = breakdown_query.eq("is_active", True)

            # Execute breakdown query
            breakdown_response = breakdown_query.execute()
            breakdown_data = breakdown_response.data or []

            # Aggregate by employment category
            breakdown = {}
            for record in breakdown_data:
                category = record.get("employment_category") or "not_applicable"
                breakdown[category] = breakdown.get(category, 0) + 1

            # Format response
            result_data = {
                "total_employees": total_count,
                "employment_category": employment_category or "all",
                "include_inactive": include_inactive,
                "breakdown": breakdown,
            }

            # Add employee details if requested
            if include_details and total_response.data:
                employees = []
                for emp in total_response.data:
                    full_name = format_full_name(
                        emp.get("first_name"),
                        emp.get("last_name"),
                        emp.get("middle_name")
                    )
                    age = calculate_age(emp.get("date_of_birth")) if emp.get("date_of_birth") else None

                    employees.append({
                        "id": emp.get("id"),
                        "name": full_name,
                        "employee_id": emp.get("employee_id"),
                        "department_id": emp.get("department_id"),
                        "position_title": emp.get("position_title"),
                        "age": age
                    })

                result_data["employees"] = employees

            message = (
                f"Found {total_count} employees"
                + (f" in {employment_category} category" if employment_category else "")
            )

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "employment_category": employment_category or "all",
                    "include_inactive": include_inactive,
                    "include_details": include_details,
                },
            )


class GetApplicantCountTool(TUPSAFETool):
    """Get the count of applicants in the system, optionally filtered by account status.

    This tool helps track recruitment pipeline metrics by counting applicants at various
    stages of the account approval process.
    Optionally includes detailed applicant information with names, IDs, and ages.
    """

    name: str = "get_applicant_count"
    description: str = """Get the count of applicants in the system, optionally filtered by account status.

Returns:
- total_applicants: Total count of applicants
- account_status: Status filter applied (or 'all')
- breakdown: Count by account status
- applicants: List of applicant details (when include_details=True)

Example: get_applicant_count(account_status="pending", include_details=True)"""
    args_schema: type[BaseModel] = ApplicantCountInput

    def _run(
        self,
        account_status: Optional[str] = None,
        include_details: bool = False,
        details_limit: int = 20,
    ) -> str:
        """Execute the applicant count query.

        Args:
            account_status: Optional filter for 'pending', 'active', 'suspended', or 'rejected'
            include_details: Whether to include applicant names and details (default: False)
            details_limit: Maximum number of applicants to return in details (default: 20)

        Returns:
            JSON string with applicant count, breakdown by status, and optional applicant details
        """
        try:
            # Sanitize account_status if provided
            if account_status:
                account_status = sanitize_string(account_status)

            # Determine which columns to select
            select_columns = (
                "id,first_name,last_name,middle_name,applicant_id,date_of_birth,email"
                if include_details
                else "id"
            )

            # Build query for total count
            query = self._query("profiles", select_columns).eq("user_type", "applicant")

            if account_status:
                query = query.eq("account_status", account_status)

            # Limit if we're getting details
            if include_details:
                query = query.limit(details_limit)

            # Execute total count query
            total_response = query.execute()
            total_count = len(total_response.data) if total_response.data else 0

            # Get breakdown by status
            breakdown_query = self._query("profiles", "account_status").eq(
                "user_type", "applicant"
            )

            breakdown_response = breakdown_query.execute()
            breakdown_data = breakdown_response.data or []

            # Aggregate by account status
            breakdown = {}
            for record in breakdown_data:
                status = record.get("account_status") or "unknown"
                breakdown[status] = breakdown.get(status, 0) + 1

            # Format response
            result_data = {
                "total_applicants": total_count,
                "account_status": account_status or "all",
                "breakdown": breakdown,
            }

            # Add applicant details if requested
            if include_details and total_response.data:
                applicants = []
                for app in total_response.data:
                    full_name = format_full_name(
                        app.get("first_name"),
                        app.get("last_name"),
                        app.get("middle_name")
                    )
                    age = calculate_age(app.get("date_of_birth")) if app.get("date_of_birth") else None

                    applicants.append({
                        "id": app.get("id"),
                        "name": full_name,
                        "applicant_id": app.get("applicant_id"),
                        "email": app.get("email"),
                        "age": age
                    })

                result_data["applicants"] = applicants

            message = (
                f"Found {total_count} applicants"
                + (f" with {account_status} status" if account_status else "")
            )

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "account_status": account_status or "all",
                    "include_details": include_details,
                },
            )


class GetEmployeesWithSubmissionsTool(TUPSAFETool):
    """Get the count of employees who have submitted PDS/SALN, optionally filtered by year.

    This tool measures employee engagement with compliance requirements by counting
    how many employees have active submissions on file.
    """

    name: str = "get_employees_with_submissions"
    description: str = """Get the count of employees who have submitted PDS/SALN, optionally filtered by year.

Returns:
- employees_with_submissions: Count of employees with submissions
- total_employees: Total active employees (for calculating percentage)
- submission_type: Type that was queried
- year: Year filter applied (or 'all')
- compliance_rate: Percentage of employees with submissions

Example: get_employees_with_submissions(submission_type="saln", year=2025)"""
    args_schema: type[BaseModel] = EmployeesWithSubmissionsInput

    def _run(self, submission_type: str, year: Optional[int] = None) -> str:
        """Execute the employees with submissions query.

        Args:
            submission_type: Type to check - 'pds', 'saln', or 'both'
            year: Optional year filter for annual submissions

        Returns:
            JSON string with submission statistics and compliance rate
        """
        try:
            # Sanitize submission_type
            submission_type = sanitize_string(submission_type)

            # Validate submission_type
            if submission_type not in ["pds", "saln", "both"]:
                raise ValueError(
                    f"Invalid submission_type: {submission_type}. Must be 'pds', 'saln', or 'both'"
                )

            # Validate year if provided
            if year is not None and (year < 2000 or year > 2100):
                raise ValueError(f"Invalid year: {year}. Must be between 2000 and 2100")

            # Get total active employees
            total_response = (
                self._query("profiles", "id")
                .eq("user_type", "employee")
                .eq("is_active", True)
                .eq("account_status", "active")
                .execute()
            )

            total_employees = len(total_response.data) if total_response.data else 0

            # Handle different submission types
            if submission_type == "both":
                employees_with_submissions = self._count_employees_with_both_submissions(
                    total_response.data or [], year
                )
            else:
                employees_with_submissions = self._count_employees_with_single_submission(
                    submission_type, total_response.data or [], year
                )

            # Calculate compliance rate
            compliance_rate = (
                (employees_with_submissions / total_employees * 100)
                if total_employees > 0
                else 0.0
            )

            # Format response
            result_data = {
                "employees_with_submissions": employees_with_submissions,
                "total_employees": total_employees,
                "submission_type": submission_type,
                "year": year or "all",
                "compliance_rate": round(compliance_rate, 2),
            }

            message = (
                f"Found {employees_with_submissions} of {total_employees} employees "
                f"with {submission_type} submissions "
                f"({compliance_rate:.1f}% compliance)"
            )

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "submission_type": submission_type,
                    "year": year or "all",
                },
            )

    def _count_employees_with_both_submissions(
        self, employees: list[dict], year: Optional[int]
    ) -> int:
        """Count employees who have both PDS and SALN submissions.

        Args:
            employees: List of employee profile records
            year: Optional year filter

        Returns:
            Count of employees with both submission types
        """
        if not employees:
            return 0

        employee_ids = [e["id"] for e in employees]

        # Check PDS submissions
        pds_query = self._query("pds_submissions", "user_id").in_("user_id", employee_ids)
        if year:
            pds_query = pds_query.eq("year", year)

        pds_response = pds_query.execute()
        pds_user_ids = set(s["user_id"] for s in (pds_response.data or []))

        # Check SALN submissions
        saln_query = self._query("saln_submissions", "user_id").in_("user_id", employee_ids)
        if year:
            saln_query = saln_query.eq("year", year)

        saln_response = saln_query.execute()
        saln_user_ids = set(s["user_id"] for s in (saln_response.data or []))

        # Union of both sets (employees with at least one submission type)
        return len(pds_user_ids | saln_user_ids)

    def _count_employees_with_single_submission(
        self, submission_type: str, employees: list[dict], year: Optional[int]
    ) -> int:
        """Count employees who have a specific submission type.

        Args:
            submission_type: Either 'pds' or 'saln'
            employees: List of employee profile records
            year: Optional year filter

        Returns:
            Count of employees with the specified submission type
        """
        if not employees:
            return 0

        employee_ids = [e["id"] for e in employees]

        # Determine table name
        table = "pds_submissions" if submission_type == "pds" else "saln_submissions"

        # Build query
        query = self._query(table, "user_id").in_("user_id", employee_ids)
        if year:
            query = query.eq("year", year)

        # Execute query
        response = query.execute()
        submissions = response.data or []

        # Get unique user IDs
        user_ids_with_submissions = set(s["user_id"] for s in submissions)

        return len(user_ids_with_submissions)


# ============================================================================
# Tool Instances (for LangChain agent)
# ============================================================================

get_employee_count = GetEmployeeCountTool()
get_applicant_count = GetApplicantCountTool()
get_employees_with_submissions = GetEmployeesWithSubmissionsTool()
