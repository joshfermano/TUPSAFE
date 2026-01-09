"""TUPSAFE AI Agent Memory Module.

Redis-backed memory system for conversation state management,
chat history, and LLM response caching.

Components:
    - RedisStore: Redis connection and lifecycle management
    - RedisCheckpointer: LangGraph checkpoint storage
    - RedisChatHistory: Chat message history storage
    - ResponseCache: LLM response caching
    - ConversationMemory: Unified memory interface

Usage:
    # Initialize Redis during app startup
    from memory import initialize_redis, close_redis

    @app.on_event("startup")
    async def startup_event():
        await initialize_redis()

    @app.on_event("shutdown")
    async def shutdown_event():
        await close_redis()

    # Use in agent code
    from memory import get_redis_client, RedisChatHistory

    client = get_redis_client()
    chat = RedisChatHistory()
    await chat.add_message("session_123", "user", "Hello!")
"""

# Redis connection management
from .redis_store import (
    RedisStore,
    close_redis,
    get_redis_client,
    get_redis_store,
    initialize_redis,
)

# LangGraph checkpointing
from .checkpointer import RedisCheckpointer

# Chat history
from .chat_history import RedisChatHistory

# Response caching and unified memory
from .cache import ConversationMemory, ResponseCache

__all__ = [
    # Redis store
    "RedisStore",
    "initialize_redis",
    "close_redis",
    "get_redis_client",
    "get_redis_store",
    # Checkpointing
    "RedisCheckpointer",
    # Chat history
    "RedisChatHistory",
    # Caching
    "ResponseCache",
    "ConversationMemory",
]

# Version info
__version__ = "1.0.0"
