"""Detailed Listing Tools with Name Resolution

This module provides tools for listing employees and applicants with detailed information
including full names, ages, department names, and other key attributes. These tools help
the AI agent answer questions about specific people and their details.

Key features:
- Employee listings with department resolution and age calculation
- Applicant listings with account status
- Position-specific applicant listings
- Department-specific employee listings
"""

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string, validate_limit, validate_offset, validate_uuid
from src.tools.base import TUPSAFETool
from src.utils.formatters import calculate_age, format_full_name


# ============================================================================
# Input Schemas
# ============================================================================


class ListEmployeesInput(BaseModel):
    """Input schema for listing employees."""

    department_id: Optional[str] = Field(
        None, description="Filter by department UUID. If None, shows all departments."
    )
    employment_category: Optional[Literal["faculty", "administrative", "contractual"]] = Field(
        None, description="Filter by employment category. If None, shows all categories."
    )
    include_inactive: bool = Field(
        False, description="Whether to include inactive employees. Default: False"
    )
    limit: int = Field(50, description="Maximum number of results to return. Default: 50")
    offset: int = Field(0, description="Number of records to skip for pagination. Default: 0")
    order_by: Optional[Literal["name", "hire_date", "age"]] = Field(
        None, description="Sort order: 'name', 'hire_date', or 'age'. Default: name"
    )


class ListApplicantsInput(BaseModel):
    """Input schema for listing applicants."""

    position_id: Optional[str] = Field(
        None, description="Filter by position UUID. If None, shows all applicants."
    )
    application_status: Optional[
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
    ] = Field(None, description="Filter by application status. If None, shows all statuses.")
    account_status: Optional[Literal["pending", "active", "suspended", "rejected"]] = Field(
        None, description="Filter by account status. If None, shows all statuses."
    )
    limit: int = Field(50, description="Maximum number of results to return. Default: 50")
    offset: int = Field(0, description="Number of records to skip for pagination. Default: 0")


class ListApplicantsByPositionInput(BaseModel):
    """Input schema for listing applicants by position."""

    position_id: str = Field(..., description="REQUIRED: Position UUID to get applicants for")
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
    ] = Field(None, description="Filter by application status. If None, shows all statuses.")
    limit: int = Field(50, description="Maximum number of results to return. Default: 50")
    offset: int = Field(0, description="Number of records to skip for pagination. Default: 0")


class ListEmployeesByDepartmentInput(BaseModel):
    """Input schema for listing employees by department."""

    department_id: str = Field(
        ..., description="REQUIRED: Department UUID to get employees for"
    )
    employment_category: Optional[Literal["faculty", "administrative", "contractual"]] = Field(
        None, description="Filter by employment category. If None, shows all categories."
    )
    include_inactive: bool = Field(
        False, description="Whether to include inactive employees. Default: False"
    )
    limit: int = Field(50, description="Maximum number of results to return. Default: 50")


# ============================================================================
# Tool Classes
# ============================================================================


class ListEmployeesTool(TUPSAFETool):
    """List employees with detailed information including names, ages, and department details.

    This tool provides comprehensive employee listings with full name formatting,
    age calculation, and department name resolution. Useful for answering questions
    about specific employees and their details.
    """

    name: str = "list_employees"
    description: str = """List employees with detailed information including full names, ages, and departments.

Returns for each employee:
- full_name: Formatted full name (First M. Last)
- employee_id: TUP employee ID
- department_name: Resolved department name
- position_title: Job title/position
- hire_date: Date hired
- age: Calculated age from date of birth
- date_of_birth: Original DOB

Supports filtering by department, employment category, active status, and ordering.

Example: list_employees(employment_category="faculty", order_by="age", limit=10)"""
    args_schema: type[BaseModel] = ListEmployeesInput

    def _run(
        self,
        department_id: Optional[str] = None,
        employment_category: Optional[str] = None,
        include_inactive: bool = False,
        limit: int = 50,
        offset: int = 0,
        order_by: Optional[str] = None,
    ) -> str:
        """Execute the list employees query.

        Args:
            department_id: Optional UUID filter for department
            employment_category: Optional filter for 'faculty', 'administrative', or 'contractual'
            include_inactive: Whether to include inactive employees (default: False)
            limit: Maximum results to return (default: 50)
            offset: Number of records to skip (default: 0)
            order_by: Sort order - 'name', 'hire_date', or 'age' (default: name)

        Returns:
            JSON string with employee list and metadata
        """
        try:
            # Validate inputs
            validated_limit = validate_limit(limit, default=50, max_limit=200)
            validated_offset = validate_offset(offset)

            # Validate department_id if provided
            if department_id:
                if not validate_uuid(department_id):
                    raise ValueError(f"Invalid UUID format for department_id: {department_id}")

            # Sanitize employment_category if provided
            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Sanitize order_by if provided
            if order_by:
                order_by = sanitize_string(order_by)
                if order_by not in ["name", "hire_date", "age"]:
                    raise ValueError(f"Invalid order_by: {order_by}. Must be 'name', 'hire_date', or 'age'")

            # Build query for employees
            query = self._query(
                "profiles",
                "id,first_name,middle_name,last_name,employee_id,department_id,position_title,"
                "hire_date,date_of_birth,employment_category,is_active",
            ).eq("user_type", "employee")

            if not include_inactive:
                query = query.eq("is_active", True)

            if department_id:
                query = query.eq("department_id", department_id)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Apply ordering (will sort in memory for age)
            if order_by == "hire_date":
                query = query.order("hire_date", desc=True)
            elif order_by != "age":  # Default to name ordering (or explicit name)
                query = query.order("last_name").order("first_name")

            # Execute query
            response = query.execute()
            employees = response.data if response.data else []

            if not employees:
                return self._format_response(
                    [],
                    "No employees found",
                    {
                        "department_id": department_id or "all",
                        "employment_category": employment_category or "all",
                        "include_inactive": include_inactive,
                        "total": 0,
                    },
                )

            # Get unique department IDs for resolution
            dept_ids = list(set(e.get("department_id") for e in employees if e.get("department_id")))

            # Fetch department details
            departments_map = {}
            if dept_ids:
                dept_response = self._query("departments", "id,name,code").in_("id", dept_ids).execute()
                for dept in (dept_response.data if dept_response.data else []):
                    departments_map[dept["id"]] = dept.get("name")

            # Format employee data with full names and ages
            formatted_employees = []
            for emp in employees:
                full_name = format_full_name(
                    emp.get("first_name"), emp.get("last_name"), emp.get("middle_name")
                )
                age = calculate_age(emp.get("date_of_birth"))
                dept_id = emp.get("department_id")

                formatted_employees.append(
                    {
                        "full_name": full_name,
                        "employee_id": emp.get("employee_id"),
                        "department_name": departments_map.get(dept_id) if dept_id else None,
                        "position_title": emp.get("position_title"),
                        "hire_date": emp.get("hire_date"),
                        "age": age,
                        "date_of_birth": emp.get("date_of_birth"),
                        "employment_category": emp.get("employment_category"),
                    }
                )

            # Sort by age if requested (must be done in memory)
            if order_by == "age":
                formatted_employees.sort(key=lambda x: x["age"] if x["age"] is not None else 999)

            # Apply pagination
            total = len(formatted_employees)
            paginated_employees = formatted_employees[validated_offset : validated_offset + validated_limit]

            return self._format_response(
                paginated_employees,
                f"Found {total} employees (showing {len(paginated_employees)})",
                {
                    "department_id": department_id or "all",
                    "employment_category": employment_category or "all",
                    "include_inactive": include_inactive,
                    "order_by": order_by or "name",
                    "total": total,
                    "limit": validated_limit,
                    "offset": validated_offset,
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id,
                    "employment_category": employment_category,
                    "include_inactive": include_inactive,
                },
            )


class ListApplicantsTool(TUPSAFETool):
    """List applicants with detailed information including names, ages, and account status.

    This tool provides comprehensive applicant listings with full name formatting,
    age calculation, and account status tracking. Useful for answering questions
    about specific applicants and their details.
    """

    name: str = "list_applicants"
    description: str = """List applicants with detailed information including full names, ages, and account status.

Returns for each applicant:
- full_name: Formatted full name (First M. Last)
- applicant_id: System-generated applicant ID (APPL-YYYYMMDD-XXXX)
- date_of_birth: Date of birth
- age: Calculated age
- account_status: Account status (pending/active/suspended/rejected)
- email: Email address

Supports filtering by position, application status, and account status.

Example: list_applicants(account_status="active", limit=20)"""
    args_schema: type[BaseModel] = ListApplicantsInput

    def _run(
        self,
        position_id: Optional[str] = None,
        application_status: Optional[str] = None,
        account_status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> str:
        """Execute the list applicants query.

        Args:
            position_id: Optional UUID filter for position
            application_status: Optional application status filter
            account_status: Optional account status filter
            limit: Maximum results to return (default: 50)
            offset: Number of records to skip (default: 0)

        Returns:
            JSON string with applicant list and metadata
        """
        try:
            # Validate inputs
            validated_limit = validate_limit(limit, default=50, max_limit=200)
            validated_offset = validate_offset(offset)

            # Validate position_id if provided
            if position_id:
                if not validate_uuid(position_id):
                    raise ValueError(f"Invalid UUID format for position_id: {position_id}")

            # Sanitize status filters if provided
            if application_status:
                application_status = sanitize_string(application_status)

            if account_status:
                account_status = sanitize_string(account_status)

            # Build query for applicants
            query = self._query(
                "profiles",
                "id,first_name,middle_name,last_name,applicant_id,date_of_birth,account_status,email",
            ).eq("user_type", "applicant")

            if account_status:
                query = query.eq("account_status", account_status)

            # Apply ordering
            query = query.order("last_name").order("first_name")

            # Execute query
            response = query.execute()
            applicants = response.data if response.data else []

            if not applicants:
                return self._format_response(
                    [],
                    "No applicants found",
                    {
                        "position_id": position_id or "all",
                        "application_status": application_status or "all",
                        "account_status": account_status or "all",
                        "total": 0,
                    },
                )

            # If filtering by position or application status, need to join with job_applications
            if position_id or application_status:
                applicant_ids = [a["id"] for a in applicants]

                # Build job applications query
                app_query = self._query("job_applications", "applicant_id,status,position_id").in_(
                    "applicant_id", applicant_ids
                )

                if position_id:
                    app_query = app_query.eq("position_id", position_id)

                if application_status:
                    app_query = app_query.eq("status", application_status)

                app_response = app_query.execute()
                applications = app_response.data if app_response.data else []

                # Filter applicants to only those with matching applications
                applicant_ids_with_apps = set(app["applicant_id"] for app in applications)
                applicants = [a for a in applicants if a["id"] in applicant_ids_with_apps]

            # Format applicant data with full names and ages
            formatted_applicants = []
            for applicant in applicants:
                full_name = format_full_name(
                    applicant.get("first_name"),
                    applicant.get("last_name"),
                    applicant.get("middle_name"),
                )
                age = calculate_age(applicant.get("date_of_birth"))

                formatted_applicants.append(
                    {
                        "full_name": full_name,
                        "applicant_id": applicant.get("applicant_id"),
                        "date_of_birth": applicant.get("date_of_birth"),
                        "age": age,
                        "account_status": applicant.get("account_status"),
                        "email": applicant.get("email"),
                    }
                )

            # Apply pagination
            total = len(formatted_applicants)
            paginated_applicants = formatted_applicants[validated_offset : validated_offset + validated_limit]

            return self._format_response(
                paginated_applicants,
                f"Found {total} applicants (showing {len(paginated_applicants)})",
                {
                    "position_id": position_id or "all",
                    "application_status": application_status or "all",
                    "account_status": account_status or "all",
                    "total": total,
                    "limit": validated_limit,
                    "offset": validated_offset,
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "position_id": position_id,
                    "application_status": application_status,
                    "account_status": account_status,
                },
            )


class ListApplicantsByPositionTool(TUPSAFETool):
    """List applicants for a specific position with application details.

    This tool provides position-specific applicant listings with full name formatting,
    application status, and applied date. Useful for answering questions about who
    applied for a specific job opening.
    """

    name: str = "list_applicants_by_position"
    description: str = """List applicants for a specific position with application details and position info.

Returns for each applicant:
- full_name: Formatted full name (First M. Last)
- applicant_id: System-generated applicant ID
- application_status: Current application status
- applied_at: Date application was submitted
- position_title: Title of the position
- position_id: UUID of the position

REQUIRED: position_id must be provided

Example: list_applicants_by_position(position_id="550e8400-e29b-41d4-a716-446655440000", status="shortlisted")"""
    args_schema: type[BaseModel] = ListApplicantsByPositionInput

    def _run(
        self,
        position_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> str:
        """Execute the list applicants by position query.

        Args:
            position_id: REQUIRED - UUID of the position
            status: Optional application status filter
            limit: Maximum results to return (default: 50)
            offset: Number of records to skip (default: 0)

        Returns:
            JSON string with applicant list for position and metadata
        """
        try:
            # Validate inputs
            if not validate_uuid(position_id):
                raise ValueError(f"Invalid UUID format for position_id: {position_id}")

            validated_limit = validate_limit(limit, default=50, max_limit=200)
            validated_offset = validate_offset(offset)

            # Sanitize status if provided
            if status:
                status = sanitize_string(status)

            # Get position details
            position_response = (
                self._query("open_positions", "id,position_title,employment_category,department_id")
                .eq("id", position_id)
                .single()
                .execute()
            )

            if not position_response.data:
                raise ValueError(f"Position not found: {position_id}")

            position_data = position_response.data

            # Build query for job applications
            app_query = self._query(
                "job_applications", "id,applicant_id,status,created_at"
            ).eq("position_id", position_id)

            if status:
                app_query = app_query.eq("status", status)

            app_query = app_query.order("created_at", desc=True)

            # Execute query
            app_response = app_query.execute()
            applications = app_response.data if app_response.data else []

            if not applications:
                return self._format_response(
                    [],
                    f"No applications found for position: {position_data.get('position_title')}",
                    {
                        "position_id": position_id,
                        "position_title": position_data.get("position_title"),
                        "status": status or "all",
                        "total": 0,
                    },
                )

            # Get applicant details
            applicant_ids = [app["applicant_id"] for app in applications]

            applicants_response = self._query(
                "profiles",
                "id,first_name,middle_name,last_name,applicant_id",
            ).in_("id", applicant_ids).execute()

            applicants_data = applicants_response.data if applicants_response.data else []

            # Create applicant lookup map
            applicants_map = {a["id"]: a for a in applicants_data}

            # Format results
            formatted_applications = []
            for app in applications:
                applicant = applicants_map.get(app["applicant_id"])
                if not applicant:
                    continue

                full_name = format_full_name(
                    applicant.get("first_name"),
                    applicant.get("last_name"),
                    applicant.get("middle_name"),
                )

                formatted_applications.append(
                    {
                        "full_name": full_name,
                        "applicant_id": applicant.get("applicant_id"),
                        "application_status": app.get("status"),
                        "applied_at": app.get("created_at"),
                        "position_title": position_data.get("position_title"),
                        "position_id": position_id,
                    }
                )

            # Apply pagination
            total = len(formatted_applications)
            paginated_applications = formatted_applications[
                validated_offset : validated_offset + validated_limit
            ]

            return self._format_response(
                paginated_applications,
                f"Found {total} applications for {position_data.get('position_title')} (showing {len(paginated_applications)})",
                {
                    "position_id": position_id,
                    "position_title": position_data.get("position_title"),
                    "status": status or "all",
                    "total": total,
                    "limit": validated_limit,
                    "offset": validated_offset,
                },
            )

        except Exception as e:
            return self._handle_error(e, {"position_id": position_id, "status": status})


class ListEmployeesByDepartmentTool(TUPSAFETool):
    """List employees in a specific department with detailed information.

    This tool provides department-specific employee listings with full name formatting,
    hire dates, and ages. Useful for answering questions about who works in a
    particular department.
    """

    name: str = "list_employees_by_department"
    description: str = """List employees in a specific department with detailed information.

Returns for each employee:
- full_name: Formatted full name (First M. Last)
- employee_id: TUP employee ID
- position_title: Job title/position
- hire_date: Date hired
- age: Calculated age from date of birth
- employment_category: Faculty/administrative/contractual

REQUIRED: department_id must be provided

Example: list_employees_by_department(department_id="550e8400-e29b-41d4-a716-446655440000", employment_category="faculty")"""
    args_schema: type[BaseModel] = ListEmployeesByDepartmentInput

    def _run(
        self,
        department_id: str,
        employment_category: Optional[str] = None,
        include_inactive: bool = False,
        limit: int = 50,
    ) -> str:
        """Execute the list employees by department query.

        Args:
            department_id: REQUIRED - UUID of the department
            employment_category: Optional filter for employment category
            include_inactive: Whether to include inactive employees (default: False)
            limit: Maximum results to return (default: 50)

        Returns:
            JSON string with employee list for department and metadata
        """
        try:
            # Validate inputs
            if not validate_uuid(department_id):
                raise ValueError(f"Invalid UUID format for department_id: {department_id}")

            validated_limit = validate_limit(limit, default=50, max_limit=200)

            # Sanitize employment_category if provided
            if employment_category:
                employment_category = sanitize_string(employment_category)

            # Get department details
            dept_response = (
                self._query("departments", "id,name,code,office_type")
                .eq("id", department_id)
                .single()
                .execute()
            )

            if not dept_response.data:
                raise ValueError(f"Department not found: {department_id}")

            department_data = dept_response.data

            # Build query for employees
            query = self._query(
                "profiles",
                "id,first_name,middle_name,last_name,employee_id,position_title,"
                "hire_date,date_of_birth,employment_category",
            ).eq("user_type", "employee").eq("department_id", department_id)

            if not include_inactive:
                query = query.eq("is_active", True)

            if employment_category:
                query = query.eq("employment_category", employment_category)

            # Order by name
            query = query.order("last_name").order("first_name").limit(validated_limit)

            # Execute query
            response = query.execute()
            employees = response.data if response.data else []

            if not employees:
                return self._format_response(
                    [],
                    f"No employees found in department: {department_data.get('name')}",
                    {
                        "department_id": department_id,
                        "department_name": department_data.get("name"),
                        "employment_category": employment_category or "all",
                        "include_inactive": include_inactive,
                        "total": 0,
                    },
                )

            # Format employee data
            formatted_employees = []
            for emp in employees:
                full_name = format_full_name(
                    emp.get("first_name"), emp.get("last_name"), emp.get("middle_name")
                )
                age = calculate_age(emp.get("date_of_birth"))

                formatted_employees.append(
                    {
                        "full_name": full_name,
                        "employee_id": emp.get("employee_id"),
                        "position_title": emp.get("position_title"),
                        "hire_date": emp.get("hire_date"),
                        "age": age,
                        "employment_category": emp.get("employment_category"),
                    }
                )

            return self._format_response(
                formatted_employees,
                f"Found {len(formatted_employees)} employees in {department_data.get('name')}",
                {
                    "department_id": department_id,
                    "department_name": department_data.get("name"),
                    "department_code": department_data.get("code"),
                    "employment_category": employment_category or "all",
                    "include_inactive": include_inactive,
                    "total": len(formatted_employees),
                    "limit": validated_limit,
                },
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "department_id": department_id,
                    "employment_category": employment_category,
                    "include_inactive": include_inactive,
                },
            )


# ============================================================================
# Tool Instances (for LangChain agent)
# ============================================================================

list_employees = ListEmployeesTool()
list_applicants = ListApplicantsTool()
list_applicants_by_position = ListApplicantsByPositionTool()
list_employees_by_department = ListEmployeesByDepartmentTool()
