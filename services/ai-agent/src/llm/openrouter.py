"""OpenRouter LLM provider for TUPSAFE AI Agent.

Provides access to OpenRouter's unified API for multiple LLM models.
"""

from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from ..config import settings


def get_openrouter_llm(
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    streaming: bool = True,
    **kwargs
) -> BaseChatModel:
    """Create an OpenRouter LLM instance.

    Args:
        model: Model identifier (e.g., "anthropic/claude-3.5-sonnet")
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        streaming: Enable streaming responses
        **kwargs: Additional parameters for ChatOpenAI

    Returns:
        Configured ChatOpenAI instance pointing to OpenRouter

    Raises:
        ValueError: If OPENROUTER_API_KEY is not set
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable is required for OpenRouter provider"
        )

    # OpenRouter-specific headers
    default_headers = {
        "HTTP-Referer": "https://tupsafe.tup.edu.ph",
        "X-Title": "TUPSAFE AI Agent",
    }

    # Merge with any custom headers
    headers = {**default_headers, **kwargs.pop("default_headers", {})}

    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
        default_headers=headers,
        **kwargs
    )
