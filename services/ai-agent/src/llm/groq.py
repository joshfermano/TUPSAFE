"""Groq LLM provider for TUPSAFE AI Agent.

Provides access to Groq's ultra-fast LLM inference.
"""

from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.language_models import BaseChatModel

from ..config import settings


def get_groq_llm(
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    streaming: bool = True,
    **kwargs
) -> BaseChatModel:
    """Create a Groq LLM instance.

    Args:
        model: Groq model identifier (e.g., "llama-3.3-70b-versatile", "mixtral-8x7b-32768")
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Maximum tokens to generate
        streaming: Enable streaming responses
        **kwargs: Additional parameters for ChatGroq

    Returns:
        Configured ChatGroq instance

    Raises:
        ValueError: If GROQ_API_KEY is not set
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY environment variable is required for Groq provider"
        )

    return ChatGroq(
        model=model,
        api_key=api_key,
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
        **kwargs
    )
