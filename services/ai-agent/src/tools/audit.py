"""Audit Log Query Tools

This module provides tools for querying system audit logs for compliance and monitoring.
These tools help the AI agent answer questions about system activity, user actions,
and maintain compliance audit trails.
"""

from datetime import datetime, timedelta
from typing import Literal, Optional

from pydantic import BaseModel, Field

from src.db.validators import sanitize_string, validate_uuid
from src.tools.base import TUPSAFETool


# ============================================================================
# Input Schemas
# ============================================================================


class RecentAuditLogsInput(BaseModel):
    """Input schema for querying recent audit logs."""

    user_id: Optional[str] = Field(None, description="Filter by user UUID")
    action: Optional[str] = Field(
        None,
        description="Filter by action type (e.g., 'login', 'create', 'update', 'approve')",
    )
    entity_type: Optional[str] = Field(
        None,
        description="Filter by entity type (e.g., 'pds_submission', 'profile', 'saln_submission')",
    )
    days_back: int = Field(7, ge=1, le=90, description="Number of days to look back (1-90)")
    limit: int = Field(50, ge=1, le=200, description="Maximum records to return (1-200)")


class UserActivityInput(BaseModel):
    """Input schema for querying user activity."""

    user_id: str = Field(..., description="UUID of the user to analyze")
    days_back: int = Field(30, ge=1, le=365, description="Number of days to look back (1-365)")


class AuditSummaryInput(BaseModel):
    """Input schema for audit summary."""

    days_back: int = Field(30, ge=1, le=365, description="Number of days to analyze (1-365)")


class SecurityEventsInput(BaseModel):
    """Input schema for security events."""

    days_back: int = Field(7, ge=1, le=90, description="Number of days to look back (1-90)")
    limit: int = Field(50, ge=1, le=200, description="Maximum records to return (1-200)")


# ============================================================================
# Tool Classes
# ============================================================================


class GetRecentAuditLogsTool(TUPSAFETool):
    """Get recent audit logs with optional filters.

    Useful for tracking system activity, debugging issues, and compliance monitoring.
    Returns audit trail entries that match the specified criteria.
    """

    name: str = "get_recent_audit_logs"
    description: str = """Get recent audit logs with optional filters for compliance monitoring.

Returns:
- logs: List of audit log entries with user details
- count: Total number of logs returned
- filters: Applied filters
- period: Time period covered

Example: get_recent_audit_logs(action="approve", entity_type="saln_submission", days_back=30)"""
    args_schema: type[BaseModel] = RecentAuditLogsInput

    def _run(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        days_back: int = 7,
        limit: int = 50,
    ) -> str:
        """Execute the recent audit logs query.

        Args:
            user_id: Filter by specific user UUID (optional)
            action: Filter by action type (optional)
            entity_type: Filter by entity type (optional)
            days_back: Number of days to look back (1-90, default 7)
            limit: Maximum records to return (1-200, default 50)

        Returns:
            JSON string with audit log entries and metadata
        """
        try:
            # Validate and sanitize inputs
            if user_id:
                if not validate_uuid(user_id):
                    raise ValueError(f"Invalid user_id format: {user_id}")
                user_id = sanitize_string(user_id)

            if action:
                action = sanitize_string(action)

            if entity_type:
                entity_type = sanitize_string(entity_type)

            # Validate days_back and limit
            if days_back < 1 or days_back > 90:
                raise ValueError("days_back must be between 1 and 90")

            if limit < 1 or limit > 200:
                raise ValueError("limit must be between 1 and 200")

            # Calculate date range
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()

            # Build query
            query = self._query(
                "audit_logs",
                "id,user_id,action,entity_type,entity_id,changes,ip_address,user_agent,created_at,metadata",
            )

            # Apply filters
            if user_id:
                query = query.eq("user_id", user_id)

            if action:
                query = query.eq("action", action)

            if entity_type:
                query = query.eq("entity_type", entity_type)

            # Date filter
            query = query.gte("created_at", start_date)

            # Order by most recent first and apply limit
            query = query.order("created_at", desc=True).limit(limit)

            # Execute query
            response = query.execute()
            logs_data = response.data or []

            # Fetch user information for each log
            user_ids = list(set(log.get("user_id") for log in logs_data if log.get("user_id")))
            users_map = {}

            if user_ids:
                users_response = (
                    self._query("profiles", "id,email,first_name,last_name")
                    .in_("id", user_ids)
                    .execute()
                )

                for user in users_response.data or []:
                    users_map[str(user["id"])] = {
                        "email": user.get("email", "unknown@tup.edu.ph"),
                        "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                        or "Unknown User",
                    }

            # Enrich logs with user information
            enriched_logs = []
            for log in logs_data:
                user_info = users_map.get(
                    str(log.get("user_id")),
                    {"email": "system@tup.edu.ph", "name": "System"},
                )

                enriched_logs.append({
                    "id": str(log.get("id")),
                    "user_id": str(log.get("user_id")) if log.get("user_id") else None,
                    "user_email": user_info.get("email"),
                    "user_name": user_info.get("name"),
                    "action": log.get("action"),
                    "entity_type": log.get("entity_type"),
                    "entity_id": str(log.get("entity_id")) if log.get("entity_id") else None,
                    "changes": log.get("changes"),
                    "ip_address": log.get("ip_address"),
                    "user_agent": log.get("user_agent"),
                    "created_at": log.get("created_at"),
                    "metadata": log.get("metadata"),
                })

            # Format response
            result_data = {
                "logs": enriched_logs,
                "count": len(enriched_logs),
                "filters": {
                    "user_id": user_id,
                    "action": action,
                    "entity_type": entity_type,
                    "days_back": days_back,
                    "limit": limit,
                },
                "period": {
                    "start_date": start_date,
                    "end_date": datetime.now().isoformat(),
                },
            }

            message = f"Retrieved {len(enriched_logs)} audit log entries from the last {days_back} days"

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "user_id": user_id,
                    "action": action,
                    "entity_type": entity_type,
                    "days_back": days_back,
                    "limit": limit,
                },
            )


class GetUserActivityTool(TUPSAFETool):
    """Get activity summary for a specific user.

    Provides a summary of user actions over the specified period.
    Useful for compliance audits, user behavior analysis, and security monitoring.
    """

    name: str = "get_user_activity"
    description: str = """Get activity summary for a specific user including actions, logins, and daily patterns.

Returns:
- user_info: User details (email, name, type)
- total_actions: Total actions by this user
- actions_by_type: Breakdown by action type
- entities_affected: Breakdown by entity type
- recent_logins: Recent login timestamps
- most_active_days: Days with most activity

Example: get_user_activity(user_id="550e8400-e29b-41d4-a716-446655440000", days_back=30)"""
    args_schema: type[BaseModel] = UserActivityInput

    def _run(self, user_id: str, days_back: int = 30) -> str:
        """Execute the user activity query.

        Args:
            user_id: UUID of the user to analyze
            days_back: Number of days to look back (1-365, default 30)

        Returns:
            JSON string with user activity summary
        """
        try:
            # Validate user_id
            if not validate_uuid(user_id):
                raise ValueError(f"Invalid user_id format: {user_id}")

            user_id = sanitize_string(user_id)

            # Validate days_back
            if days_back < 1 or days_back > 365:
                raise ValueError("days_back must be between 1 and 365")

            # Get user information
            user_response = (
                self._query("profiles", "id,email,first_name,last_name,user_type")
                .eq("id", user_id)
                .execute()
            )

            if not user_response.data:
                raise ValueError(f"User not found: {user_id}")

            user_data = user_response.data[0]
            user_info = {
                "user_id": str(user_data.get("id")),
                "email": user_data.get("email"),
                "name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                or "Unknown",
                "user_type": user_data.get("user_type"),
            }

            # Calculate date range
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()

            # Get all audit logs for this user
            logs_response = (
                self._query("audit_logs", "id,action,entity_type,entity_id,created_at,ip_address")
                .eq("user_id", user_id)
                .gte("created_at", start_date)
                .order("created_at", desc=True)
                .execute()
            )

            logs = logs_response.data or []
            total_actions = len(logs)

            # Actions by type breakdown
            actions_by_type = {}
            for log in logs:
                action = log.get("action", "unknown")
                actions_by_type[action] = actions_by_type.get(action, 0) + 1

            # Entities affected breakdown
            entities_affected = {}
            for log in logs:
                entity_type = log.get("entity_type", "unknown")
                entities_affected[entity_type] = entities_affected.get(entity_type, 0) + 1

            # Recent login events
            login_logs = [log for log in logs if log.get("action") in ["login", "session_start"]]
            recent_logins = [
                {
                    "timestamp": log.get("created_at"),
                    "ip_address": log.get("ip_address"),
                }
                for log in login_logs[:10]  # Last 10 logins
            ]

            # Most active days
            daily_activity = {}
            for log in logs:
                created_at = log.get("created_at")
                if created_at:
                    date = datetime.fromisoformat(created_at).date().isoformat()
                    daily_activity[date] = daily_activity.get(date, 0) + 1

            most_active_days = sorted(
                [{"date": date, "count": count} for date, count in daily_activity.items()],
                key=lambda x: x["count"],
                reverse=True,
            )[:7]  # Top 7 days

            # Format response
            result_data = {
                "user_info": user_info,
                "total_actions": total_actions,
                "actions_by_type": actions_by_type,
                "entities_affected": entities_affected,
                "recent_logins": recent_logins,
                "most_active_days": most_active_days,
                "period": {
                    "start_date": start_date,
                    "end_date": datetime.now().isoformat(),
                    "days_back": days_back,
                },
            }

            message = f"Retrieved activity summary for {user_info['email']}: {total_actions} actions over {days_back} days"

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "user_id": user_id,
                    "days_back": days_back,
                },
            )


class GetAuditSummaryTool(TUPSAFETool):
    """Get aggregated audit log summary statistics.

    Provides high-level overview of system activity and audit trail health.
    Useful for compliance reporting and system monitoring.
    """

    name: str = "get_audit_summary"
    description: str = """Get aggregated audit log summary statistics for compliance reporting.

Returns:
- total_actions: Total actions logged in period
- by_action: Breakdown by action type
- by_entity_type: Breakdown by entity type
- top_users: Most active users
- by_day: Daily activity counts

Example: get_audit_summary(days_back=30)"""
    args_schema: type[BaseModel] = AuditSummaryInput

    def _run(self, days_back: int = 30) -> str:
        """Execute the audit summary query.

        Args:
            days_back: Number of days to analyze (1-365, default 30)

        Returns:
            JSON string with audit summary statistics
        """
        try:
            # Validate days_back
            if days_back < 1 or days_back > 365:
                raise ValueError("days_back must be between 1 and 365")

            # Calculate date range
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()

            # Get all audit logs in period
            logs_response = (
                self._query("audit_logs", "id,user_id,action,entity_type,created_at")
                .gte("created_at", start_date)
                .execute()
            )

            logs = logs_response.data or []
            total_actions = len(logs)

            # Breakdown by action
            by_action = {}
            for log in logs:
                action = log.get("action", "unknown")
                by_action[action] = by_action.get(action, 0) + 1

            # Breakdown by entity type
            by_entity_type = {}
            for log in logs:
                entity_type = log.get("entity_type", "unknown")
                by_entity_type[entity_type] = by_entity_type.get(entity_type, 0) + 1

            # Top users by action count
            user_counts = {}
            for log in logs:
                user_id = log.get("user_id")
                if user_id:
                    user_counts[str(user_id)] = user_counts.get(str(user_id), 0) + 1

            top_user_ids = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[
                :10
            ]  # Top 10 users

            # Fetch user details
            top_users = []
            if top_user_ids:
                user_ids = [user_id for user_id, _ in top_user_ids]
                users_response = (
                    self._query("profiles", "id,email,first_name,last_name")
                    .in_("id", user_ids)
                    .execute()
                )

                users_map = {
                    str(user["id"]): {
                        "email": user.get("email"),
                        "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                        or "Unknown",
                    }
                    for user in (users_response.data or [])
                }

                top_users = [
                    {
                        "user_id": user_id,
                        "user_email": users_map.get(user_id, {}).get(
                            "email", "unknown@tup.edu.ph"
                        ),
                        "user_name": users_map.get(user_id, {}).get("name", "Unknown"),
                        "action_count": count,
                    }
                    for user_id, count in top_user_ids
                ]

            # Daily activity breakdown
            by_day = {}
            for log in logs:
                created_at = log.get("created_at")
                if created_at:
                    date = datetime.fromisoformat(created_at).date().isoformat()
                    by_day[date] = by_day.get(date, 0) + 1

            # Sort by date
            by_day_sorted = dict(sorted(by_day.items()))

            # Format response
            result_data = {
                "total_actions": total_actions,
                "by_action": by_action,
                "by_entity_type": by_entity_type,
                "top_users": top_users,
                "by_day": by_day_sorted,
                "period": {
                    "start_date": start_date,
                    "end_date": datetime.now().isoformat(),
                    "days_back": days_back,
                },
            }

            message = f"Audit summary: {total_actions} actions over {days_back} days"

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "days_back": days_back,
                },
            )


class GetSecurityEventsTool(TUPSAFETool):
    """Get security-relevant audit events.

    Returns audit logs filtered for security-sensitive actions like logins,
    permission changes, failed access attempts, and administrative actions.
    """

    name: str = "get_security_events"
    description: str = """Get security-relevant audit events for monitoring and threat detection.

Returns:
- events: List of security events with severity
- count: Total number of events
- by_severity: Breakdown by severity level
- failed_attempts: Number of failed login/access attempts
- admin_actions: Number of administrative actions

Example: get_security_events(days_back=7, limit=50)"""
    args_schema: type[BaseModel] = SecurityEventsInput

    def _run(self, days_back: int = 7, limit: int = 50) -> str:
        """Execute the security events query.

        Args:
            days_back: Number of days to look back (1-90, default 7)
            limit: Maximum records to return (1-200, default 50)

        Returns:
            JSON string with security events and threat analysis
        """
        try:
            # Validate inputs
            if days_back < 1 or days_back > 90:
                raise ValueError("days_back must be between 1 and 90")

            if limit < 1 or limit > 200:
                raise ValueError("limit must be between 1 and 200")

            # Calculate date range
            start_date = (datetime.now() - timedelta(days=days_back)).isoformat()

            # Security-relevant actions
            security_actions = [
                "login",
                "logout",
                "login_failed",
                "permission_change",
                "role_change",
                "delete",
                "export",
                "archive",
                "restore",
            ]

            # Get security-relevant logs
            logs_response = (
                self._query(
                    "audit_logs",
                    "id,user_id,action,entity_type,entity_id,changes,ip_address,user_agent,created_at,metadata",
                )
                .in_("action", security_actions)
                .gte("created_at", start_date)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            logs = logs_response.data or []

            # Fetch user information
            user_ids = list(set(log.get("user_id") for log in logs if log.get("user_id")))
            users_map = {}

            if user_ids:
                users_response = (
                    self._query("profiles", "id,email,first_name,last_name")
                    .in_("id", user_ids)
                    .execute()
                )

                for user in users_response.data or []:
                    users_map[str(user["id"])] = {
                        "email": user.get("email", "unknown@tup.edu.ph"),
                        "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                        or "Unknown User",
                    }

            # Determine severity for each event
            def get_severity(action: str) -> str:
                if action in ["delete", "permission_change", "role_change"]:
                    return "high"
                elif action in ["login_failed", "export"]:
                    return "medium"
                else:
                    return "low"

            # Enrich events
            events = []
            by_severity = {"low": 0, "medium": 0, "high": 0, "critical": 0}
            failed_attempts = 0
            admin_actions = 0

            for log in logs:
                action = log.get("action", "unknown")
                severity = get_severity(action)
                by_severity[severity] += 1

                if action == "login_failed":
                    failed_attempts += 1

                if action in ["delete", "permission_change", "role_change", "archive", "restore"]:
                    admin_actions += 1

                user_info = users_map.get(
                    str(log.get("user_id")),
                    {"email": "system@tup.edu.ph", "name": "System"},
                )

                events.append({
                    "id": str(log.get("id")),
                    "user_id": str(log.get("user_id")) if log.get("user_id") else None,
                    "user_email": user_info.get("email"),
                    "user_name": user_info.get("name"),
                    "action": action,
                    "entity_type": log.get("entity_type"),
                    "entity_id": str(log.get("entity_id")) if log.get("entity_id") else None,
                    "severity": severity,
                    "ip_address": log.get("ip_address"),
                    "user_agent": log.get("user_agent"),
                    "created_at": log.get("created_at"),
                    "changes": log.get("changes"),
                    "metadata": log.get("metadata"),
                })

            # Format response
            result_data = {
                "events": events,
                "count": len(events),
                "by_severity": by_severity,
                "failed_attempts": failed_attempts,
                "admin_actions": admin_actions,
                "period": {
                    "start_date": start_date,
                    "end_date": datetime.now().isoformat(),
                    "days_back": days_back,
                },
            }

            message = (
                f"Found {len(events)} security events: "
                f"{failed_attempts} failed attempts, {admin_actions} admin actions"
            )

            return self._format_single_response(result_data, message)

        except Exception as e:
            return self._handle_error(
                e,
                {
                    "days_back": days_back,
                    "limit": limit,
                },
            )


# ============================================================================
# Tool Instances (for LangChain agent)
# ============================================================================

get_recent_audit_logs = GetRecentAuditLogsTool()
get_user_activity = GetUserActivityTool()
get_audit_summary = GetAuditSummaryTool()
get_security_events = GetSecurityEventsTool()
