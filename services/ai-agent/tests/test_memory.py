"""Tests for the memory module.

Run with: pytest tests/test_memory.py -v
"""

import pytest
from datetime import datetime

from src.memory import (
    RedisChatHistory,
    ResponseCache,
    RedisCheckpointer,
    ConversationMemory,
    initialize_redis,
    close_redis,
    get_redis_client,
)


@pytest.fixture(scope="module")
async def redis_connection():
    """Initialize Redis connection for tests."""
    await initialize_redis()
    yield
    await close_redis()


@pytest.fixture
def unique_session_id():
    """Generate unique session ID for each test."""
    return f"test_session_{datetime.now().timestamp()}"


@pytest.fixture
def unique_thread_id():
    """Generate unique thread ID for each test."""
    return f"test_thread_{datetime.now().timestamp()}"


class TestRedisChatHistory:
    """Tests for RedisChatHistory class."""

    @pytest.mark.asyncio
    async def test_add_and_get_message(self, redis_connection, unique_session_id):
        """Test adding and retrieving a single message."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Add message
        await chat.add_message(session_id, "user", "Hello, world!")

        # Retrieve messages
        messages = await chat.get_messages(session_id)

        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "Hello, world!"
        assert "timestamp" in messages[0]

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_add_multiple_messages(self, redis_connection, unique_session_id):
        """Test adding multiple messages at once."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        messages_to_add = [
            ("user", "First message"),
            ("assistant", "First response"),
            ("user", "Second message"),
        ]

        await chat.add_messages(session_id, messages_to_add)

        # Retrieve messages
        messages = await chat.get_messages(session_id)

        assert len(messages) == 3
        assert messages[0]["content"] == "First message"
        assert messages[1]["content"] == "First response"
        assert messages[2]["content"] == "Second message"

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_get_messages_with_limit(self, redis_connection, unique_session_id):
        """Test retrieving messages with limit."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Add 10 messages
        messages_to_add = [(f"user", f"Message {i}") for i in range(10)]
        await chat.add_messages(session_id, messages_to_add)

        # Retrieve with limit
        messages = await chat.get_messages(session_id, limit=5)

        assert len(messages) == 5
        # Should get the most recent 5 messages
        assert messages[-1]["content"] == "Message 9"

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_get_message_count(self, redis_connection, unique_session_id):
        """Test getting message count."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Initially should be 0
        count = await chat.get_message_count(session_id)
        assert count == 0

        # Add messages
        await chat.add_messages(
            session_id,
            [("user", "msg1"), ("assistant", "msg2"), ("user", "msg3")],
        )

        # Count should be 3
        count = await chat.get_message_count(session_id)
        assert count == 3

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_session_exists(self, redis_connection, unique_session_id):
        """Test checking if session exists."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Should not exist initially
        exists = await chat.session_exists(session_id)
        assert not exists

        # Add a message
        await chat.add_message(session_id, "user", "Test")

        # Should exist now
        exists = await chat.session_exists(session_id)
        assert exists

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_get_last_message(self, redis_connection, unique_session_id):
        """Test retrieving the last message."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Add messages
        await chat.add_messages(
            session_id,
            [("user", "First"), ("assistant", "Second"), ("user", "Third")],
        )

        # Get last message
        last_msg = await chat.get_last_message(session_id)

        assert last_msg is not None
        assert last_msg["content"] == "Third"
        assert last_msg["role"] == "user"

        # Cleanup
        await chat.clear_history(session_id)

    @pytest.mark.asyncio
    async def test_clear_history(self, redis_connection, unique_session_id):
        """Test clearing chat history."""
        chat = RedisChatHistory()
        session_id = unique_session_id

        # Add messages
        await chat.add_message(session_id, "user", "Test message")

        # Verify exists
        count = await chat.get_message_count(session_id)
        assert count == 1

        # Clear history
        await chat.clear_history(session_id)

        # Verify cleared
        count = await chat.get_message_count(session_id)
        assert count == 0


class TestResponseCache:
    """Tests for ResponseCache class."""

    @pytest.mark.asyncio
    async def test_cache_and_retrieve_response(self, redis_connection):
        """Test caching and retrieving a response."""
        cache = ResponseCache()

        query = "What is PDS?"
        response = "PDS stands for Personal Data Sheet."
        model = "test-model"

        # Cache response
        query_hash = await cache.cache_response(
            query=query,
            response=response,
            model=model,
        )

        assert query_hash is not None
        assert len(query_hash) == 64  # SHA-256 hash

        # Retrieve cached response
        cached = await cache.get_cached_response(query=query, model=model)

        assert cached is not None
        assert cached["query"] == query
        assert cached["response"] == response
        assert cached["model"] == model
        assert "cached_at" in cached

        # Cleanup
        await cache.invalidate_cache(query=query, model=model)

    @pytest.mark.asyncio
    async def test_cache_miss(self, redis_connection):
        """Test cache miss for non-existent query."""
        cache = ResponseCache()

        cached = await cache.get_cached_response(
            query="Non-existent query",
            model="test-model",
        )

        assert cached is None

    @pytest.mark.asyncio
    async def test_cache_with_different_parameters(self, redis_connection):
        """Test that different parameters create different cache keys."""
        cache = ResponseCache()

        query = "Test query"
        response = "Test response"

        # Cache with temperature 0.7
        await cache.cache_response(
            query=query,
            response=response,
            model="model-1",
            temperature=0.7,
        )

        # Cache with temperature 0.9 (different key)
        await cache.cache_response(
            query=query,
            response=response + " different",
            model="model-1",
            temperature=0.9,
        )

        # Retrieve both
        cached_07 = await cache.get_cached_response(
            query=query,
            model="model-1",
            temperature=0.7,
        )

        cached_09 = await cache.get_cached_response(
            query=query,
            model="model-1",
            temperature=0.9,
        )

        assert cached_07["response"] == "Test response"
        assert cached_09["response"] == "Test response different"

        # Cleanup
        await cache.invalidate_cache(query=query, model="model-1", temperature=0.7)
        await cache.invalidate_cache(query=query, model="model-1", temperature=0.9)

    @pytest.mark.asyncio
    async def test_invalidate_cache(self, redis_connection):
        """Test cache invalidation."""
        cache = ResponseCache()

        query = "Test query for invalidation"
        response = "Test response"

        # Cache response
        await cache.cache_response(query=query, response=response)

        # Verify cached
        cached = await cache.get_cached_response(query=query)
        assert cached is not None

        # Invalidate
        invalidated = await cache.invalidate_cache(query=query)
        assert invalidated

        # Verify invalidated
        cached = await cache.get_cached_response(query=query)
        assert cached is None

    @pytest.mark.asyncio
    async def test_get_cache_stats(self, redis_connection):
        """Test getting cache statistics."""
        cache = ResponseCache()

        # Clear any existing cache
        await cache.clear_all_cache()

        # Add some cached responses
        for i in range(5):
            await cache.cache_response(
                query=f"Query {i}",
                response=f"Response {i}",
                model="test-model",
            )

        # Get stats
        stats = await cache.get_cache_stats()

        assert stats["total_entries"] >= 5
        assert stats["total_memory_bytes"] > 0
        assert stats["total_memory_mb"] > 0

        # Cleanup
        await cache.clear_all_cache()


class TestConversationMemory:
    """Tests for ConversationMemory class."""

    @pytest.mark.asyncio
    async def test_add_exchange(self, redis_connection, unique_session_id):
        """Test adding user-assistant exchange."""
        memory = ConversationMemory()
        session_id = unique_session_id

        # Add exchange
        await memory.add_exchange(
            session_id=session_id,
            user_message="Hello",
            assistant_message="Hi there!",
        )

        # Get context
        context = await memory.get_conversation_context(session_id)

        assert len(context) == 2
        assert context[0]["role"] == "user"
        assert context[0]["content"] == "Hello"
        assert context[1]["role"] == "assistant"
        assert context[1]["content"] == "Hi there!"

        # Cleanup
        await memory.clear_conversation(session_id)

    @pytest.mark.asyncio
    async def test_get_conversation_context_with_limit(
        self, redis_connection, unique_session_id
    ):
        """Test getting conversation context with limit."""
        memory = ConversationMemory()
        session_id = unique_session_id

        # Add multiple exchanges
        for i in range(5):
            await memory.add_exchange(
                session_id=session_id,
                user_message=f"User message {i}",
                assistant_message=f"Assistant message {i}",
            )

        # Get context with limit
        context = await memory.get_conversation_context(session_id, limit=6)

        assert len(context) == 6  # Last 3 exchanges (6 messages)

        # Cleanup
        await memory.clear_conversation(session_id)

    @pytest.mark.asyncio
    async def test_clear_conversation(self, redis_connection, unique_session_id):
        """Test clearing conversation."""
        memory = ConversationMemory()
        session_id = unique_session_id

        # Add exchange
        await memory.add_exchange(
            session_id=session_id,
            user_message="Test",
            assistant_message="Response",
        )

        # Verify exists
        count = await memory.chat_history.get_message_count(session_id)
        assert count == 2

        # Clear
        await memory.clear_conversation(session_id)

        # Verify cleared
        count = await memory.chat_history.get_message_count(session_id)
        assert count == 0


class TestRedisConnection:
    """Tests for Redis connection management."""

    @pytest.mark.asyncio
    async def test_get_redis_client(self, redis_connection):
        """Test getting Redis client."""
        client = get_redis_client()
        assert client is not None

        # Test basic operation
        await client.set("test_key", "test_value")
        value = await client.get("test_key")
        assert value == "test_value"

        # Cleanup
        await client.delete("test_key")

    @pytest.mark.asyncio
    async def test_redis_ping(self, redis_connection):
        """Test Redis ping."""
        client = get_redis_client()
        pong = await client.ping()
        assert pong is True
