"""
TUPSAFE AI Agent Tools Module

This module exports all database query tools for the AI agent. These tools enable
the agent to query the Supabase database for PDS/SALN submission data, user information,
compliance metrics, department statistics, job application data, dashboard metrics,
and audit logs.

The tools extend the TUPSAFETool base class and use the LRU-cached Supabase client
following the Fuseable pattern for reliable database access.

Tool Categories:
    - Submissions: PDS/SALN submission queries and statistics
    - Users: Employee and applicant information
    - Compliance: Compliance rate calculations and tracking
    - Departments: Department/office information and statistics
    - Jobs: Job application and open position queries
    - Dashboard: Aggregated dashboard metrics and system overview
    - Audit: Audit log queries and compliance monitoring
    - List: Employee and applicant listing tools
    - Age: Age and tenure analytics tools

Usage:
    >>> from src.tools import TUPSAFE_TOOLS
    >>> # Use tools with LangGraph agent
    >>> agent = create_react_agent(llm, tools=TUPSAFE_TOOLS)
"""

from src.tools.audit import (
    get_audit_summary,
    get_recent_audit_logs,
    get_security_events,
    get_user_activity,
)
from src.tools.compliance import (
    get_pds_compliance_rate,
    get_pending_submissions_by_department,
    get_saln_compliance_rate,
)
from src.tools.dashboard import (
    get_dashboard_overview,
    get_quick_stats,
    get_system_alerts,
)
from src.tools.departments import get_department_list, get_department_stats
from src.tools.jobs import (
    get_application_funnel_metrics,
    get_job_application_stats,
    get_open_positions_by_department,
    get_position_application_summary,
)
from src.db.client import get_supabase_client, query_table
from src.tools.submissions import (
    get_offices_with_most_submissions,
    get_pending_submissions,
    get_submission_count,
    get_submissions_by_department,
)
from src.tools.users import (
    get_applicant_count,
    get_employee_count,
    get_employees_with_submissions,
)
from src.tools.list_tools import (
    list_employees,
    list_applicants,
    list_applicants_by_position,
    list_employees_by_department,
)
from src.tools.age_tools import (
    get_oldest_employees,
    get_youngest_employees,
    get_oldest_applicants,
    get_longest_tenure_employees,
    get_employee_age_distribution,
)

# Export database utilities and tools
__all__ = [
    # Database Client
    "get_supabase_client",
    "query_table",
    # Submission Tools
    "get_submission_count",
    "get_submissions_by_department",
    "get_pending_submissions",
    "get_offices_with_most_submissions",
    # User Tools
    "get_employee_count",
    "get_applicant_count",
    "get_employees_with_submissions",
    # Compliance Tools
    "get_saln_compliance_rate",
    "get_pds_compliance_rate",
    "get_pending_submissions_by_department",
    # Department Tools
    "get_department_list",
    "get_department_stats",
    # Job Tools
    "get_job_application_stats",
    "get_open_positions_by_department",
    "get_application_funnel_metrics",
    "get_position_application_summary",
    # Dashboard Tools
    "get_dashboard_overview",
    "get_quick_stats",
    "get_system_alerts",
    # Audit Tools
    "get_recent_audit_logs",
    "get_user_activity",
    "get_audit_summary",
    "get_security_events",
    # List Tools
    "list_employees",
    "list_applicants",
    "list_applicants_by_position",
    "list_employees_by_department",
    # Age Tools
    "get_oldest_employees",
    "get_youngest_employees",
    "get_oldest_applicants",
    "get_longest_tenure_employees",
    "get_employee_age_distribution",
    # Tool List
    "TUPSAFE_TOOLS",
]

# Comprehensive list of all tools for agent integration
TUPSAFE_TOOLS = [
    # Submission tools
    get_submission_count,
    get_submissions_by_department,
    get_pending_submissions,
    get_offices_with_most_submissions,
    # User tools
    get_employee_count,
    get_applicant_count,
    get_employees_with_submissions,
    # Compliance tools
    get_saln_compliance_rate,
    get_pds_compliance_rate,
    get_pending_submissions_by_department,
    # Department tools
    get_department_list,
    get_department_stats,
    # Job tools
    get_job_application_stats,
    get_open_positions_by_department,
    get_application_funnel_metrics,
    get_position_application_summary,
    # Dashboard tools
    get_dashboard_overview,
    get_quick_stats,
    get_system_alerts,
    # Audit tools
    get_recent_audit_logs,
    get_user_activity,
    get_audit_summary,
    get_security_events,
    # List tools
    list_employees,
    list_applicants,
    list_applicants_by_position,
    list_employees_by_department,
    # Age tools
    get_oldest_employees,
    get_youngest_employees,
    get_oldest_applicants,
    get_longest_tenure_employees,
    get_employee_age_distribution,
]
