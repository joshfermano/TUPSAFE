"""Multi-provider LLM factory for TUPSAFE AI Agent.

Provides a unified interface to instantiate LLMs from different providers
with explicit provider specification.
"""

from typing import Optional
from langchain_core.language_models import BaseChatModel

from ..config import settings
from .openrouter import get_openrouter_llm
from .openai_provider import get_openai_llm
from .gemini import get_gemini_llm
from .groq import get_groq_llm


# Provider registry mapping
PROVIDER_REGISTRY = {
    "openrouter": get_openrouter_llm,
    "openai": get_openai_llm,
    "gemini": get_gemini_llm,
    "groq": get_groq_llm,
}


def get_llm(
    model: str,
    provider: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    streaming: bool = True,
    **kwargs
) -> BaseChatModel:
    """Create an LLM instance from any supported provider.

    Args:
        model: Model identifier (e.g., "gpt-4o", "anthropic/claude-3.5-sonnet", "openai/gpt-oss-120b")
               The full model name is passed unchanged to the provider.
        provider: LLM provider to use (openai, openrouter, gemini, groq).
                 If None, uses settings.DEFAULT_LLM_PROVIDER.
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Maximum tokens to generate
        streaming: Enable streaming responses
        **kwargs: Additional provider-specific parameters

    Returns:
        Configured LLM instance from the appropriate provider

    Raises:
        ValueError: If provider is not supported or model is invalid

    Examples:
        >>> # Use explicit provider
        >>> llm = get_llm(model="openai/gpt-oss-120b", provider="groq")
        >>> llm = get_llm(model="gpt-4o", provider="openai")
        >>>
        >>> # Use default provider from settings
        >>> llm = get_llm(model="anthropic/claude-3.5-sonnet")  # Uses DEFAULT_LLM_PROVIDER
    """
    if not model or not isinstance(model, str):
        raise ValueError("model must be a non-empty string")

    # Use default provider from settings if not specified
    if provider is None:
        provider = settings.DEFAULT_LLM_PROVIDER

    # Validate provider
    provider = provider.lower()
    if provider not in PROVIDER_REGISTRY:
        supported = ", ".join(PROVIDER_REGISTRY.keys())
        raise ValueError(
            f"Unsupported provider: {provider}. Supported providers: {supported}"
        )

    # Get the appropriate provider function
    provider_fn = PROVIDER_REGISTRY[provider]

    # Instantiate and return the LLM with the full model name
    return provider_fn(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
        **kwargs
    )


def list_providers() -> list[str]:
    """List all supported LLM providers.

    Returns:
        List of supported provider names
    """
    return list(PROVIDER_REGISTRY.keys())


def is_provider_available(provider: str) -> bool:
    """Check if a provider is available.

    Args:
        provider: Provider name to check

    Returns:
        True if provider is supported, False otherwise
    """
    return provider.lower() in PROVIDER_REGISTRY
