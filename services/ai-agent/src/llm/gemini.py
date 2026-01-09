"""Google Gemini LLM provider for TUPSAFE AI Agent.

Provides access to Google's Gemini models via Vertex AI or Google AI.
"""

from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseChatModel

from ..config import settings


def get_gemini_llm(
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    streaming: bool = True,
    **kwargs
) -> BaseChatModel:
    """Create a Google Gemini LLM instance.

    Args:
        model: Gemini model identifier (e.g., "gemini-2.0-flash-exp", "gemini-1.5-pro")
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Maximum tokens to generate (max_output_tokens in Gemini)
        streaming: Enable streaming responses
        **kwargs: Additional parameters for ChatGoogleGenerativeAI

    Returns:
        Configured ChatGoogleGenerativeAI instance

    Raises:
        ValueError: If GOOGLE_API_KEY is not set
    """
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is required for Gemini provider"
        )

    # Map max_tokens to Gemini's parameter name
    gemini_kwargs = kwargs.copy()
    if max_tokens is not None:
        gemini_kwargs["max_output_tokens"] = max_tokens

    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=temperature,
        streaming=streaming,
        **gemini_kwargs
    )
