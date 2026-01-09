"""OpenAI LLM provider for TUPSAFE AI Agent.

Provides direct access to OpenAI's GPT models.
"""

from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from ..config import settings


def get_openai_llm(
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    streaming: bool = True,
    **kwargs
) -> BaseChatModel:
    """Create an OpenAI LLM instance.

    Args:
        model: OpenAI model identifier (e.g., "gpt-4o", "gpt-4o-mini")
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Maximum tokens to generate
        streaming: Enable streaming responses
        **kwargs: Additional parameters for ChatOpenAI

    Returns:
        Configured ChatOpenAI instance

    Raises:
        ValueError: If OPENAI_API_KEY is not set
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is required for OpenAI provider"
        )

    return ChatOpenAI(
        model=model,
        api_key=api_key,
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
        **kwargs
    )
