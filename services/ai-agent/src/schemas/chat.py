"""Pydantic schemas for chat endpoints."""

from typing import Any, Literal
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request model for chat endpoints."""

    message: str = Field(
        ...,
        description="User message to send to the AI agent",
        min_length=1,
        max_length=10000,
    )
    session_id: str | None = Field(
        None,
        description="Optional session identifier for conversation history",
        max_length=100,
    )
    model_id: str | None = Field(
        None,
        description="Optional LLM model identifier to use for this request",
        max_length=100,
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "What are the requirements for submitting a PDS?",
                    "session_id": "admin-session-123",
                    "model_id": "anthropic/claude-sonnet-4",
                }
            ]
        }
    }


class ChatResponse(BaseModel):
    """Response model for non-streaming chat endpoint."""

    response: str = Field(
        ...,
        description="AI agent response to the user message",
    )
    session_id: str = Field(
        ...,
        description="Session identifier for this conversation",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "response": "The requirements for submitting a PDS include...",
                    "session_id": "admin-session-123",
                }
            ]
        }
    }


class StreamEvent(BaseModel):
    """Server-Sent Event model for streaming responses."""

    event: Literal["message", "done", "error"] = Field(
        ...,
        description="Event type (message for content chunks, done for completion, error for errors)",
    )
    data: str | dict[str, Any] = Field(
        ...,
        description="Event data (text chunk for message, metadata for done/error)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "event": "message",
                    "data": "The requirements",
                },
                {
                    "event": "done",
                    "data": {"session_id": "admin-session-123"},
                },
                {
                    "event": "error",
                    "data": {"error": "Failed to process request"},
                },
            ]
        }
    }


class ModelInfo(BaseModel):
    """Information about an available LLM model."""

    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Human-readable model name")
    provider: str = Field(..., description="Provider name (openai, openrouter, etc.)")
    context_window: int = Field(..., description="Maximum context window size in tokens")
    available: bool = Field(..., description="Whether the model is currently available")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "anthropic/claude-sonnet-4",
                    "name": "Claude Sonnet 4",
                    "provider": "openrouter",
                    "context_window": 200000,
                    "available": True,
                }
            ]
        }
    }


class ModelsResponse(BaseModel):
    """Response model for models endpoint."""

    models: dict[str, list[ModelInfo]] = Field(
        ...,
        description="Available models grouped by provider",
    )
    default: dict[str, str] = Field(
        ...,
        description="Default provider and model configuration",
    )
    configured_providers: list[str] = Field(
        ...,
        description="List of configured providers with API keys",
    )
