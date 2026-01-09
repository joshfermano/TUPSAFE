"""Chat message history storage using Redis.

Manages persistent chat history with automatic TTL, message ordering,
and efficient retrieval for conversation context.
"""

import json
import logging
from datetime import datetime
from typing import Any, Literal

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from .redis_store import get_redis_client

logger = logging.getLogger(__name__)

# Redis key prefix for chat history
CHAT_HISTORY_KEY_PREFIX = "tupsafe:chat"

# Default TTL for chat history (7 days)
DEFAULT_CHAT_HISTORY_TTL = 604800

# Message role types
MessageRole = Literal["system", "user", "assistant", "human", "ai"]


class RedisChatHistory:
    """Redis-backed chat message history for conversation management.

    Stores chat messages in Redis lists with automatic expiration,
    supporting efficient retrieval and conversation context management.

    Key format: tupsafe:chat:{session_id}
    """

    def __init__(self, ttl: int = DEFAULT_CHAT_HISTORY_TTL):
        """Initialize Redis chat history.

        Args:
            ttl: Time-to-live for chat history in seconds (default: 7 days)
        """
        self.ttl = ttl

    def _get_chat_key(self, session_id: str) -> str:
        """Generate Redis key for chat session.

        Args:
            session_id: Chat session identifier

        Returns:
            Redis key string
        """
        return f"{CHAT_HISTORY_KEY_PREFIX}:{session_id}"

    def _serialize_message(self, role: str, content: str) -> str:
        """Serialize message to JSON string.

        Args:
            role: Message role (system, user, assistant)
            content: Message content

        Returns:
            JSON string representation
        """
        message_data = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return json.dumps(message_data)

    def _deserialize_message(self, data: str) -> dict[str, Any]:
        """Deserialize message from JSON string.

        Args:
            data: JSON string

        Returns:
            Message dictionary with role, content, timestamp
        """
        return json.loads(data)

    def _role_to_langchain_message(
        self, role: str, content: str
    ) -> BaseMessage:
        """Convert role string to LangChain message type.

        Args:
            role: Message role
            content: Message content

        Returns:
            LangChain message instance
        """
        role_lower = role.lower()
        if role_lower in ("user", "human"):
            return HumanMessage(content=content)
        elif role_lower in ("assistant", "ai"):
            return AIMessage(content=content)
        elif role_lower == "system":
            return SystemMessage(content=content)
        else:
            # Default to human message for unknown roles
            return HumanMessage(content=content)

    async def add_message(
        self,
        session_id: str,
        role: MessageRole,
        content: str,
    ) -> None:
        """Add message to chat history.

        Args:
            session_id: Chat session identifier
            role: Message role (system, user, assistant, human, ai)
            content: Message content

        Raises:
            ValueError: If session_id or content is empty
        """
        if not session_id:
            raise ValueError("session_id cannot be empty")
        if not content:
            raise ValueError("content cannot be empty")

        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            # Serialize and add message to list
            message_json = self._serialize_message(role, content)
            await client.rpush(key, message_json)

            # Set/update TTL
            await client.expire(key, self.ttl)

            logger.debug(
                f"Added {role} message to session {session_id} "
                f"(TTL: {self.ttl}s)"
            )

        except Exception as e:
            logger.error(f"Error adding message to chat history: {e}")
            raise

    async def add_messages(
        self,
        session_id: str,
        messages: list[tuple[MessageRole, str]],
    ) -> None:
        """Add multiple messages to chat history.

        Args:
            session_id: Chat session identifier
            messages: List of (role, content) tuples

        Raises:
            ValueError: If session_id is empty or messages list is empty
        """
        if not session_id:
            raise ValueError("session_id cannot be empty")
        if not messages:
            raise ValueError("messages list cannot be empty")

        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            # Serialize all messages
            serialized_messages = [
                self._serialize_message(role, content)
                for role, content in messages
            ]

            # Add all messages in one operation
            if serialized_messages:
                await client.rpush(key, *serialized_messages)
                await client.expire(key, self.ttl)

            logger.debug(
                f"Added {len(messages)} messages to session {session_id}"
            )

        except Exception as e:
            logger.error(f"Error adding messages to chat history: {e}")
            raise

    async def get_messages(
        self,
        session_id: str,
        limit: int = 50,
        as_langchain: bool = False,
    ) -> list[dict[str, Any]] | list[BaseMessage]:
        """Retrieve messages from chat history.

        Args:
            session_id: Chat session identifier
            limit: Maximum number of messages to retrieve (default: 50)
            as_langchain: Return as LangChain message objects (default: False)

        Returns:
            List of message dictionaries or LangChain messages
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            # Get messages from Redis list (most recent N)
            messages_data = await client.lrange(key, -limit, -1)

            if not messages_data:
                return []

            # Deserialize messages
            messages = [
                self._deserialize_message(data)
                for data in messages_data
            ]

            # Convert to LangChain messages if requested
            if as_langchain:
                return [
                    self._role_to_langchain_message(msg["role"], msg["content"])
                    for msg in messages
                ]

            return messages

        except Exception as e:
            logger.error(f"Error retrieving chat history: {e}")
            return []

    async def get_message_count(self, session_id: str) -> int:
        """Get total message count for session.

        Args:
            session_id: Chat session identifier

        Returns:
            Number of messages in history
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)
            count = await client.llen(key)
            return count

        except Exception as e:
            logger.error(f"Error getting message count: {e}")
            return 0

    async def clear_history(self, session_id: str) -> None:
        """Clear all messages for a session.

        Args:
            session_id: Chat session identifier
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            deleted = await client.delete(key)
            logger.info(
                f"Cleared chat history for session {session_id} "
                f"({deleted} key deleted)"
            )

        except Exception as e:
            logger.error(f"Error clearing chat history: {e}")
            raise

    async def update_ttl(self, session_id: str, new_ttl: int) -> None:
        """Update TTL for chat session.

        Args:
            session_id: Chat session identifier
            new_ttl: New time-to-live in seconds
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            await client.expire(key, new_ttl)
            logger.debug(f"Updated TTL for session {session_id} to {new_ttl}s")

        except Exception as e:
            logger.error(f"Error updating chat history TTL: {e}")
            raise

    async def get_ttl(self, session_id: str) -> int:
        """Get remaining TTL for chat session.

        Args:
            session_id: Chat session identifier

        Returns:
            Remaining TTL in seconds, -1 if no expiry, -2 if key doesn't exist
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            ttl = await client.ttl(key)
            return ttl

        except Exception as e:
            logger.error(f"Error getting chat history TTL: {e}")
            return -2

    async def session_exists(self, session_id: str) -> bool:
        """Check if chat session exists.

        Args:
            session_id: Chat session identifier

        Returns:
            True if session exists, False otherwise
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            exists = await client.exists(key)
            return bool(exists)

        except Exception as e:
            logger.error(f"Error checking session existence: {e}")
            return False

    async def get_last_message(
        self,
        session_id: str,
        as_langchain: bool = False,
    ) -> dict[str, Any] | BaseMessage | None:
        """Get the most recent message from chat history.

        Args:
            session_id: Chat session identifier
            as_langchain: Return as LangChain message object (default: False)

        Returns:
            Last message or None if history is empty
        """
        try:
            client = get_redis_client()
            key = self._get_chat_key(session_id)

            # Get last message from list
            messages_data = await client.lrange(key, -1, -1)

            if not messages_data:
                return None

            message = self._deserialize_message(messages_data[0])

            if as_langchain:
                return self._role_to_langchain_message(
                    message["role"], message["content"]
                )

            return message

        except Exception as e:
            logger.error(f"Error retrieving last message: {e}")
            return None
