"""Age and Tenure Query Tools

This module provides tools for querying employee and applicant data based on age
and tenure metrics, including oldest/youngest employees, longest-tenured staff,
and age distribution analytics.

These tools help the AI agent answer questions about workforce demographics,
age diversity, and employee tenure patterns.
"""

from typing import Optional

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string, validate_limit, validate_uuid
from src.tools.base import TUPSAFETool
from src.utils.formatters import (
    calculate_age,
    calculate_tenure_years,
    format_age_bracket,
    format_full_name,
)


# ============================================================================
# Input Schemas
# ============================================================================


class GetOldestEmployeesInput(BaseModel):
    """Input schema for getting oldest employees."""

    department_id: Optional[str] = Field(
        None, description="Filter by department UUID. If None, includes all departments."
    )
    employment_category: Optional[str] = Field(
        None,
        description="Filter by employment category (faculty, administrative, contractual). If None, includes all categories.",
    )
    limit: int = Field(
        10, description="Maximum number of employees to return (default 10, max 200)"
    )


class GetYoungestEmployeesInput(BaseModel):
    """Input schema for getting youngest employees."""

    department_id: Optional[str] = Field(
        None, description="Filter by department UUID. If None, includes all departments."
    )
    employment_category: Optional[str] = Field(
        None,
        description="Filter by employment category (faculty, administrative, contractual). If None, includes all categories.",
    )
    limit: int = Field(
        10, description="Maximum number of employees to return (default 10, max 200)"
    )


class GetOldestApplicantsInput(BaseModel):
    """Input schema for getting oldest applicants."""

    position_id: Optional[str] = Field(
        None, description="Filter by position UUID. If None, includes all applicants."
    )
    limit: int = Field(
        10, description="Maximum number of applicants to return (default 10, max 200)"
    )


class GetLongestTenureEmployeesInput(BaseModel):
    """Input schema for getting longest tenure employees."""

    department_id: Optional[str] = Field(
        None, description="Filter by department UUID. If None, includes all departments."
    )
    employment_category: Optional[str] = Field(
        None,
        description="Filter by employment category (faculty, administrative, contractual). If None, includes all categories.",
    )
    limit: int = Field(
        10, description="Maximum number of employees to return (default 10, max 200)"
    )


class GetEmployeeAgeDistributionInput(BaseModel):
    """Input schema for getting employee age distribution."""

    department_id: Optional[str] = Field(
        None, description="Filter by department UUID. If None, includes all departments."
    )
    include_names: bool = Field(
        False, description="Whether to include sample employee names in each bracket"
    )
    names_limit: int = Field(
        5, description="Maximum number of sample names per bracket (default 5)"
    )


# ============================================================================
# Tool Classes
# ============================================================================


class GetOldestEmployeesTool(TUPSAFETool):
    """Get the oldest employees in the system, ranked by age.

    This tool helps understand age demographics and identify the oldest
    employees, useful for retirement planning and workforce analytics.
    """

    name: str = "get_oldest_employees"
    description: str = """Get the oldest employees in the system, ranked by age.

Returns:
- Ranked list of employees with: rank, full_name, employee_id, date_of_birth, age, department_name
- Optionally filtered by department and employment category

Example: get_oldest_employees(department_id="uuid", employment_category="faculty", limit=10)"""
    args_schema: type[BaseModel] = GetOldestEmployeesInput

    def _run(
        self,
        department_id: Optional[str] = None,
        employment_category: Optional[str] = None,
        limit: int = 10,
    ) -> str:
        """Execute the oldest employees query.

        Args:
            department_id: Optional department UUID filter
            employment_category: Optional category filter ('faculty', 'administrative', 'contractual')
            limit: Maximum number of employees to return (default 10, max 200)

        Returns:
            JSON string with ranked list of oldest employees
        """
        try:
            # Validate and sanitize inputs
            limit = validate_limit(limit, default=10, max_limit=200)

            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                department_id = sanitize_string(department_id)

            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Build query
            query = (
                self._query(
                    "profiles",
                    "id,first_name,last_name,middle_name,employee_id,date_of_birth,department_id,departments(name)",
                )
                .eq("user_type", "employee")
                .eq("is_active", True)
                .not_.is_("date_of_birth", "null")
            )

            if department_id:
                query = query.eq("department_id", department_id)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Execute query
            response = query.execute()
            employees = response.data or []

            if not employees:
                return self._format_response(
                    [],
                    "No employees found matching the criteria",
                    {
                        "department_id": department_id or "all",
                        "employment_category": employment_category or "all",
                    },
                )

            # Calculate ages and filter out invalid dates
            employees_with_age = []
            for emp in employees:
                age = calculate_age(emp.get("date_of_birth"))
                if age is not None:
                    employees_with_age.append({**emp, "age": age})

            # Sort by age descending (oldest first)
            employees_with_age.sort(key=lambda x: x["age"], reverse=True)

            # Apply limit
            top_employees = employees_with_age[:limit]

            # Format results with ranking
            result_data = []
            for rank, emp in enumerate(top_employees, start=1):
                department_name = (
                    emp.get("departments", {}).get("name") if emp.get("departments") else None
                )

                result_data.append(
                    {
                        "rank": rank,
                        "full_name": format_full_name(
                            emp.get("first_name"), emp.get("last_name"), emp.get("middle_name")
                        ),
                        "employee_id": emp.get("employee_id"),
                        "date_of_birth": emp.get("date_of_birth"),
                        "age": emp["age"],
                        "department_name": department_name,
                    }
                )

            message = f"Found {len(result_data)} oldest employees"
            if department_id:
                message += f" in department {department_id}"
            if employment_category:
                message += f" ({employment_category} category)"

            return self._format_response(
                result_data,
                message,
                {
                    "total_matched": len(employees_with_age),
                    "returned": len(result_data),
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                    "limit": limit,
                },
            )


class GetYoungestEmployeesTool(TUPSAFETool):
    """Get the youngest employees in the system, ranked by age.

    This tool helps understand age demographics and identify the youngest
    employees, useful for diversity analytics and workforce planning.
    """

    name: str = "get_youngest_employees"
    description: str = """Get the youngest employees in the system, ranked by age.

Returns:
- Ranked list of employees with: rank, full_name, employee_id, date_of_birth, age, department_name
- Optionally filtered by department and employment category

Example: get_youngest_employees(department_id="uuid", employment_category="faculty", limit=10)"""
    args_schema: type[BaseModel] = GetYoungestEmployeesInput

    def _run(
        self,
        department_id: Optional[str] = None,
        employment_category: Optional[str] = None,
        limit: int = 10,
    ) -> str:
        """Execute the youngest employees query.

        Args:
            department_id: Optional department UUID filter
            employment_category: Optional category filter ('faculty', 'administrative', 'contractual')
            limit: Maximum number of employees to return (default 10, max 200)

        Returns:
            JSON string with ranked list of youngest employees
        """
        try:
            # Validate and sanitize inputs
            limit = validate_limit(limit, default=10, max_limit=200)

            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                department_id = sanitize_string(department_id)

            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Build query
            query = (
                self._query(
                    "profiles",
                    "id,first_name,last_name,middle_name,employee_id,date_of_birth,department_id,departments(name)",
                )
                .eq("user_type", "employee")
                .eq("is_active", True)
                .not_.is_("date_of_birth", "null")
            )

            if department_id:
                query = query.eq("department_id", department_id)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Execute query
            response = query.execute()
            employees = response.data or []

            if not employees:
                return self._format_response(
                    [],
                    "No employees found matching the criteria",
                    {
                        "department_id": department_id or "all",
                        "employment_category": employment_category or "all",
                    },
                )

            # Calculate ages and filter out invalid dates
            employees_with_age = []
            for emp in employees:
                age = calculate_age(emp.get("date_of_birth"))
                if age is not None:
                    employees_with_age.append({**emp, "age": age})

            # Sort by age ascending (youngest first)
            employees_with_age.sort(key=lambda x: x["age"])

            # Apply limit
            top_employees = employees_with_age[:limit]

            # Format results with ranking
            result_data = []
            for rank, emp in enumerate(top_employees, start=1):
                department_name = (
                    emp.get("departments", {}).get("name") if emp.get("departments") else None
                )

                result_data.append(
                    {
                        "rank": rank,
                        "full_name": format_full_name(
                            emp.get("first_name"), emp.get("last_name"), emp.get("middle_name")
                        ),
                        "employee_id": emp.get("employee_id"),
                        "date_of_birth": emp.get("date_of_birth"),
                        "age": emp["age"],
                        "department_name": department_name,
                    }
                )

            message = f"Found {len(result_data)} youngest employees"
            if department_id:
                message += f" in department {department_id}"
            if employment_category:
                message += f" ({employment_category} category)"

            return self._format_response(
                result_data,
                message,
                {
                    "total_matched": len(employees_with_age),
                    "returned": len(result_data),
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                    "limit": limit,
                },
            )


class GetOldestApplicantsTool(TUPSAFETool):
    """Get the oldest applicants in the system, ranked by age.

    This tool helps understand applicant demographics and identify the oldest
    applicants in the recruitment pipeline.
    """

    name: str = "get_oldest_applicants"
    description: str = """Get the oldest applicants in the system, ranked by age.

Returns:
- Ranked list of applicants with: rank, full_name, applicant_id, date_of_birth, age
- Optionally filtered by position

Example: get_oldest_applicants(position_id="uuid", limit=10)"""
    args_schema: type[BaseModel] = GetOldestApplicantsInput

    def _run(
        self,
        position_id: Optional[str] = None,
        limit: int = 10,
    ) -> str:
        """Execute the oldest applicants query.

        Args:
            position_id: Optional position UUID filter
            limit: Maximum number of applicants to return (default 10, max 200)

        Returns:
            JSON string with ranked list of oldest applicants
        """
        try:
            # Validate and sanitize inputs
            limit = validate_limit(limit, default=10, max_limit=200)

            if position_id:
                if not validate_uuid(position_id):
                    raise ValueError(f"Invalid position_id UUID format: {position_id}")
                position_id = sanitize_string(position_id)

            # Build base query for applicants
            applicant_query = (
                self._query(
                    "profiles",
                    "id,first_name,last_name,middle_name,applicant_id,date_of_birth",
                )
                .eq("user_type", "applicant")
                .not_.is_("date_of_birth", "null")
            )

            # Execute query
            response = applicant_query.execute()
            applicants = response.data or []

            # If position_id is specified, filter by applications to that position
            if position_id and applicants:
                applicant_ids = [a["id"] for a in applicants]

                # Get applications for this position
                app_query = (
                    self._query("job_applications", "applicant_id")
                    .eq("position_id", position_id)
                    .in_("applicant_id", applicant_ids)
                )

                app_response = app_query.execute()
                app_data = app_response.data or []

                # Get unique applicant IDs who applied to this position
                applied_ids = set(app["applicant_id"] for app in app_data)

                # Filter applicants to only those who applied
                applicants = [a for a in applicants if a["id"] in applied_ids]

            if not applicants:
                return self._format_response(
                    [],
                    "No applicants found matching the criteria",
                    {"position_id": position_id or "all"},
                )

            # Calculate ages and filter out invalid dates
            applicants_with_age = []
            for app in applicants:
                age = calculate_age(app.get("date_of_birth"))
                if age is not None:
                    applicants_with_age.append({**app, "age": age})

            # Sort by age descending (oldest first)
            applicants_with_age.sort(key=lambda x: x["age"], reverse=True)

            # Apply limit
            top_applicants = applicants_with_age[:limit]

            # Format results with ranking
            result_data = []
            for rank, app in enumerate(top_applicants, start=1):
                result_data.append(
                    {
                        "rank": rank,
                        "full_name": format_full_name(
                            app.get("first_name"), app.get("last_name"), app.get("middle_name")
                        ),
                        "applicant_id": app.get("applicant_id"),
                        "date_of_birth": app.get("date_of_birth"),
                        "age": app["age"],
                    }
                )

            message = f"Found {len(result_data)} oldest applicants"
            if position_id:
                message += f" for position {position_id}"

            return self._format_response(
                result_data,
                message,
                {
                    "total_matched": len(applicants_with_age),
                    "returned": len(result_data),
                    "position_id": position_id or "all",
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "position_id": position_id or "all",
                    "limit": limit,
                },
            )


class GetLongestTenureEmployeesTool(TUPSAFETool):
    """Get employees with the longest tenure, ranked by years of service.

    This tool helps identify senior employees based on length of service,
    useful for recognition programs and institutional knowledge retention.
    """

    name: str = "get_longest_tenure_employees"
    description: str = """Get employees with the longest tenure, ranked by years of service.

Returns:
- Ranked list of employees with: rank, full_name, employee_id, hire_date, years_of_service, department_name
- Optionally filtered by department and employment category

Example: get_longest_tenure_employees(department_id="uuid", employment_category="faculty", limit=10)"""
    args_schema: type[BaseModel] = GetLongestTenureEmployeesInput

    def _run(
        self,
        department_id: Optional[str] = None,
        employment_category: Optional[str] = None,
        limit: int = 10,
    ) -> str:
        """Execute the longest tenure employees query.

        Args:
            department_id: Optional department UUID filter
            employment_category: Optional category filter ('faculty', 'administrative', 'contractual')
            limit: Maximum number of employees to return (default 10, max 200)

        Returns:
            JSON string with ranked list of longest tenure employees
        """
        try:
            # Validate and sanitize inputs
            limit = validate_limit(limit, default=10, max_limit=200)

            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                department_id = sanitize_string(department_id)

            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Build query
            query = (
                self._query(
                    "profiles",
                    "id,first_name,last_name,middle_name,employee_id,hire_date,department_id,departments(name)",
                )
                .eq("user_type", "employee")
                .eq("is_active", True)
                .not_.is_("hire_date", "null")
            )

            if department_id:
                query = query.eq("department_id", department_id)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Execute query
            response = query.execute()
            employees = response.data or []

            if not employees:
                return self._format_response(
                    [],
                    "No employees found matching the criteria",
                    {
                        "department_id": department_id or "all",
                        "employment_category": employment_category or "all",
                    },
                )

            # Calculate tenure and filter out invalid dates
            employees_with_tenure = []
            for emp in employees:
                tenure = calculate_tenure_years(emp.get("hire_date"))
                if tenure is not None:
                    employees_with_tenure.append({**emp, "years_of_service": tenure})

            # Sort by tenure descending (longest first)
            employees_with_tenure.sort(key=lambda x: x["years_of_service"], reverse=True)

            # Apply limit
            top_employees = employees_with_tenure[:limit]

            # Format results with ranking
            result_data = []
            for rank, emp in enumerate(top_employees, start=1):
                department_name = (
                    emp.get("departments", {}).get("name") if emp.get("departments") else None
                )

                result_data.append(
                    {
                        "rank": rank,
                        "full_name": format_full_name(
                            emp.get("first_name"), emp.get("last_name"), emp.get("middle_name")
                        ),
                        "employee_id": emp.get("employee_id"),
                        "hire_date": emp.get("hire_date"),
                        "years_of_service": emp["years_of_service"],
                        "department_name": department_name,
                    }
                )

            message = f"Found {len(result_data)} longest tenure employees"
            if department_id:
                message += f" in department {department_id}"
            if employment_category:
                message += f" ({employment_category} category)"

            return self._format_response(
                result_data,
                message,
                {
                    "total_matched": len(employees_with_tenure),
                    "returned": len(result_data),
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                    "limit": limit,
                },
            )


class GetEmployeeAgeDistributionTool(TUPSAFETool):
    """Get age distribution of employees across standard age brackets.

    This tool provides demographic analytics showing how employees are
    distributed across age ranges, useful for diversity reporting and
    workforce planning.
    """

    name: str = "get_employee_age_distribution"
    description: str = """Get age distribution of employees across standard age brackets.

Returns:
- Age brackets (Under 25, 25-34, 35-44, 45-54, 55-64, 65+) with employee counts
- Optionally includes sample employee names in each bracket
- Optionally filtered by department

Example: get_employee_age_distribution(department_id="uuid", include_names=True, names_limit=5)"""
    args_schema: type[BaseModel] = GetEmployeeAgeDistributionInput

    def _run(
        self,
        department_id: Optional[str] = None,
        include_names: bool = False,
        names_limit: int = 5,
    ) -> str:
        """Execute the employee age distribution query.

        Args:
            department_id: Optional department UUID filter
            include_names: Whether to include sample employee names (default False)
            names_limit: Maximum sample names per bracket (default 5)

        Returns:
            JSON string with age distribution by bracket
        """
        try:
            # Validate and sanitize inputs
            names_limit = validate_limit(names_limit, default=5, max_limit=50)

            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid department_id UUID format: {department_id}")
                department_id = sanitize_string(department_id)

            # Build query
            query = (
                self._query(
                    "profiles",
                    "id,first_name,last_name,middle_name,employee_id,date_of_birth",
                )
                .eq("user_type", "employee")
                .eq("is_active", True)
                .not_.is_("date_of_birth", "null")
            )

            if department_id:
                query = query.eq("department_id", department_id)

            # Execute query
            response = query.execute()
            employees = response.data or []

            if not employees:
                return self._format_response(
                    [],
                    "No employees found matching the criteria",
                    {"department_id": department_id or "all"},
                )

            # Initialize age brackets
            brackets = {
                "Under 25": {"count": 0, "employees": []},
                "25-34": {"count": 0, "employees": []},
                "35-44": {"count": 0, "employees": []},
                "45-54": {"count": 0, "employees": []},
                "55-64": {"count": 0, "employees": []},
                "65+": {"count": 0, "employees": []},
            }

            # Calculate ages and categorize into brackets
            total_processed = 0
            for emp in employees:
                age = calculate_age(emp.get("date_of_birth"))
                if age is not None:
                    bracket = format_age_bracket(age)
                    if bracket in brackets:
                        brackets[bracket]["count"] += 1
                        brackets[bracket]["employees"].append(
                            {
                                "full_name": format_full_name(
                                    emp.get("first_name"),
                                    emp.get("last_name"),
                                    emp.get("middle_name"),
                                ),
                                "employee_id": emp.get("employee_id"),
                                "age": age,
                            }
                        )
                        total_processed += 1

            # Format results
            result_data = []
            for bracket_name in [
                "Under 25",
                "25-34",
                "35-44",
                "45-54",
                "55-64",
                "65+",
            ]:
                bracket_data = {
                    "age_bracket": bracket_name,
                    "count": brackets[bracket_name]["count"],
                }

                # Include sample names if requested
                if include_names and brackets[bracket_name]["employees"]:
                    bracket_data["sample_employees"] = brackets[bracket_name]["employees"][
                        :names_limit
                    ]

                result_data.append(bracket_data)

            message = f"Age distribution for {total_processed} employees across 6 brackets"
            if department_id:
                message += f" in department {department_id}"

            return self._format_response(
                result_data,
                message,
                {
                    "total_employees": total_processed,
                    "department_id": department_id or "all",
                    "include_names": include_names,
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id or "all",
                    "include_names": include_names,
                    "names_limit": names_limit,
                },
            )


# ============================================================================
# Tool Instances (for LangChain agent)
# ============================================================================

get_oldest_employees = GetOldestEmployeesTool()
get_youngest_employees = GetYoungestEmployeesTool()
get_oldest_applicants = GetOldestApplicantsTool()
get_longest_tenure_employees = GetLongestTenureEmployeesTool()
get_employee_age_distribution = GetEmployeeAgeDistributionTool()
