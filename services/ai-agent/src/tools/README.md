# TUPSAFE AI Agent Database Query Tools

This directory contains the MCP (Model Context Protocol) client and database query tools for the TUPSAFE AI Agent. These tools enable the agent to query the Supabase PostgreSQL database for PDS/SALN submission data, user information, compliance metrics, and department statistics.

## Architecture

### MCP Client (`mcp_client.py`)

The `SupabaseMCPClient` provides a lightweight, async interface for executing SQL queries against the Supabase database using the MCP protocol.

**Key Features:**
- Async/await support with context manager
- Connection pooling and timeout management
- Singleton pattern for global access
- Health check capability
- Comprehensive error handling

**Usage:**
```python
from src.tools.mcp_client import get_mcp_client

# Get the global client instance
client = get_mcp_client()

# Execute a query
result = await client.execute_sql("""
    SELECT COUNT(*) as count
    FROM pds_submissions
    WHERE status = 'approved'
""")

if result.success:
    count = result.data[0]['count']
    print(f"Approved PDS: {count}")
```

**Lifecycle Management:**
```python
from src.tools.mcp_client import initialize_mcp_client, close_mcp_client

# In FastAPI lifespan or application startup
await initialize_mcp_client()

# In application shutdown
await close_mcp_client()
```

## Tool Categories

### 1. Submission Tools (`submissions.py`)

Query tools for PDS and SALN submissions.

#### `get_submission_count(submission_type, status=None)`
Count PDS or SALN submissions, optionally filtered by status.

**Parameters:**
- `submission_type`: `'pds'` or `'saln'`
- `status`: Optional - `'draft'`, `'submitted'`, `'reviewing'`, `'approved'`, `'rejected'`

**Returns:**
```python
{
    "count": 150,
    "submission_type": "pds",
    "status": "approved"
}
```

#### `get_submissions_by_department(submission_type, year=None)`
Get submission breakdown by department.

**Parameters:**
- `submission_type`: `'pds'` or `'saln'`
- `year`: Optional year filter (e.g., 2025)

**Returns:**
```python
{
    "departments": [
        {
            "id": "uuid",
            "name": "Department of Computer Science",
            "code": "DCS",
            "count": 45
        },
        ...
    ],
    "submission_type": "pds",
    "year": 2025,
    "total_submissions": 450
}
```

#### `get_pending_submissions(submission_type=None)`
Count submissions pending review (status: submitted or reviewing).

**Parameters:**
- `submission_type`: Optional - `'pds'` or `'saln'` (if None, counts both)

**Returns:**
```python
{
    "pending_count": 23,
    "submitted_count": 15,
    "reviewing_count": 8,
    "submission_type": "all"
}
```

#### `get_offices_with_most_submissions(submission_type, limit=10)`
Get top offices ranked by submission count.

**Parameters:**
- `submission_type`: `'pds'` or `'saln'`
- `limit`: Number of top offices (1-50, default 10)

**Returns:**
```python
{
    "top_offices": [
        {
            "rank": 1,
            "id": "uuid",
            "name": "College of Engineering",
            "code": "COE",
            "office_type": "academic",
            "total_submissions": 120,
            "approved": 100,
            "submitted": 15,
            "reviewing": 5
        },
        ...
    ],
    "submission_type": "pds",
    "limit": 10
}
```

### 2. User Tools (`users.py`)

Query tools for employee and applicant information.

#### `get_employee_count(employment_category=None, include_inactive=False)`
Count employees, optionally filtered by category and active status.

**Parameters:**
- `employment_category`: Optional - `'faculty'`, `'administrative'`, `'contractual'`
- `include_inactive`: Whether to include inactive employees (default: False)

**Returns:**
```python
{
    "total_employees": 450,
    "employment_category": "all",
    "include_inactive": false,
    "breakdown": {
        "faculty": 280,
        "administrative": 120,
        "contractual": 50
    }
}
```

#### `get_applicant_count(account_status=None)`
Count applicants, optionally filtered by account status.

**Parameters:**
- `account_status`: Optional - `'pending'`, `'active'`, `'suspended'`, `'rejected'`

**Returns:**
```python
{
    "total_applicants": 85,
    "account_status": "all",
    "breakdown": {
        "pending": 25,
        "active": 50,
        "rejected": 10
    }
}
```

#### `get_employees_with_submissions(submission_type, year=None)`
Count employees who have submitted PDS/SALN.

**Parameters:**
- `submission_type`: `'pds'`, `'saln'`, or `'both'`
- `year`: Optional year filter

**Returns:**
```python
{
    "employees_with_submissions": 380,
    "total_employees": 450,
    "submission_type": "saln",
    "year": 2025,
    "compliance_rate": 84.44
}
```

### 3. Compliance Tools (`compliance.py`)

Calculate compliance rates and track non-compliance.

#### `get_saln_compliance_rate(year, department_id=None)`
Calculate SALN compliance rate for a specific year.

**Parameters:**
- `year`: Year for SALN filing (e.g., 2025)
- `department_id`: Optional department UUID filter

**Returns:**
```python
{
    "year": 2025,
    "department_id": "all",
    "total_employees": 450,
    "employees_compliant": 380,
    "employees_pending": 45,
    "employees_non_compliant": 25,
    "compliance_rate": 84.44,
    "submission_rate": 94.44
}
```

**Compliance Calculation:**
- **Compliance Rate**: (Approved SALN / Total Employees) × 100
- **Submission Rate**: ((Approved + Pending) / Total Employees) × 100

#### `get_pds_compliance_rate(department_id=None)`
Calculate PDS compliance rate (any approved PDS on file).

**Parameters:**
- `department_id`: Optional department UUID filter

**Returns:**
```python
{
    "department_id": "all",
    "total_employees": 450,
    "employees_compliant": 420,
    "employees_pending": 20,
    "employees_non_compliant": 10,
    "compliance_rate": 93.33,
    "submission_rate": 97.78
}
```

#### `get_pending_submissions_by_department(submission_type=None)`
Get pending submissions breakdown by department.

**Parameters:**
- `submission_type`: Optional - `'pds'` or `'saln'` (if None, includes both)

**Returns:**
```python
{
    "departments": [
        {
            "id": "uuid",
            "name": "Department of Computer Science",
            "code": "DCS",
            "submitted": 8,
            "reviewing": 3,
            "total_pending": 11
        },
        ...
    ],
    "submission_type": "all",
    "total_pending": 68
}
```

### 4. Department Tools (`departments.py`)

Query department information and statistics.

#### `get_department_list(office_type=None, include_inactive=False)`
Get list of all departments/offices.

**Parameters:**
- `office_type`: Optional - `'academic'` or `'administrative'`
- `include_inactive`: Whether to include inactive departments

**Returns:**
```python
{
    "departments": [
        {
            "id": "uuid",
            "name": "Department of Computer Science",
            "code": "DCS",
            "office_type": "academic",
            "parent_college_id": "uuid",
            "parent_college_name": "College of Science",
            "parent_college_code": "COS",
            "is_active": true,
            "employee_count": 45,
            "is_college": false,
            "created_at": "2024-01-01T00:00:00Z"
        },
        ...
    ],
    "total_count": 28,
    "office_type": "all",
    "include_inactive": false
}
```

#### `get_department_stats(department_id)`
Get comprehensive statistics for a specific department.

**Parameters:**
- `department_id`: UUID of the department

**Returns:**
```python
{
    "department": {
        "id": "uuid",
        "name": "Department of Computer Science",
        "code": "DCS",
        "office_type": "academic",
        "is_active": true,
        "parent_college_name": "College of Science",
        "parent_college_code": "COS"
    },
    "employees": {
        "total": 45,
        "faculty": 35,
        "administrative": 8,
        "contractual": 2
    },
    "pds_stats": {
        "total_submissions": 48,
        "employees_with_approved": 42,
        "employees_with_pending": 2,
        "employees_without": 1,
        "compliance_rate": 93.33
    },
    "saln_stats": {
        "total_submissions": 135,
        "current_year": 2025,
        "current_year_approved": 38,
        "current_year_pending": 5,
        "current_year_without": 2,
        "compliance_rate": 84.44,
        "last_year_approved": 40
    },
    "pending_reviews": {
        "pds": 2,
        "saln": 5,
        "total": 7
    }
}
```

### 5. Job Application Tools (`jobs.py`)

Query job application and open position data.

#### `get_job_application_stats(status=None)`
Get job application statistics, optionally filtered by status.

**Parameters:**
- `status`: Optional - 'pending', 'under_review', 'shortlisted', 'for_interview', 'interviewed', 'for_final_review', 'accepted', 'rejected', 'withdrawn', 'hired'

**Returns:**
```python
{
    "total_applications": 85,
    "status_filter": "all",
    "status_breakdown": {
        "pending": 15,
        "under_review": 20,
        "shortlisted": 12,
        "for_interview": 8,
        "interviewed": 6,
        "for_final_review": 4,
        "accepted": 3,
        "rejected": 10,
        "withdrawn": 5,
        "hired": 2
    },
    "active_applications": 70,
    "successful_applications": 5
}
```

#### `get_open_positions_by_department(position_status=None, employment_category=None)`
Get open positions breakdown by department with optional filters.

**Parameters:**
- `position_status`: Optional - 'open', 'closed', 'filled', 'cancelled'
- `employment_category`: Optional - 'faculty', 'administrative', 'contractual'

**Returns:**
```python
{
    "departments": [
        {
            "id": "uuid",
            "name": "College of Engineering",
            "code": "COE",
            "office_type": "academic",
            "total_positions": 8,
            "open": 5,
            "closed": 2,
            "filled": 1,
            "cancelled": 0,
            "application_count": 45
        },
        ...
    ],
    "position_status": "all",
    "employment_category": "all",
    "total_positions": 28,
    "open_positions": 16,
    "filled_positions": 4
}
```

#### `get_application_funnel_metrics(position_id=None)`
Get application funnel metrics showing conversion rates through hiring process.

**Parameters:**
- `position_id`: Optional position UUID for specific position funnel (if None, shows aggregate)

**Returns:**
```python
{
    "position_id": "all",
    "funnel_stages": [
        {
            "stage": "Total Applications",
            "count": 85,
            "conversion_rate": 100.0
        },
        {
            "stage": "Under Review",
            "count": 70,
            "conversion_rate": 82.35
        },
        {
            "stage": "Shortlisted",
            "count": 30,
            "conversion_rate": 35.29
        },
        {
            "stage": "Interview Stage",
            "count": 18,
            "conversion_rate": 21.18
        },
        {
            "stage": "Interviewed",
            "count": 14,
            "conversion_rate": 16.47
        },
        {
            "stage": "Final Review",
            "count": 7,
            "conversion_rate": 8.24
        },
        {
            "stage": "Accepted",
            "count": 5,
            "conversion_rate": 5.88
        },
        {
            "stage": "Hired",
            "count": 2,
            "conversion_rate": 2.35
        }
    ],
    "total_applications": 85,
    "hired": 2,
    "rejected": 10,
    "withdrawn": 5,
    "conversion_rate": 2.35
}
```

#### `get_position_application_summary()`
Get summary of open positions and their application metrics.

**Parameters:** None

**Returns:**
```python
{
    "total_open_positions": 16,
    "positions": [
        {
            "id": "uuid",
            "title": "Assistant Professor - Computer Science",
            "employment_category": "faculty",
            "department_name": "Department of Computer Science",
            "department_code": "DCS",
            "application_count": 25,
            "active_applications": 20,
            "accepted_applications": 2,
            "created_at": "2025-01-01T00:00:00Z",
            "application_deadline": "2025-03-31T23:59:59Z"
        },
        ...
    ],
    "total_applications": 180,
    "average_applications_per_position": 11.25
}
```

## Database Schema Reference

### Key Tables

**profiles**
- `id`: UUID (primary key)
- `user_type`: `'employee'` | `'applicant'`
- `role`: User role (employee, supervisor, hr, admin)
- `department_id`: Foreign key to departments
- `account_status`: `'pending'` | `'active'` | `'suspended'` | `'rejected'`
- `employment_category`: `'faculty'` | `'administrative'` | `'contractual'`
- `is_active`: Boolean
- `first_name`, `last_name`, `email`: User details

**departments**
- `id`: UUID (primary key)
- `name`: Department name
- `code`: Department code (e.g., "DCS")
- `office_type`: `'academic'` | `'administrative'`
- `parent_college_id`: UUID (nullable, for department hierarchy)
- `is_active`: Boolean

**pds_submissions**
- `id`: UUID (primary key)
- `user_id`: Foreign key to profiles
- `year`: Integer (optional for PDS)
- `status`: `'draft'` | `'submitted'` | `'reviewing'` | `'approved'` | `'rejected'`
- `submitted_at`, `approved_at`: Timestamps

**saln_submissions**
- `id`: UUID (primary key)
- `user_id`: Foreign key to profiles
- `year`: Integer (required for SALN)
- `status`: Same as PDS
- `total_assets`, `total_liabilities`, `net_worth`: Numeric
- `submitted_at`, `approved_at`: Timestamps

**job_applications**
- `id`: UUID (primary key)
- `applicant_id`: Foreign key to profiles
- `position_id`: Foreign key to open_positions
- `application_number`: String (e.g., "APP-20250109-0001")
- `status`: Application status

**open_positions**
- `id`: UUID (primary key)
- `department_id`: Foreign key to departments
- `title`: Position title
- `employment_category`: Employment type
- `status`: Position status

## Usage with LangGraph Agent

### Basic Setup

```python
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from src.tools import TUPSAFE_TOOLS, initialize_mcp_client, close_mcp_client

# Initialize MCP client
await initialize_mcp_client()

# Create LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Create agent with all tools
agent = create_react_agent(llm, tools=TUPSAFE_TOOLS)

# Use the agent
response = await agent.ainvoke({
    "messages": [("user", "How many employees have submitted their SALN for 2025?")]
})

# Cleanup
await close_mcp_client()
```

### With FastAPI Lifespan

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.tools import initialize_mcp_client, close_mcp_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_mcp_client()
    yield
    # Shutdown
    await close_mcp_client()

app = FastAPI(lifespan=lifespan)
```

## Error Handling

All tools return error information in their response dictionaries:

```python
result = await get_submission_count("pds", "approved")

if "error" in result:
    print(f"Error: {result['error']}")
    # Handle error gracefully
else:
    print(f"Count: {result['count']}")
```

## Performance Considerations

1. **Database Indexing**: Ensure proper indexes on:
   - `profiles.user_type`, `profiles.department_id`, `profiles.is_active`
   - `pds_submissions.user_id`, `pds_submissions.status`, `pds_submissions.year`
   - `saln_submissions.user_id`, `saln_submissions.status`, `saln_submissions.year`
   - `departments.is_active`, `departments.parent_college_id`

2. **Query Optimization**:
   - Use `COUNT(DISTINCT p.id)` instead of `COUNT(*)` for accurate employee counts
   - Avoid N+1 queries by using JOINs
   - Filter on `is_active = true` and `account_status = 'active'` for current employees

3. **Caching Strategy**:
   - Department lists change infrequently (cache for 1 hour)
   - Employee counts update daily (cache for 15 minutes)
   - Submission counts update in real-time (cache for 1-5 minutes)
   - Compliance rates recalculated nightly (cache until next calculation)

## Testing

Run tests for the tools:

```bash
# Run all tool tests
pytest tests/tools/ -v

# Run specific test file
pytest tests/tools/test_submissions.py -v

# Run with coverage
pytest tests/tools/ --cov=src.tools --cov-report=html
```

## Security Notes

1. **SQL Injection Prevention**: All tools use parameterized queries or proper escaping
2. **RLS Enforcement**: Database-level Row Level Security (RLS) enforces access control
3. **Service Role Key**: MCP client uses service role key with full access - never expose to clients
4. **Audit Logging**: All queries are logged with user context for compliance tracking

## Development Guidelines

### Adding New Tools

1. Create tool function with `@tool` decorator
2. Define Pydantic input schema for validation
3. Use `get_mcp_client()` for database access
4. Return consistent dictionary structure
5. Include error handling and informative docstrings
6. Add to `TUPSAFE_TOOLS` list in `__init__.py`
7. Write tests in `tests/tools/`

### Example Tool Template

```python
from typing import Any, Optional
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from src.tools.mcp_client import get_mcp_client


class MyToolInput(BaseModel):
    """Input schema for my_tool."""

    param1: str = Field(..., description="Description of param1")
    param2: Optional[int] = Field(None, description="Optional param2")


@tool(args_schema=MyToolInput)
async def my_tool(param1: str, param2: Optional[int] = None) -> dict[str, Any]:
    """
    Brief description of what this tool does.

    Detailed explanation of the tool's purpose and behavior.

    Args:
        param1: Description of param1
        param2: Description of param2

    Returns:
        Dictionary containing:
        - result: The result value
        - param1: Echo of param1
        - param2: Echo of param2 (or 'none')

    Example:
        >>> result = await my_tool("test", 42)
        >>> print(result['result'])
    """
    client = get_mcp_client()

    query = """
        SELECT ... FROM ... WHERE ...
    """

    result = await client.execute_sql(query)

    if not result.success:
        return {
            "result": None,
            "error": result.error
        }

    return {
        "result": result.data[0] if result.data else None,
        "param1": param1,
        "param2": param2 or "none"
    }
```

## Troubleshooting

### Common Issues

**Issue**: `RuntimeError: MCP client not initialized`
- **Solution**: Call `await initialize_mcp_client()` during startup

**Issue**: `ModuleNotFoundError: No module named 'langchain_core'`
- **Solution**: Install dependencies with `uv sync` or `pip install -r requirements.txt`

**Issue**: Empty query results
- **Solution**: Check RLS policies, ensure test data exists, verify query syntax

**Issue**: Slow query performance
- **Solution**: Add database indexes, optimize JOINs, use EXPLAIN to analyze query plan

## Additional Resources

- [LangChain Tools Documentation](https://python.langchain.com/docs/modules/tools/)
- [LangGraph Agent Documentation](https://langchain-ai.github.io/langgraph/)
- [Supabase PostgREST API](https://postgrest.org/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## License

Copyright (c) 2025 Technological University of the Philippines
