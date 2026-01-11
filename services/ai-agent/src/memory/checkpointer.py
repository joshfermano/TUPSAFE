"""LangGraph checkpoint storage using Redis.

Implements BaseCheckpointSaver for storing conversation state in Redis
with automatic TTL management and async operations.
"""

import json
import logging
from typing import Any, AsyncIterator, Optional

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
)

from .redis_store import get_redis_client

logger = logging.getLogger(__name__)

# Redis key prefixes
CHECKPOINT_KEY_PREFIX = "tupsafe:checkpoint"
CHECKPOINT_WRITES_KEY_PREFIX = "tupsafe:checkpoint:writes"

# Default TTL for checkpoints (24 hours)
DEFAULT_CHECKPOINT_TTL = 86400


class RedisCheckpointer(BaseCheckpointSaver):
    """LangGraph checkpoint saver using Redis for state persistence.

    Stores conversation state, configuration, and metadata in Redis
    with automatic expiration. Enables conversation resumption and
    state management across agent executions.

    Key format: tupsafe:checkpoint:{thread_id}:{checkpoint_id}
    """

    def __init__(self, ttl: int = DEFAULT_CHECKPOINT_TTL):
        """Initialize Redis checkpointer.

        Args:
            ttl: Time-to-live for checkpoints in seconds (default: 24 hours)
        """
        super().__init__()
        self.ttl = ttl

    def _get_checkpoint_key(self, thread_id: str, checkpoint_id: str) -> str:
        """Generate Redis key for checkpoint.

        Args:
            thread_id: Conversation thread identifier
            checkpoint_id: Checkpoint identifier

        Returns:
            Redis key string
        """
        return f"{CHECKPOINT_KEY_PREFIX}:{thread_id}:{checkpoint_id}"

    def _get_writes_key(self, thread_id: str, checkpoint_id: str) -> str:
        """Generate Redis key for checkpoint writes.

        Args:
            thread_id: Conversation thread identifier
            checkpoint_id: Checkpoint identifier

        Returns:
            Redis key string for writes
        """
        return f"{CHECKPOINT_WRITES_KEY_PREFIX}:{thread_id}:{checkpoint_id}"

    def _get_thread_pattern(self, thread_id: str) -> str:
        """Generate Redis key pattern for thread checkpoints.

        Args:
            thread_id: Conversation thread identifier

        Returns:
            Redis key pattern for scanning
        """
        return f"{CHECKPOINT_KEY_PREFIX}:{thread_id}:*"

    async def aget(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Optional[CheckpointTuple]:
        """Retrieve checkpoint from Redis asynchronously.

        Args:
            config: Runnable configuration with thread_id and checkpoint_id
            filter: Optional metadata filter (not implemented)
            **kwargs: Additional arguments

        Returns:
            CheckpointTuple if found, None otherwise
        """
        try:
            client = get_redis_client()

            # Extract thread_id and checkpoint_id from config
            thread_id = config.get("configurable", {}).get("thread_id")
            checkpoint_id = config.get("configurable", {}).get("checkpoint_id")

            if not thread_id:
                logger.warning("No thread_id in config, cannot retrieve checkpoint")
                return None

            # If no checkpoint_id, get latest checkpoint for thread
            if not checkpoint_id:
                checkpoint_id = await self._get_latest_checkpoint_id(thread_id)
                if not checkpoint_id:
                    return None

            # Retrieve checkpoint data
            key = self._get_checkpoint_key(thread_id, checkpoint_id)
            data = await client.get(key)

            if not data:
                return None

            # Parse checkpoint data
            checkpoint_data = json.loads(data)

            checkpoint = Checkpoint(
                v=checkpoint_data.get("v", 1),
                id=checkpoint_data["checkpoint_id"],
                ts=checkpoint_data.get("ts"),
                channel_values=checkpoint_data.get("channel_values", {}),
                channel_versions=checkpoint_data.get("channel_versions", {}),
                versions_seen=checkpoint_data.get("versions_seen", {}),
            )

            metadata = CheckpointMetadata(
                source=checkpoint_data.get("source", "update"),
                step=checkpoint_data.get("step", -1),
                writes=checkpoint_data.get("writes"),
                parents=checkpoint_data.get("parents", {}),
            )

            config_data = checkpoint_data.get("config", {})

            return CheckpointTuple(
                config=config_data,
                checkpoint=checkpoint,
                metadata=metadata,
                parent_config=checkpoint_data.get("parent_config"),
            )

        except Exception as e:
            logger.error(f"Error retrieving checkpoint: {e}")
            return None

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: dict[str, Any],
    ) -> RunnableConfig:
        """Store checkpoint in Redis asynchronously.

        Args:
            config: Runnable configuration
            checkpoint: Checkpoint state to save
            metadata: Checkpoint metadata
            new_versions: New channel versions

        Returns:
            Updated configuration
        """
        try:
            client = get_redis_client()

            # Extract thread_id from config
            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                raise ValueError("thread_id required in config.configurable")

            checkpoint_id = checkpoint.get("id") or checkpoint.get("checkpoint_id")
            if not checkpoint_id:
                raise ValueError("checkpoint_id required in checkpoint")

            # Prepare checkpoint data for storage
            checkpoint_data = {
                "v": checkpoint.get("v", 1),
                "checkpoint_id": checkpoint_id,
                "ts": checkpoint.get("ts"),
                "thread_id": thread_id,
                "channel_values": checkpoint.get("channel_values", {}),
                "channel_versions": checkpoint.get("channel_versions", {}),
                "versions_seen": checkpoint.get("versions_seen", {}),
                "source": metadata.get("source", "update"),
                "step": metadata.get("step", -1),
                "writes": metadata.get("writes"),
                "parents": metadata.get("parents", {}),
                "config": config,
                "parent_config": metadata.get("parent_config"),
            }

            # Store checkpoint with TTL
            key = self._get_checkpoint_key(thread_id, checkpoint_id)
            await client.setex(
                key,
                self.ttl,
                json.dumps(checkpoint_data, default=str),
            )

            logger.debug(
                f"Stored checkpoint {checkpoint_id} for thread {thread_id} "
                f"(TTL: {self.ttl}s)"
            )

            # Update config with checkpoint_id
            updated_config = config.copy()
            if "configurable" not in updated_config:
                updated_config["configurable"] = {}
            updated_config["configurable"]["checkpoint_id"] = checkpoint_id

            return updated_config

        except Exception as e:
            logger.error(f"Error storing checkpoint: {e}")
            raise

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """List checkpoints for a thread asynchronously.

        Args:
            config: Runnable configuration with thread_id
            filter: Optional metadata filter
            before: Only return checkpoints before this config
            limit: Maximum number of checkpoints to return

        Yields:
            CheckpointTuple for each checkpoint found
        """
        try:
            client = get_redis_client()

            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                return

            # Scan for all checkpoints in thread
            pattern = self._get_thread_pattern(thread_id)
            cursor = 0
            count = 0

            while True:
                cursor, keys = await client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )

                for key in keys:
                    if limit and count >= limit:
                        return

                    data = await client.get(key)
                    if not data:
                        continue

                    checkpoint_data = json.loads(data)

                    checkpoint = Checkpoint(
                        v=checkpoint_data.get("v", 1),
                        id=checkpoint_data["checkpoint_id"],
                        ts=checkpoint_data.get("ts"),
                        channel_values=checkpoint_data.get("channel_values", {}),
                        channel_versions=checkpoint_data.get("channel_versions", {}),
                        versions_seen=checkpoint_data.get("versions_seen", {}),
                    )

                    metadata = CheckpointMetadata(
                        source=checkpoint_data.get("source", "update"),
                        step=checkpoint_data.get("step", -1),
                        writes=checkpoint_data.get("writes"),
                        parents=checkpoint_data.get("parents", {}),
                    )

                    yield CheckpointTuple(
                        config=checkpoint_data.get("config", {}),
                        checkpoint=checkpoint,
                        metadata=metadata,
                        parent_config=checkpoint_data.get("parent_config"),
                    )

                    count += 1

                if cursor == 0:
                    break

        except Exception as e:
            logger.error(f"Error listing checkpoints: {e}")

    async def _get_latest_checkpoint_id(self, thread_id: str) -> Optional[str]:
        """Get the most recent checkpoint ID for a thread.

        Args:
            thread_id: Conversation thread identifier

        Returns:
            Latest checkpoint ID or None
        """
        try:
            client = get_redis_client()
            pattern = self._get_thread_pattern(thread_id)

            latest_ts = None
            latest_id = None

            cursor = 0
            while True:
                cursor, keys = await client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )

                for key in keys:
                    data = await client.get(key)
                    if not data:
                        continue

                    checkpoint_data = json.loads(data)
                    ts = checkpoint_data.get("ts")

                    if latest_ts is None or (ts and ts > latest_ts):
                        latest_ts = ts
                        latest_id = checkpoint_data["checkpoint_id"]

                if cursor == 0:
                    break

            return latest_id

        except Exception as e:
            logger.error(f"Error getting latest checkpoint: {e}")
            return None

    async def adelete_thread(self, thread_id: str) -> None:
        """Delete all checkpoints for a thread.

        Args:
            thread_id: Conversation thread identifier
        """
        try:
            client = get_redis_client()
            pattern = self._get_thread_pattern(thread_id)

            cursor = 0
            deleted_count = 0

            while True:
                cursor, keys = await client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )

                if keys:
                    deleted = await client.delete(*keys)
                    deleted_count += deleted

                if cursor == 0:
                    break

            logger.info(
                f"Deleted {deleted_count} checkpoints for thread {thread_id}"
            )

        except Exception as e:
            logger.error(f"Error deleting thread checkpoints: {e}")
            raise
