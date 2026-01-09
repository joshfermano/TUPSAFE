"""
TUPSAFE AI Agent Tools Module

This module exports all database query tools for the AI agent. These tools enable
the agent to query the Supabase database for PDS/SALN submission data, user information,
compliance metrics, department statistics, and job application data.

The tools are designed to be used with LangChain's @tool decorator and are compatible
with LangGraph agents.

Tool Categories:
    - MCP Client: Database connection and query execution
    - Submissions: PDS/SALN submission queries and statistics
    - Users: Employee and applicant information
    - Compliance: Compliance rate calculations and tracking
    - Departments: Department/office information and statistics
    - Jobs: Job application and open position queries

Usage:
    >>> from src.tools import TUPSAFE_TOOLS
    >>> # Use tools with LangGraph agent
    >>> agent = create_react_agent(llm, tools=TUPSAFE_TOOLS)
"""

from src.tools.compliance import (
    get_pds_compliance_rate,
    get_pending_submissions_by_department,
    get_saln_compliance_rate,
)
from src.tools.departments import get_department_list, get_department_stats
from src.tools.jobs import (
    get_application_funnel_metrics,
    get_job_application_stats,
    get_open_positions_by_department,
    get_position_application_summary,
)
from src.tools.mcp_client import (
    SupabaseMCPClient,
    close_mcp_client,
    get_mcp_client,
    initialize_mcp_client,
)
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

# Export MCP client utilities
__all__ = [
    # MCP Client
    "SupabaseMCPClient",
    "initialize_mcp_client",
    "close_mcp_client",
    "get_mcp_client",
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
]
