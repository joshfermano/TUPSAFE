# TUPSAFE AI Agent Memory Module

Redis-backed memory system for managing conversation state, chat history, and LLM response caching.

## Features

- **Redis Connection Management**: Async Redis client with connection pooling and health checks
- **LangGraph Checkpointing**: Persistent conversation state for agent workflows
- **Chat History**: Efficient message storage with configurable TTL
- **Response Caching**: Hash-based LLM response caching to reduce API calls
- **Unified Interface**: ConversationMemory for simplified memory management

## Architecture

```
memory/
├── redis_store.py      # Redis connection and lifecycle management
├── checkpointer.py     # LangGraph checkpoint storage
├── chat_history.py     # Chat message history
├── cache.py            # LLM response caching + ConversationMemory
└── __init__.py         # Module exports
```

## Quick Start

### 1. Initialize Redis (FastAPI Lifespan)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from memory import initialize_redis, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_redis()
    yield
    # Shutdown
    await close_redis()

app = FastAPI(lifespan=lifespan)
```

### 2. Use Chat History

```python
from memory import RedisChatHistory

chat = RedisChatHistory(ttl=604800)  # 7 days

# Add messages
await chat.add_message("session_123", "user", "What is PDS?")
await chat.add_message("session_123", "assistant", "PDS stands for...")

# Retrieve messages
messages = await chat.get_messages("session_123", limit=50)

# Get as LangChain messages
lc_messages = await chat.get_messages("session_123", as_langchain=True)

# Clear history
await chat.clear_history("session_123")
```

### 3. Use LangGraph Checkpointing

```python
from memory import RedisCheckpointer
from langgraph.graph import StateGraph

checkpointer = RedisCheckpointer(ttl=86400)  # 24 hours

# Create graph with checkpointing
graph = StateGraph(state_schema)
# ... define nodes and edges ...
app = graph.compile(checkpointer=checkpointer)

# Run with thread_id for persistence
config = {"configurable": {"thread_id": "user_123"}}
result = await app.ainvoke({"input": "Hello"}, config=config)

# Resume conversation
result2 = await app.ainvoke({"input": "Continue..."}, config=config)
```

### 4. Use Response Caching

```python
from memory import ResponseCache

cache = ResponseCache(ttl=3600)  # 1 hour

# Cache response
query = "Explain SALN requirements"
response = "SALN stands for..."
query_hash = await cache.cache_response(
    query=query,
    response=response,
    model="claude-sonnet-4",
    temperature=0.7,
)

# Retrieve cached response
cached = await cache.get_cached_response(
    query=query,
    model="claude-sonnet-4",
    temperature=0.7,
)

if cached:
    print(cached["response"])  # "SALN stands for..."

# Get cache stats
stats = await cache.get_cache_stats()
print(f"Total entries: {stats['total_entries']}")
print(f"Memory usage: {stats['total_memory_mb']} MB")
```

### 5. Use Unified ConversationMemory

```python
from memory import ConversationMemory

memory = ConversationMemory(
    checkpoint_ttl=86400,  # 24 hours
    chat_ttl=604800,       # 7 days
    cache_ttl=3600,        # 1 hour
)

# Add user-assistant exchange
await memory.add_exchange(
    session_id="user_123",
    user_message="What is my PDS status?",
    assistant_message="Your PDS is approved.",
)

# Get conversation context
context = await memory.get_conversation_context(
    session_id="user_123",
    limit=10,
)

# Access individual components
await memory.chat_history.add_message("user_123", "system", "Session started")
await memory.response_cache.clear_all_cache()
```

## Redis Key Patterns

| Component      | Key Pattern                                      | TTL | Purpose         |
| -------------- | ------------------------------------------------ | --- | --------------- |
| Checkpoints    | `tupsafe:checkpoint:{thread_id}:{checkpoint_id}` | 24h | LangGraph state |
| Chat History   | `tupsafe:chat:{session_id}`                      | 7d  | Message history |
| Response Cache | `tupsafe:cache:{query_hash}`                     | 1h  | LLM responses   |

## Configuration

Configure Redis connection in `.env`:

```env
REDIS_URL=redis://localhost:6379
# Or with password:
REDIS_URL=redis://:password@localhost:6379
# Or Redis Cloud:
REDIS_URL=redis://:password@host:port
```

## API Reference

### RedisStore

```python
class RedisStore:
    async def connect() -> None
    async def disconnect() -> None
    async def health_check() -> dict[str, Any]
    async def get_info() -> dict[str, Any]
    @property client -> redis.Redis
    @property is_connected -> bool
```

### RedisChatHistory

```python
class RedisChatHistory:
    async def add_message(session_id: str, role: str, content: str) -> None
    async def add_messages(session_id: str, messages: list[tuple[str, str]]) -> None
    async def get_messages(session_id: str, limit: int = 50, as_langchain: bool = False) -> list
    async def get_message_count(session_id: str) -> int
    async def clear_history(session_id: str) -> None
    async def update_ttl(session_id: str, new_ttl: int) -> None
    async def get_ttl(session_id: str) -> int
    async def session_exists(session_id: str) -> bool
    async def get_last_message(session_id: str, as_langchain: bool = False) -> dict | None
```

### RedisCheckpointer

```python
class RedisCheckpointer(BaseCheckpointSaver):
    async def aget(config: RunnableConfig) -> CheckpointTuple | None
    async def aput(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: dict) -> RunnableConfig
    async def alist(config: RunnableConfig, limit: int | None = None) -> AsyncIterator[CheckpointTuple]
    async def adelete_thread(thread_id: str) -> None
```

### ResponseCache

```python
class ResponseCache:
    async def cache_response(query: str, response: str, model: str | None = None, **kwargs) -> str
    async def get_cached_response(query: str, model: str | None = None, **kwargs) -> dict | None
    async def invalidate_cache(query: str, model: str | None = None, **kwargs) -> bool
    async def clear_all_cache() -> int
    async def get_cache_stats() -> dict[str, Any]
    async def update_cache_ttl(query: str, new_ttl: int, **kwargs) -> bool
```

### ConversationMemory

```python
class ConversationMemory:
    checkpointer: RedisCheckpointer
    chat_history: RedisChatHistory
    response_cache: ResponseCache

    async def add_exchange(session_id: str, user_message: str, assistant_message: str) -> None
    async def get_conversation_context(session_id: str, limit: int = 10) -> list[dict]
    async def clear_conversation(session_id: str) -> None
```

## Health Check Endpoint

Add Redis health check to your FastAPI app:

```python
from fastapi import FastAPI
from memory import get_redis_store

@app.get("/health/redis")
async def redis_health():
    store = get_redis_store()
    health = await store.health_check()
    info = await store.get_info()
    return {
        "health": health,
        "info": info,
    }
```

## Production Considerations

### Connection Pooling

Default pool size is 50 connections. Adjust based on load:

```python
from memory.redis_store import RedisStore

store = RedisStore(
    redis_url=settings.REDIS_URL,
    max_connections=100,  # Increase for high-traffic
)
await store.connect()
```

### Error Handling

All methods handle Redis errors gracefully:

```python
# Returns empty list on error
messages = await chat.get_messages("session_123")

# Returns None on error
cached = await cache.get_cached_response(query)

# Logs error and raises exception
await chat.add_message("session_123", "user", "Hello")  # Raises on failure
```

### TTL Management

- **Checkpoints**: 24 hours (state for resuming conversations)
- **Chat History**: 7 days (compliance and context)
- **Cache**: 1 hour (balance freshness vs cost savings)

Adjust TTLs based on:

- Data retention policies
- Redis memory limits
- Performance requirements

### Memory Monitoring

Monitor Redis memory usage:

```python
cache = ResponseCache()
stats = await cache.get_cache_stats()

if stats["total_memory_mb"] > 1000:  # 1GB limit
    await cache.clear_all_cache()
```

### High Availability

For production Redis:

- Use Redis Sentinel or Redis Cluster
- Enable AOF persistence
- Configure backup schedules
- Set maxmemory-policy (allkeys-lru recommended)

## Testing

```python
import pytest
from memory import initialize_redis, close_redis, RedisChatHistory

@pytest.fixture(scope="session")
async def redis_connection():
    await initialize_redis()
    yield
    await close_redis()

@pytest.mark.asyncio
async def test_chat_history(redis_connection):
    chat = RedisChatHistory()
    await chat.add_message("test_session", "user", "Hello")
    messages = await chat.get_messages("test_session")
    assert len(messages) == 1
    assert messages[0]["content"] == "Hello"
    await chat.clear_history("test_session")
```

## Performance

Benchmark results (local Redis):

- `add_message`: ~1ms
- `get_messages` (50): ~2ms
- `cache_response`: ~1ms
- `get_cached_response`: ~1ms
- `health_check`: ~0.5ms

Network latency adds ~5-50ms for cloud Redis (e.g., Upstash, Redis Cloud).

## Troubleshooting

### Connection Refused

```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solution**: Check Redis is running and REDIS_URL is correct.

### Authentication Failed

```
redis.exceptions.AuthenticationError: invalid password
```

**Solution**: Verify Redis password in REDIS_URL.

### Memory Issues

```
OOM command not allowed when used memory > 'maxmemory'
```

**Solution**: Increase Redis maxmemory or enable eviction policy:

```
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## License

Part of TUPSAFE AI Agent Service
