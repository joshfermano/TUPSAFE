"""Usage examples for the TUPSAFE AI Agent memory module.

These examples demonstrate how to use the Redis-backed memory system
for conversation management, checkpointing, and caching.
"""

import asyncio
from typing import Any

from .chat_history import RedisChatHistory
from .cache import ConversationMemory, ResponseCache
from .checkpointer import RedisCheckpointer
from .redis_store import initialize_redis, close_redis


async def example_chat_history():
    """Example: Using RedisChatHistory for conversation management."""
    print("\n=== Chat History Example ===")

    chat = RedisChatHistory(ttl=604800)  # 7 days
    session_id = "user_123_session"

    # Add individual messages
    await chat.add_message(session_id, "user", "What is PDS?")
    await chat.add_message(
        session_id,
        "assistant",
        "PDS stands for Personal Data Sheet, a standardized form used in the Philippines.",
    )

    # Add multiple messages at once
    await chat.add_messages(
        session_id,
        [
            ("user", "How do I submit my PDS?"),
            ("assistant", "You can submit your PDS through the TUPSAFE employee portal."),
        ],
    )

    # Retrieve messages
    messages = await chat.get_messages(session_id, limit=10)
    print(f"Total messages: {len(messages)}")
    for msg in messages:
        print(f"  [{msg['role']}] {msg['content'][:50]}...")

    # Get message count
    count = await chat.get_message_count(session_id)
    print(f"Message count: {count}")

    # Get last message
    last_msg = await chat.get_last_message(session_id)
    print(f"Last message: [{last_msg['role']}] {last_msg['content'][:50]}...")

    # Check TTL
    ttl = await chat.get_ttl(session_id)
    print(f"Remaining TTL: {ttl} seconds")

    # Clear history
    await chat.clear_history(session_id)
    print("Chat history cleared")


async def example_response_cache():
    """Example: Using ResponseCache for LLM response caching."""
    print("\n=== Response Cache Example ===")

    cache = ResponseCache(ttl=3600)  # 1 hour

    # Cache a response
    query = "Explain SALN requirements for TUP faculty"
    response = (
        "SALN (Statement of Assets, Liabilities and Net Worth) is required annually for all "
        "TUP faculty members. The deadline is typically April 30 each year."
    )

    query_hash = await cache.cache_response(
        query=query,
        response=response,
        model="claude-sonnet-4",
        temperature=0.7,
        metadata={"category": "compliance"},
    )

    print(f"Cached response with hash: {query_hash[:8]}...")

    # Retrieve cached response
    cached = await cache.get_cached_response(
        query=query,
        model="claude-sonnet-4",
        temperature=0.7,
    )

    if cached:
        print(f"Cache hit! Response: {cached['response'][:100]}...")
        print(f"Cached at: {cached['cached_at']}")

    # Get cache statistics
    stats = await cache.get_cache_stats()
    print(f"\nCache statistics:")
    print(f"  Total entries: {stats['total_entries']}")
    print(f"  Memory usage: {stats['total_memory_mb']} MB")

    # Invalidate specific cache entry
    invalidated = await cache.invalidate_cache(
        query=query,
        model="claude-sonnet-4",
        temperature=0.7,
    )
    print(f"\nCache invalidated: {invalidated}")


async def example_checkpointer():
    """Example: Using RedisCheckpointer for LangGraph state persistence."""
    print("\n=== Checkpointer Example ===")

    from langchain_core.runnables import RunnableConfig

    checkpointer = RedisCheckpointer(ttl=86400)  # 24 hours

    # Create a checkpoint
    thread_id = "conversation_456"
    checkpoint_id = "checkpoint_001"

    config: RunnableConfig = {
        "configurable": {
            "thread_id": thread_id,
        }
    }

    # Simulate checkpoint data (in real use, this comes from LangGraph)
    checkpoint = {
        "v": 1,
        "id": checkpoint_id,
        "ts": "2025-01-09T10:30:00Z",
        "channel_values": {
            "messages": ["Hello", "How can I help?"],
            "context": {"user_id": "user_123"},
        },
        "channel_versions": {},
        "versions_seen": {},
    }

    metadata = {
        "source": "update",
        "step": 1,
        "writes": {},
        "parents": {},
    }

    # Store checkpoint
    updated_config = await checkpointer.aput(
        config=config,
        checkpoint=checkpoint,
        metadata=metadata,
        new_versions={},
    )

    print(f"Stored checkpoint for thread {thread_id}")
    print(f"Updated config: {updated_config['configurable']}")

    # Retrieve checkpoint
    retrieved = await checkpointer.aget(updated_config)

    if retrieved:
        print(f"\nRetrieved checkpoint:")
        print(f"  Checkpoint ID: {retrieved.checkpoint['id']}")
        print(f"  Step: {retrieved.metadata['step']}")
        print(f"  Messages: {retrieved.checkpoint['channel_values']['messages']}")

    # List all checkpoints for thread
    print(f"\nListing checkpoints for thread {thread_id}:")
    count = 0
    async for checkpoint_tuple in checkpointer.alist(config, limit=10):
        count += 1
        print(f"  - Checkpoint {checkpoint_tuple.checkpoint['id']} at step {checkpoint_tuple.metadata['step']}")

    print(f"Total checkpoints: {count}")


async def example_conversation_memory():
    """Example: Using ConversationMemory for unified memory management."""
    print("\n=== Conversation Memory Example ===")

    memory = ConversationMemory(
        checkpoint_ttl=86400,  # 24 hours
        chat_ttl=604800,       # 7 days
        cache_ttl=3600,        # 1 hour
    )

    session_id = "user_789"

    # Add user-assistant exchange
    await memory.add_exchange(
        session_id=session_id,
        user_message="What documents do I need for my job application?",
        assistant_message=(
            "For your job application to TUP Manila, you need: "
            "1) Updated PDS, 2) Resume/CV, 3) Cover letter, "
            "4) Transcript of records, 5) Professional licenses (if applicable)"
        ),
    )

    # Add another exchange
    await memory.add_exchange(
        session_id=session_id,
        user_message="How do I submit these documents?",
        assistant_message=(
            "You can submit all documents through the TUPSAFE employee portal "
            "in the Job Applications section. Upload PDFs of each document."
        ),
    )

    # Get conversation context
    context = await memory.get_conversation_context(session_id, limit=10)

    print(f"Conversation context ({len(context)} messages):")
    for msg in context:
        print(f"  [{msg['role']}] {msg['content'][:80]}...")

    # Access individual components
    print("\nAccessing individual components:")

    # Chat history
    count = await memory.chat_history.get_message_count(session_id)
    print(f"  Chat message count: {count}")

    # Response cache
    cache_stats = await memory.response_cache.get_cache_stats()
    print(f"  Cache entries: {cache_stats['total_entries']}")

    # Clear conversation
    await memory.clear_conversation(session_id)
    print("\nConversation cleared")


async def example_langchain_integration():
    """Example: Using RedisChatHistory with LangChain messages."""
    print("\n=== LangChain Integration Example ===")

    chat = RedisChatHistory()
    session_id = "langchain_session"

    # Add messages
    await chat.add_messages(
        session_id,
        [
            ("system", "You are a helpful assistant for TUP Manila's TUPSAFE system."),
            ("user", "Hello, can you help me with my SALN submission?"),
            ("assistant", "Of course! I'd be happy to help you with your SALN submission."),
        ],
    )

    # Retrieve as LangChain message objects
    lc_messages = await chat.get_messages(session_id, as_langchain=True)

    print(f"Retrieved {len(lc_messages)} LangChain messages:")
    for msg in lc_messages:
        msg_type = type(msg).__name__
        print(f"  {msg_type}: {msg.content[:60]}...")

    await chat.clear_history(session_id)


async def example_performance_monitoring():
    """Example: Monitoring memory module performance."""
    print("\n=== Performance Monitoring Example ===")

    import time

    cache = ResponseCache()
    chat = RedisChatHistory()

    # Benchmark cache operations
    start = time.time()
    for i in range(100):
        await cache.cache_response(
            query=f"test query {i}",
            response=f"test response {i}",
            model="test-model",
        )
    cache_write_time = time.time() - start

    print(f"100 cache writes: {cache_write_time:.2f}s ({cache_write_time*10:.1f}ms per write)")

    # Benchmark chat operations
    session_id = "perf_test"
    start = time.time()
    for i in range(100):
        await chat.add_message(session_id, "user", f"message {i}")
    chat_write_time = time.time() - start

    print(f"100 chat writes: {chat_write_time:.2f}s ({chat_write_time*10:.1f}ms per write)")

    # Benchmark retrieval
    start = time.time()
    messages = await chat.get_messages(session_id, limit=100)
    chat_read_time = time.time() - start

    print(f"Read 100 messages: {chat_read_time*1000:.1f}ms")

    # Get final stats
    stats = await cache.get_cache_stats()
    print(f"\nFinal cache stats:")
    print(f"  Entries: {stats['total_entries']}")
    print(f"  Memory: {stats['total_memory_mb']} MB")

    # Cleanup
    await cache.clear_all_cache()
    await chat.clear_history(session_id)


async def main():
    """Run all examples."""
    # Initialize Redis
    await initialize_redis()
    print("Redis initialized")

    try:
        # Run examples
        await example_chat_history()
        await example_response_cache()
        await example_checkpointer()
        await example_conversation_memory()
        await example_langchain_integration()
        await example_performance_monitoring()

    finally:
        # Cleanup
        await close_redis()
        print("\nRedis connection closed")


if __name__ == "__main__":
    asyncio.run(main())
