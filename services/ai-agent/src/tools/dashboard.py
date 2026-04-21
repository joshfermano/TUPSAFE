"""
Dashboard Overview Tools

Provides aggregated dashboard metrics for the TUPSAFE admin panel.
These tools help the AI agent answer questions about system-wide statistics,
recent activity, and overall system health.
"""

from datetime import datetime, timedelta

from src.tools.base import TUPSAFETool


class GetDashboardOverviewTool(TUPSAFETool):
    """Get comprehensive dashboard overview with key metrics.

    Returns aggregated statistics including:
    - User statistics (employees, applicants, pending registrations)
    - Submission statistics (PDS/SALN by status)
    - Compliance rates for current year
    - Job application pipeline metrics
    - Recent activity summary

    This tool provides a complete snapshot of the TUPSAFE system status,
    suitable for displaying on the admin dashboard or answering high-level
    questions about system health and usage.
    """

    name: str = "get_dashboard_overview"
    description: str = """Get a comprehensive dashboard overview with key metrics.

    Returns aggregated statistics including user counts, submission statistics,
    compliance rates, job application metrics, and recent activity.

    Returns:
        Dictionary containing:
        - users: User statistics including employees and applicants
        - submissions: PDS/SALN submission statistics
        - jobs: Job application and open position statistics
        - compliance: Compliance rates and metrics
        - recent_activity: Summary of recent system activity
        - generated_at: Timestamp of when data was generated

    Example:
        >>> overview = get_dashboard_overview.invoke({})
        >>> print(f"Total employees: {overview['users']['total_employees']}")
        >>> print(f"SALN compliance: {overview['compliance']['saln_compliance_rate']:.1f}%")
    """

    def _run(self) -> str:
        """Execute the dashboard overview query.

        Returns:
            JSON string with dashboard overview data or error response
        """
        try:
            current_year = datetime.now().year

            # Get user statistics
            # Total employees
            employees_response = (
                self._query("profiles", "id,is_active,account_status,employment_category")
                .eq("user_type", "employee")
                .execute()
            )

            employees_data = employees_response.data or []
            total_employees = len(employees_data)
            active_employees = len([
                e for e in employees_data
                if e.get("is_active") and e.get("account_status") == "active"
            ])

            # Employment category breakdown
            employment_breakdown = {}
            for emp in employees_data:
                if emp.get("is_active"):
                    category = emp.get("employment_category", "not_applicable")
                    employment_breakdown[category] = employment_breakdown.get(category, 0) + 1

            # Total applicants
            applicants_response = (
                self._query("profiles", "id,account_status")
                .eq("user_type", "applicant")
                .execute()
            )

            applicants_data = applicants_response.data or []
            total_applicants = len(applicants_data)
            active_applicants = len([
                a for a in applicants_data
                if a.get("account_status") == "active"
            ])

            # Pending registrations
            pending_reg_response = (
                self._query("pending_registrations", "id")
                .eq("status", "pending")
                .execute()
            )

            pending_registrations = len(pending_reg_response.data or [])

            # Get submission statistics
            # Canonical compliance definitions (mirror apps/admin/src/lib/compliance.ts):
            #   denominator = ACTIVE employees (user_type='employee' AND
            #                  is_active=true AND account_status='active')
            #   numerator   = DISTINCT user_id WHERE status IN ('submitted','approved')
            active_employee_ids = {
                e["id"] for e in employees_data
                if e.get("is_active") and e.get("account_status") == "active"
            }

            # PDS submissions
            pds_response = self._query(
                "pds_submissions", "id,status,user_id"
            ).execute()

            pds_data = pds_response.data or []
            pds_total = len(pds_data)
            pds_approved = len([p for p in pds_data if p.get("status") == "approved"])
            pds_pending = len(
                [p for p in pds_data if p.get("status") in ("submitted", "reviewing")]
            )
            pds_compliant_user_ids = {
                p["user_id"]
                for p in pds_data
                if p.get("status") in ("submitted", "approved")
                and p.get("user_id") in active_employee_ids
            }
            pds_compliance_rate = (
                (len(pds_compliant_user_ids) / active_employees * 100)
                if active_employees > 0
                else 0.0
            )

            # SALN submissions for current year
            saln_response = (
                self._query("saln_submissions", "id,status,year,user_id")
                .eq("year", current_year)
                .execute()
            )

            saln_data = saln_response.data or []
            saln_total = len(saln_data)
            saln_approved = len([s for s in saln_data if s.get("status") == "approved"])
            saln_pending = len(
                [s for s in saln_data if s.get("status") in ("submitted", "reviewing")]
            )
            saln_compliant_user_ids = {
                s["user_id"]
                for s in saln_data
                if s.get("status") in ("submitted", "approved")
                and s.get("user_id") in active_employee_ids
            }
            saln_compliance_rate = (
                (len(saln_compliant_user_ids) / active_employees * 100)
                if active_employees > 0
                else 0.0
            )

            # Recent submissions (last 7 days)
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            recent_pds = (
                self._query("pds_submissions", "id")
                .gte("created_at", seven_days_ago)
                .execute()
            )

            recent_saln = (
                self._query("saln_submissions", "id")
                .gte("created_at", seven_days_ago)
                .execute()
            )

            recent_submissions_count = (
                len(recent_pds.data or []) + len(recent_saln.data or [])
            )

            # Get job application statistics
            # Open positions
            open_positions_response = (
                self._query("open_positions", "id")
                .eq("is_active", True)
                .gte("deadline", datetime.now().isoformat())
                .execute()
            )

            open_positions = len(open_positions_response.data or [])

            # Job applications
            applications_response = (
                self._query("job_applications", "id,status,created_at")
                .execute()
            )

            applications_data = applications_response.data or []
            total_applications = len(applications_data)

            pending_review = len([
                a for a in applications_data
                if a.get("status") in ["pending", "under_review"]
            ])

            # Applications this week
            applications_this_week = len([
                a for a in applications_data
                if a.get("created_at") and a["created_at"] >= seven_days_ago
            ])

            # Overall compliance = (pds_rate + saln_rate) / 2
            # (matches TUPSAFE admin portal's computeComplianceRates helper)
            employees_compliant = len(saln_compliant_user_ids)
            employees_non_compliant = max(active_employees - employees_compliant, 0)
            overall_compliance_rate = (pds_compliance_rate + saln_compliance_rate) / 2

            # Get recent activity (last 10 audit logs)
            recent_activity_response = (
                self._query("audit_logs", "id,user_id,action,entity_type,created_at")
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )

            recent_activity = [
                {
                    "id": str(log.get("id")),
                    "action": log.get("action"),
                    "entity_type": log.get("entity_type"),
                    "timestamp": log.get("created_at"),
                }
                for log in (recent_activity_response.data or [])
            ]

            overview_data = {
                "users": {
                    "total_employees": total_employees,
                    "total_applicants": total_applicants,
                    "active_employees": active_employees,
                    "active_applicants": active_applicants,
                    "pending_registrations": pending_registrations,
                    "by_employment_category": employment_breakdown,
                },
                "submissions": {
                    "pds_total": pds_total,
                    "pds_approved": pds_approved,
                    "pds_pending": pds_pending,
                    "pds_compliance_rate": round(pds_compliance_rate, 2),
                    "saln_total": saln_total,
                    "saln_approved": saln_approved,
                    "saln_pending": saln_pending,
                    "saln_compliance_rate": round(saln_compliance_rate, 2),
                    "recent_submissions_count": recent_submissions_count,
                },
                "jobs": {
                    "open_positions": open_positions,
                    "total_applications": total_applications,
                    "applications_this_week": applications_this_week,
                    "pending_review": pending_review,
                },
                "compliance": {
                    "overall_compliance_rate": round(overall_compliance_rate, 2),
                    "employees_compliant": employees_compliant,
                    "employees_non_compliant": employees_non_compliant,
                    "current_year": current_year,
                },
                "recent_activity": recent_activity,
                "generated_at": datetime.now().isoformat(),
            }

            return self._format_response(
                [overview_data],
                "Dashboard overview retrieved successfully"
            )

        except Exception as e:
            return self._handle_error(e, {"operation": "get_dashboard_overview"})


class GetQuickStatsTool(TUPSAFETool):
    """Get quick summary statistics for dashboard cards.

    Returns compact metrics suitable for dashboard cards or quick glance views.
    This is a lighter-weight alternative to get_dashboard_overview when you only
    need the most essential metrics.
    """

    name: str = "get_quick_stats"
    description: str = """Get quick summary statistics for dashboard cards.

    Returns compact metrics suitable for dashboard cards or quick glance views.
    This is a lighter-weight alternative to get_dashboard_overview.

    Returns:
        Dictionary containing:
        - total_active_employees: Count of active employee accounts
        - pending_submissions: Total submissions awaiting review (PDS + SALN)
        - open_positions: Number of active job postings
        - pending_registrations: Account approvals needed
        - compliance_rate: Overall compliance rate percentage

    Example:
        >>> stats = get_quick_stats.invoke({})
        >>> print(f"Active employees: {stats['total_active_employees']}")
        >>> print(f"Pending reviews: {stats['pending_submissions']}")
    """

    def _run(self) -> str:
        """Execute the quick stats query.

        Returns:
            JSON string with quick stats data or error response
        """
        try:
            # Total active employees
            employees_response = (
                self._query("profiles", "id")
                .eq("user_type", "employee")
                .eq("is_active", True)
                .eq("account_status", "active")
                .execute()
            )

            total_active_employees = len(employees_response.data or [])

            # Pending submissions (PDS + SALN)
            pds_pending_response = (
                self._query("pds_submissions", "id")
                .in_("status", ["pending", "reviewing"])
                .execute()
            )

            saln_pending_response = (
                self._query("saln_submissions", "id")
                .in_("status", ["pending", "reviewing"])
                .execute()
            )

            pending_submissions = (
                len(pds_pending_response.data or []) +
                len(saln_pending_response.data or [])
            )

            # Open positions
            open_positions_response = (
                self._query("open_positions", "id")
                .eq("is_active", True)
                .gte("deadline", datetime.now().isoformat())
                .execute()
            )

            open_positions = len(open_positions_response.data or [])

            # Pending registrations
            pending_reg_response = (
                self._query("pending_registrations", "id")
                .eq("status", "pending")
                .execute()
            )

            pending_registrations = len(pending_reg_response.data or [])

            # Compliance rate (SALN for current year) — canonical definition
            # (submitted OR approved) so numbers match the admin dashboard.
            current_year = datetime.now().year
            active_ids = {e["id"] for e in (employees_response.data or [])}
            saln_compliant_response = (
                self._query("saln_submissions", "user_id,status")
                .eq("year", current_year)
                .in_("status", ["submitted", "approved"])
                .execute()
            )
            saln_compliant_ids = {
                s["user_id"]
                for s in (saln_compliant_response.data or [])
                if s.get("user_id") in active_ids
            }
            compliance_rate = (
                (len(saln_compliant_ids) / total_active_employees * 100)
                if total_active_employees > 0
                else 0.0
            )

            stats_data = {
                "total_active_employees": total_active_employees,
                "pending_submissions": pending_submissions,
                "open_positions": open_positions,
                "pending_registrations": pending_registrations,
                "compliance_rate": round(compliance_rate, 2),
                "generated_at": datetime.now().isoformat(),
            }

            return self._format_response(
                [stats_data],
                "Quick stats retrieved successfully"
            )

        except Exception as e:
            return self._handle_error(e, {"operation": "get_quick_stats"})


class GetSystemAlertsTool(TUPSAFETool):
    """Get active system alerts and warnings.

    Returns actionable alerts for the dashboard including:
    - Upcoming deadlines that need attention
    - Overdue submissions
    - Pending reviews that are approaching SLA
    - System health warnings
    """

    name: str = "get_system_alerts"
    description: str = """Get active system alerts and warnings.

    Returns actionable alerts for the dashboard including upcoming deadlines,
    overdue submissions, pending reviews approaching SLA, and system health warnings.

    Returns:
        Dictionary containing:
        - alerts: List of alert objects with severity, title, message
        - alert_count: Total number of active alerts
        - high_priority_count: Count of high/critical alerts

    Example:
        >>> alerts = get_system_alerts.invoke({})
        >>> for alert in alerts['alerts']:
        ...     print(f"[{alert['severity']}] {alert['title']}")
    """

    def _run(self) -> str:
        """Execute the system alerts query.

        Returns:
            JSON string with system alerts data or error response
        """
        try:
            alerts = []
            current_year = datetime.now().year

            # Check for upcoming deadlines (within 14 days)
            fourteen_days_later = (datetime.now() + timedelta(days=14)).isoformat()
            upcoming_deadlines_response = (
                self._query("submission_deadlines", "id,form_type,deadline_date,year")
                .lte("deadline_date", fourteen_days_later)
                .gte("deadline_date", datetime.now().isoformat())
                .execute()
            )

            for deadline in (upcoming_deadlines_response.data or []):
                days_remaining = (
                    datetime.fromisoformat(deadline["deadline_date"]) - datetime.now()
                ).days
                alerts.append({
                    "alert_id": f"deadline-{deadline['id']}",
                    "alert_type": "deadline_warning",
                    "severity": "medium" if days_remaining > 7 else "high",
                    "title": f"{deadline['form_type'].upper()} Deadline Approaching",
                    "message": f"{deadline['form_type'].upper()} deadline in {days_remaining} days ({deadline['deadline_date']})",
                    "action_required": True,
                    "created_at": datetime.now().isoformat(),
                })

            # Check for overdue submissions
            overdue_deadlines_response = (
                self._query("submission_deadlines", "id,form_type,deadline_date,year")
                .lt("deadline_date", datetime.now().isoformat())
                .eq("year", current_year)
                .execute()
            )

            overdue_count = len(overdue_deadlines_response.data or [])
            if overdue_count > 0:
                alerts.append({
                    "alert_id": "overdue-submissions",
                    "alert_type": "overdue_warning",
                    "severity": "high",
                    "title": "Overdue Submissions Detected",
                    "message": f"{overdue_count} deadline(s) have passed",
                    "action_required": True,
                    "created_at": datetime.now().isoformat(),
                })

            # Check for pending reviews (more than 5 days old)
            five_days_ago = (datetime.now() - timedelta(days=5)).isoformat()
            old_pending_pds = (
                self._query("pds_submissions", "id")
                .eq("status", "pending")
                .lt("created_at", five_days_ago)
                .execute()
            )

            old_pending_saln = (
                self._query("saln_submissions", "id")
                .eq("status", "pending")
                .lt("created_at", five_days_ago)
                .execute()
            )

            old_pending_count = (
                len(old_pending_pds.data or []) +
                len(old_pending_saln.data or [])
            )

            if old_pending_count > 0:
                alerts.append({
                    "alert_id": "pending-reviews",
                    "alert_type": "review_backlog",
                    "severity": "medium",
                    "title": "Pending Reviews Need Attention",
                    "message": f"{old_pending_count} submission(s) pending review for more than 5 days",
                    "action_required": True,
                    "created_at": datetime.now().isoformat(),
                })

            # Check pending registrations
            pending_reg_response = (
                self._query("pending_registrations", "id")
                .eq("status", "pending")
                .execute()
            )

            pending_reg_count = len(pending_reg_response.data or [])
            if pending_reg_count > 0:
                alerts.append({
                    "alert_id": "pending-registrations",
                    "alert_type": "registration_approval",
                    "severity": "low",
                    "title": "Pending Account Registrations",
                    "message": f"{pending_reg_count} account registration(s) awaiting approval",
                    "action_required": True,
                    "created_at": datetime.now().isoformat(),
                })

            # Count by severity
            high_priority_count = len([
                a for a in alerts if a["severity"] in ["high", "critical"]
            ])

            alerts_data = {
                "alerts": alerts,
                "alert_count": len(alerts),
                "high_priority_count": high_priority_count,
                "generated_at": datetime.now().isoformat(),
            }

            return self._format_response(
                [alerts_data],
                "System alerts retrieved successfully"
            )

        except Exception as e:
            return self._handle_error(e, {"operation": "get_system_alerts"})


# Create tool instances for export
get_dashboard_overview = GetDashboardOverviewTool()
get_quick_stats = GetQuickStatsTool()
get_system_alerts = GetSystemAlertsTool()
