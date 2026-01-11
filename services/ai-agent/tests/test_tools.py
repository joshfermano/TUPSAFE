"""Tests for database query tools.

Tests the various database tools that the AI agent uses to query
employee, submission, compliance, and department data.
"""

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from src.tools.mcp_client import MCPQueryResult
from src.tools.users import get_employee_count, get_applicant_count
from src.tools.compliance import (
    get_saln_compliance_rate,
    get_pds_compliance_rate,
    get_pending_submissions_by_department,
)
from src.tools.submissions import (
    get_submission_count,
    get_submissions_by_department,
)


@pytest.mark.asyncio
class TestEmployeeCountTool:
    """Test suite for employee count tool."""

    async def test_get_employee_count_returns_dict(self):
        """Test that get_employee_count returns dictionary with expected fields."""
        # Mock MCP client
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            # Total count query
            MCPQueryResult(success=True, data=[{"count": 150}], row_count=1),
            # Breakdown query
            MCPQueryResult(
                success=True,
                data=[
                    {"employment_category": "faculty", "count": 80},
                    {"employment_category": "administrative", "count": 50},
                    {"employment_category": "contractual", "count": 20},
                ],
                row_count=3,
            ),
        ]

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            result = await get_employee_count()

            assert isinstance(result, dict)
            assert "total_employees" in result
            assert "breakdown" in result
            assert result["total_employees"] == 150

    async def test_get_employee_count_filters_by_category(self):
        """Test employee count filtering by employment category."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            MCPQueryResult(success=True, data=[{"count": 80}], row_count=1),
            MCPQueryResult(
                success=True,
                data=[{"employment_category": "faculty", "count": 80}],
                row_count=1,
            ),
        ]

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            result = await get_employee_count(employment_category="faculty")

            assert result["total_employees"] == 80
            assert result["employment_category"] == "faculty"

    async def test_get_employee_count_includes_inactive(self):
        """Test employee count with inactive employees included."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            MCPQueryResult(success=True, data=[{"count": 180}], row_count=1),
            MCPQueryResult(
                success=True,
                data=[
                    {"employment_category": "faculty", "count": 90},
                    {"employment_category": "administrative", "count": 60},
                    {"employment_category": "contractual", "count": 30},
                ],
                row_count=3,
            ),
        ]

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            result = await get_employee_count(include_inactive=True)

            assert result["total_employees"] == 180
            assert result["include_inactive"] is True

    async def test_get_employee_count_handles_error(self):
        """Test employee count handles database errors gracefully."""
        mock_client = AsyncMock()
        mock_client.execute_sql.return_value = MCPQueryResult(
            success=False, error="Database connection failed", row_count=0
        )

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            result = await get_employee_count()

            assert result["total_employees"] == 0
            assert "error" in result


@pytest.mark.asyncio
class TestApplicantCountTool:
    """Test suite for applicant count tool."""

    async def test_get_applicant_count_returns_dict(self):
        """Test that get_applicant_count returns dictionary with expected fields."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            MCPQueryResult(success=True, data=[{"count": 50}], row_count=1),
            MCPQueryResult(
                success=True,
                data=[
                    {"account_status": "pending", "count": 20},
                    {"account_status": "active", "count": 25},
                    {"account_status": "rejected", "count": 5},
                ],
                row_count=3,
            ),
        ]

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            result = await get_applicant_count()

            assert isinstance(result, dict)
            assert "total_applicants" in result
            assert "breakdown" in result
            assert result["total_applicants"] == 50


@pytest.mark.asyncio
class TestComplianceTools:
    """Test suite for compliance calculation tools."""

    async def test_get_saln_compliance_rate_returns_percentages(self):
        """Test that SALN compliance rate returns proper percentages."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            # Total employees
            MCPQueryResult(success=True, data=[{"count": 150}], row_count=1),
            # Compliant employees
            MCPQueryResult(success=True, data=[{"count": 120}], row_count=1),
            # Pending employees
            MCPQueryResult(success=True, data=[{"count": 20}], row_count=1),
        ]

        with patch("src.tools.compliance.get_mcp_client", return_value=mock_client):
            result = await get_saln_compliance_rate(year=2025)

            assert result["year"] == 2025
            assert result["total_employees"] == 150
            assert result["employees_compliant"] == 120
            assert result["employees_pending"] == 20
            assert result["employees_non_compliant"] == 10
            assert result["compliance_rate"] == 80.0
            assert result["submission_rate"] == 93.33

    async def test_get_pds_compliance_rate_returns_percentages(self):
        """Test that PDS compliance rate returns proper percentages."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            MCPQueryResult(success=True, data=[{"count": 150}], row_count=1),
            MCPQueryResult(success=True, data=[{"count": 140}], row_count=1),
            MCPQueryResult(success=True, data=[{"count": 8}], row_count=1),
        ]

        with patch("src.tools.compliance.get_mcp_client", return_value=mock_client):
            result = await get_pds_compliance_rate()

            assert result["total_employees"] == 150
            assert result["employees_compliant"] == 140
            assert result["employees_pending"] == 8
            assert result["employees_non_compliant"] == 2
            assert result["compliance_rate"] == 93.33

    async def test_get_pending_submissions_by_department(self):
        """Test getting pending submissions grouped by department."""
        mock_client = AsyncMock()
        mock_client.execute_sql.return_value = MCPQueryResult(
            success=True,
            data=[
                {
                    "department_id": "dept-1",
                    "department_name": "Engineering",
                    "department_code": "ENG",
                    "status": "submitted",
                    "count": 10,
                },
                {
                    "department_id": "dept-1",
                    "department_name": "Engineering",
                    "department_code": "ENG",
                    "status": "reviewing",
                    "count": 5,
                },
                {
                    "department_id": "dept-2",
                    "department_name": "Science",
                    "department_code": "SCI",
                    "status": "submitted",
                    "count": 8,
                },
            ],
            row_count=3,
        )

        with patch("src.tools.compliance.get_mcp_client", return_value=mock_client):
            result = await get_pending_submissions_by_department()

            assert "departments" in result
            assert "total_pending" in result
            assert len(result["departments"]) > 0
            assert result["total_pending"] == 23


@pytest.mark.asyncio
class TestSubmissionTools:
    """Test suite for submission query tools."""

    async def test_get_submission_count_returns_dict(self):
        """Test that submission count returns proper statistics."""
        mock_client = AsyncMock()
        mock_client.execute_sql.side_effect = [
            MCPQueryResult(success=True, data=[{"count": 300}], row_count=1),
            MCPQueryResult(
                success=True,
                data=[
                    {"status": "approved", "count": 200},
                    {"status": "pending", "count": 80},
                    {"status": "rejected", "count": 20},
                ],
                row_count=3,
            ),
        ]

        with patch("src.tools.submissions.get_mcp_client", return_value=mock_client):
            from src.tools.submissions import get_submission_count

            result = await get_submission_count(submission_type="pds")

            assert isinstance(result, dict)
            assert "total_submissions" in result
            assert "breakdown" in result

    async def test_get_submissions_by_department(self):
        """Test getting submissions grouped by department."""
        mock_client = AsyncMock()
        mock_client.execute_sql.return_value = MCPQueryResult(
            success=True,
            data=[
                {
                    "department_id": "dept-1",
                    "department_name": "Engineering",
                    "department_code": "ENG",
                    "submission_count": 50,
                },
                {
                    "department_id": "dept-2",
                    "department_name": "Science",
                    "department_code": "SCI",
                    "submission_count": 45,
                },
            ],
            row_count=2,
        )

        with patch("src.tools.submissions.get_mcp_client", return_value=mock_client):
            from src.tools.submissions import get_submissions_by_department

            result = await get_submissions_by_department(submission_type="saln")

            assert isinstance(result, dict)
            assert "departments" in result


@pytest.mark.asyncio
class TestMCPClientMocking:
    """Test suite for MCP client mock behavior."""

    async def test_mock_mcp_client_execute_sql(self, mock_mcp_client: AsyncMock):
        """Test that mock MCP client can execute SQL queries.

        Args:
            mock_mcp_client: Mock MCP client fixture.
        """
        result = await mock_mcp_client.execute_sql(
            "SELECT COUNT(*) FROM profiles"
        )

        assert result.success
        assert result.data is not None
        assert result.row_count > 0

    async def test_mock_mcp_client_health_check(self, mock_mcp_client: AsyncMock):
        """Test that mock MCP client health check works.

        Args:
            mock_mcp_client: Mock MCP client fixture.
        """
        is_healthy = await mock_mcp_client.health_check()

        assert is_healthy is True

    async def test_tools_use_correct_queries(self):
        """Test that tools generate correct SQL queries."""
        mock_client = AsyncMock()
        mock_client.execute_sql.return_value = MCPQueryResult(
            success=True, data=[{"count": 100}], row_count=1
        )

        with patch("src.tools.users.get_mcp_client", return_value=mock_client):
            await get_employee_count(employment_category="faculty")

            # Verify SQL query contains the filter
            call_args = mock_client.execute_sql.call_args_list[0][0][0]
            assert "employment_category = 'faculty'" in call_args
            assert "user_type = 'employee'" in call_args
