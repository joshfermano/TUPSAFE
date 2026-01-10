"""Department Query Tools

This module provides tools for querying department/office information and statistics
from the database. Departments in TUPSAFE are organized hierarchically with colleges
at the top level and departments underneath.

These tools help the AI agent answer questions about organizational structure,
department-level metrics, and office-specific compliance data.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string, validate_uuid
from src.tools.base import TUPSAFETool


# ============================================================================
# Input Schemas
# ============================================================================


class DepartmentListInput(BaseModel):
    """Input schema for listing departments."""

    office_type: Optional[Literal["academic", "administrative"]] = Field(
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


# ============================================================================
# Tool Classes
# ============================================================================


class GetDepartmentListTool(TUPSAFETool):
    """Get a list of all departments/offices in the organization.

    TUPSAFE organizes departments hierarchically:
    - Colleges (parent_college_id is NULL)
    - Departments (have a parent_college_id)

    This tool provides the organizational structure needed for filtering and
    scoping other queries by department.
    """

    name: str = "get_department_list"
    description: str = """Get a list of all departments/offices in the organization.

Returns:
- departments: List of department objects with employee counts
- total_count: Total number of departments
- office_type: Type filter applied (or 'all')
- include_inactive: Whether inactive departments are included

Each department includes:
- Basic info: id, name, code, office_type
- Hierarchy: parent_college_id, parent_college_name, is_college flag
- Metrics: employee_count, is_active status

Example: get_department_list(office_type="academic", include_inactive=False)"""
    args_schema: type[BaseModel] = DepartmentListInput

    def _run(
        self,
        office_type: Optional[str] = None,
        include_inactive: bool = False,
    ) -> str:
        """Execute the department list query.

        Args:
            office_type: Optional filter for 'academic' or 'administrative' offices
            include_inactive: Whether to include departments marked as inactive

        Returns:
            JSON string with list of departments and metadata
        """
        try:
            # Sanitize office_type if provided
            if office_type:
                office_type = sanitize_string(office_type)

            # Build query for departments
            query = self._query(
                "departments",
                "id,name,code,office_type,parent_id,parent_college_id,is_active,created_at"
            )

            if office_type:
                query = query.eq("office_type", office_type)

            if not include_inactive:
                query = query.eq("is_active", True)

            query = query.order("office_type").order("name")
            departments_response = query.execute()
            departments_data = departments_response.data or []

            if not departments_data:
                return self._format_response(
                    [],
                    "No departments found",
                    {
                        "office_type": office_type or "all",
                        "include_inactive": include_inactive,
                    }
                )

            # Get parent college IDs
            parent_college_ids = list(set(
                d["parent_college_id"] for d in departments_data if d.get("parent_college_id")
            ))

            # Get parent college details if any exist
            parent_colleges = {}
            if parent_college_ids:
                parents_response = self._query(
                    "departments",
                    "id,name,code"
                ).in_("id", parent_college_ids).execute()

                for pc in (parents_response.data or []):
                    parent_colleges[pc["id"]] = {
                        "name": pc.get("name"),
                        "code": pc.get("code"),
                    }

            # Get employee count for each department
            all_dept_ids = [d["id"] for d in departments_data]
            employees_response = self._query(
                "profiles",
                "id,department_id"
            ).eq("user_type", "employee").eq("is_active", True).in_("department_id", all_dept_ids).execute()

            # Count employees by department
            employee_counts = {}
            for emp in (employees_response.data or []):
                dept_id = emp["department_id"]
                employee_counts[dept_id] = employee_counts.get(dept_id, 0) + 1

            # Build result with parent college details and employee counts
            departments = []
            for dept in departments_data:
                parent_college = parent_colleges.get(dept.get("parent_college_id"), {})
                departments.append({
                    "id": dept.get("id"),
                    "name": dept.get("name"),
                    "code": dept.get("code"),
                    "office_type": dept.get("office_type"),
                    "parent_id": dept.get("parent_id"),
                    "parent_college_id": dept.get("parent_college_id"),
                    "parent_college_name": parent_college.get("name"),
                    "parent_college_code": parent_college.get("code"),
                    "is_active": dept.get("is_active"),
                    "employee_count": employee_counts.get(dept.get("id"), 0),
                    "is_college": dept.get("parent_college_id") is None,
                    "created_at": dept.get("created_at"),
                })

            return self._format_response(
                departments,
                f"Found {len(departments)} departments",
                {
                    "office_type": office_type or "all",
                    "include_inactive": include_inactive,
                }
            )

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "office_type": office_type or "all",
                    "include_inactive": include_inactive,
                }
            )


class GetDepartmentStatsTool(TUPSAFETool):
    """Get comprehensive statistics for a specific department.

    This tool provides a complete overview of department metrics including:
    - Employee counts and breakdown
    - PDS/SALN submission statistics
    - Compliance rates
    - Pending reviews

    Useful for department heads and administrators to understand their office's
    compliance status and workload.
    """

    name: str = "get_department_stats"
    description: str = """Get comprehensive statistics for a specific department.

Returns:
- department: Basic department information (name, code, type, hierarchy)
- employees: Employee statistics by category (faculty, administrative, contractual)
- pds_stats: PDS submission and compliance data
- saln_stats: SALN submission and compliance data (current year and last year)
- pending_reviews: Count of submissions awaiting approval

Compliance rates show percentage of employees with approved submissions.
Current year SALN statistics are calculated for the active year.

Example: get_department_stats(department_id="550e8400-e29b-41d4-a716-446655440000")"""
    args_schema: type[BaseModel] = DepartmentStatsInput

    def _run(self, department_id: str) -> str:
        """Execute the department statistics query.

        Args:
            department_id: UUID of the department to analyze

        Returns:
            JSON string with comprehensive department statistics
        """
        try:
            # Validate department_id
            if not validate_uuid(department_id):
                raise ValueError(f"Invalid UUID format for department_id: {department_id}")

            dept_id_validated = sanitize_string(department_id)

            # Get department basic info
            dept_response = self._query(
                "departments",
                "id,name,code,office_type,is_active,parent_college_id"
            ).eq("id", dept_id_validated).execute()

            if not dept_response.data:
                return self._handle_error(
                    ValueError("Department not found"),
                    {"department_id": department_id}
                )

            dept_info = dept_response.data[0]

            # Get parent college info if exists
            parent_college_name = None
            parent_college_code = None
            if dept_info.get("parent_college_id"):
                parent_response = self._query(
                    "departments",
                    "name,code"
                ).eq("id", dept_info["parent_college_id"]).execute()

                if parent_response.data:
                    parent_college_name = parent_response.data[0].get("name")
                    parent_college_code = parent_response.data[0].get("code")

            # Get employee statistics
            employees_response = self._query(
                "profiles",
                "id,employment_category"
            ).eq("department_id", dept_id_validated).eq("user_type", "employee").eq(
                "is_active", True
            ).eq("account_status", "active").execute()

            employees_data = employees_response.data or []
            total_employees = len(employees_data)

            # Count by employment category
            faculty_count = sum(1 for e in employees_data if e.get("employment_category") == "faculty")
            admin_count = sum(1 for e in employees_data if e.get("employment_category") == "administrative")
            contractual_count = sum(1 for e in employees_data if e.get("employment_category") == "contractual")

            # Get employee IDs for submission queries
            employee_ids = [e["id"] for e in employees_data]

            # If no employees, return early with zero stats
            if total_employees == 0:
                department_data = {
                    "id": dept_info.get("id"),
                    "name": dept_info.get("name"),
                    "code": dept_info.get("code"),
                    "office_type": dept_info.get("office_type"),
                    "is_active": dept_info.get("is_active"),
                    "parent_college_name": parent_college_name,
                    "parent_college_code": parent_college_code,
                }

                zero_stats = {
                    "department": department_data,
                    "employees": {
                        "total": 0,
                        "faculty": 0,
                        "administrative": 0,
                        "contractual": 0,
                    },
                    "pds_stats": {
                        "total_submissions": 0,
                        "employees_with_approved": 0,
                        "employees_with_pending": 0,
                        "employees_without": 0,
                        "compliance_rate": 0.0,
                    },
                    "saln_stats": {
                        "total_submissions": 0,
                        "current_year": datetime.now().year,
                        "current_year_approved": 0,
                        "current_year_pending": 0,
                        "current_year_without": 0,
                        "compliance_rate": 0.0,
                        "last_year_approved": 0,
                    },
                    "pending_reviews": {
                        "pds": 0,
                        "saln": 0,
                        "total": 0,
                    },
                }

                return self._format_single_response(
                    zero_stats,
                    f"Department '{dept_info.get('name')}' has no active employees"
                )

            # Get PDS statistics
            pds_response = self._query(
                "pds_submissions",
                "id,user_id,status"
            ).in_("user_id", employee_ids).execute()

            pds_submissions = pds_response.data or []

            pds_approved_users = set(s["user_id"] for s in pds_submissions if s.get("status") == "approved")
            pds_pending_users = set(s["user_id"] for s in pds_submissions if s.get("status") in ["submitted", "reviewing"])

            pds_approved_count = len(pds_approved_users)
            pds_pending_count = len(pds_pending_users)
            pds_without_count = total_employees - pds_approved_count - pds_pending_count

            pds_compliance_rate = (pds_approved_count / total_employees * 100) if total_employees > 0 else 0.0

            # Get SALN statistics
            current_year = datetime.now().year
            last_year = current_year - 1

            saln_response = self._query(
                "saln_submissions",
                "id,user_id,status,year"
            ).in_("user_id", employee_ids).execute()

            saln_submissions = saln_response.data or []

            # Current year SALN
            current_year_approved_users = set(
                s["user_id"] for s in saln_submissions
                if s.get("year") == current_year and s.get("status") == "approved"
            )
            current_year_pending_users = set(
                s["user_id"] for s in saln_submissions
                if s.get("year") == current_year and s.get("status") in ["submitted", "reviewing"]
            )

            current_year_approved = len(current_year_approved_users)
            current_year_pending = len(current_year_pending_users)
            current_year_without = total_employees - current_year_approved - current_year_pending

            saln_compliance_rate = (current_year_approved / total_employees * 100) if total_employees > 0 else 0.0

            # Last year SALN
            last_year_approved_users = set(
                s["user_id"] for s in saln_submissions
                if s.get("year") == last_year and s.get("status") == "approved"
            )
            last_year_approved = len(last_year_approved_users)

            # Get pending reviews count
            pending_pds = sum(1 for s in pds_submissions if s.get("status") in ["submitted", "reviewing"])
            pending_saln = sum(1 for s in saln_submissions if s.get("status") in ["submitted", "reviewing"])

            result = {
                "department": {
                    "id": dept_info.get("id"),
                    "name": dept_info.get("name"),
                    "code": dept_info.get("code"),
                    "office_type": dept_info.get("office_type"),
                    "is_active": dept_info.get("is_active"),
                    "parent_college_name": parent_college_name,
                    "parent_college_code": parent_college_code,
                },
                "employees": {
                    "total": total_employees,
                    "faculty": faculty_count,
                    "administrative": admin_count,
                    "contractual": contractual_count,
                },
                "pds_stats": {
                    "total_submissions": len(pds_submissions),
                    "employees_with_approved": pds_approved_count,
                    "employees_with_pending": pds_pending_count,
                    "employees_without": pds_without_count,
                    "compliance_rate": round(pds_compliance_rate, 2),
                },
                "saln_stats": {
                    "total_submissions": len(saln_submissions),
                    "current_year": current_year,
                    "current_year_approved": current_year_approved,
                    "current_year_pending": current_year_pending,
                    "current_year_without": current_year_without,
                    "compliance_rate": round(saln_compliance_rate, 2),
                    "last_year_approved": last_year_approved,
                },
                "pending_reviews": {
                    "pds": pending_pds,
                    "saln": pending_saln,
                    "total": pending_pds + pending_saln,
                },
            }

            return self._format_single_response(
                result,
                f"Retrieved statistics for department '{dept_info.get('name')}'"
            )

        except Exception as e:
            return self._handle_error(
                e,
                {"department_id": department_id}
            )


# ============================================================================
# Tool Instances (for LangChain)
# ============================================================================

get_department_list = GetDepartmentListTool()
get_department_stats = GetDepartmentStatsTool()
