# TUPSAFE AI Agent Tests

Comprehensive test suite for the TUPSAFE AI Agent service using pytest.

## Test Structure

```
tests/
├── __init__.py           # Test package initialization
├── conftest.py           # Shared fixtures and configuration
├── test_health.py        # Health endpoint tests
├── test_chat.py          # Chat API tests
├── test_tools.py         # Database tools tests
└── test_agent.py         # Agent behavior tests
```

## Test Coverage

### Health Endpoints (`test_health.py`)
- Health check endpoint returns 200 OK
- Health response includes version and timestamp
- Readiness and liveness checks
- Response structure validation
- Content type verification

### Chat API (`test_chat.py`)
- **Authentication**: Token validation, role-based access
- **Request Validation**: Message requirements, optional parameters
- **Response Handling**: Success responses, error handling
- **Streaming**: SSE events, completion signals
- **Session Management**: Clear session functionality

### Database Tools (`test_tools.py`)
- **Employee Tools**: Count queries, category filtering, active/inactive status
- **Applicant Tools**: Count queries, status filtering
- **Compliance Tools**: SALN/PDS compliance rates, pending submissions
- **Submission Tools**: Submission counts, department breakdowns
- **MCP Client**: Query execution, error handling

### Agent (`test_agent.py`)
- **Initialization**: Default/custom settings, tool integration, memory setup
- **Invocation**: Message processing, session ID generation
- **Streaming**: Event streaming, state updates
- **Memory**: Conversation history, session clearing
- **Tool Usage**: Tool selection, query routing
- **Configuration**: Model selection, temperature, streaming

## Running Tests

### Run All Tests

```bash
# From service root directory
pytest tests/

# With coverage
pytest tests/ --cov=src --cov-report=html --cov-report=term

# With verbose output
pytest tests/ -v
```

### Run Specific Test Files

```bash
# Health tests only
pytest tests/test_health.py

# Chat tests only
pytest tests/test_chat.py -v

# Tools tests only
pytest tests/test_tools.py

# Agent tests only
pytest tests/test_agent.py
```

### Run by Test Class or Function

```bash
# Run specific test class
pytest tests/test_chat.py::TestChatAuthentication -v

# Run specific test function
pytest tests/test_health.py::TestHealthEndpoints::test_health_endpoint_returns_ok -v
```

### Run with Markers

```bash
# Run async tests only
pytest tests/ -m asyncio

# Run integration tests
pytest tests/ -m integration

# Run unit tests
pytest tests/ -m unit
```

## Test Fixtures

Common fixtures available in `conftest.py`:

### Configuration
- `mock_settings`: Mock application settings
- `override_settings`: Context manager for setting overrides

### HTTP Clients
- `async_client`: Async HTTP client for FastAPI
- `sync_client`: Synchronous test client

### Authentication
- `sample_user`: Sample user data
- `valid_jwt_token`: Valid JWT for testing
- `invalid_jwt_token`: Invalid JWT for error cases
- `auth_headers`: HTTP headers with Bearer token

### Mocks
- `mock_mcp_client`: Mock Supabase MCP client
- `mock_redis`: Mock Redis client
- `mock_agent`: Mock TUPSAFE Agent
- `mock_llm_response`: Mock LLM response data

### Test Data
- `sample_employee_data`: Employee records
- `sample_submission_data`: Submission records
- `sample_compliance_data`: Compliance metrics

## Writing Tests

### Example: Async Test with Fixtures

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_my_endpoint(
    async_client: AsyncClient,
    auth_headers: dict[str, str]
):
    """Test my endpoint with authentication."""
    response = await async_client.post(
        "/my-endpoint",
        json={"data": "test"},
        headers=auth_headers
    )

    assert response.status_code == 200
    assert "result" in response.json()
```

### Example: Mocking MCP Client

```python
import pytest
from unittest.mock import patch, AsyncMock
from src.tools.mcp_client import MCPQueryResult

@pytest.mark.asyncio
async def test_with_mock_mcp():
    """Test tool with mocked database."""
    mock_client = AsyncMock()
    mock_client.execute_sql.return_value = MCPQueryResult(
        success=True,
        data=[{"count": 100}],
        row_count=1
    )

    with patch("src.tools.users.get_mcp_client", return_value=mock_client):
        result = await my_tool_function()
        assert result["total"] == 100
```

### Example: Testing Streaming Responses

```python
@pytest.mark.asyncio
async def test_stream_response(async_client: AsyncClient, auth_headers: dict[str, str]):
    """Test streaming SSE response."""
    response = await async_client.post(
        "/chat/stream",
        json={"message": "Test"},
        headers=auth_headers
    )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
```

## Best Practices

1. **Use Async Fixtures**: Mark async tests with `@pytest.mark.asyncio`
2. **Mock External Dependencies**: Always mock MCP client, Redis, LLM calls
3. **Test Both Success and Failure**: Include error handling tests
4. **Isolate Tests**: Each test should be independent
5. **Clear Descriptions**: Use descriptive test names and docstrings
6. **Parametrize When Possible**: Use `@pytest.mark.parametrize` for multiple cases

## Coverage Goals

- **Overall Coverage**: >80%
- **Critical Paths**: 100% (authentication, data queries)
- **Error Handling**: All exception paths tested
- **Edge Cases**: Boundary conditions covered

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    pytest tests/ \
      --cov=src \
      --cov-report=xml \
      --cov-report=term \
      --junit-xml=test-results.xml
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `pythonpath` is set in `pytest.ini`
2. **Async Warnings**: Use `asyncio_mode = "auto"` in configuration
3. **Fixture Not Found**: Check fixture is in `conftest.py` or imported
4. **Mock Not Working**: Verify the patch target path matches import

### Debug Tips

```bash
# Run with debugging output
pytest tests/ -vv -s

# Stop on first failure
pytest tests/ -x

# Run last failed tests
pytest tests/ --lf

# Show local variables on failure
pytest tests/ -l
```

## Contributing

When adding new features:

1. Write tests for new endpoints/tools
2. Maintain >80% coverage
3. Follow existing test patterns
4. Update this README if needed
5. Run full test suite before committing

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [httpx Testing](https://www.python-httpx.org/async/)
