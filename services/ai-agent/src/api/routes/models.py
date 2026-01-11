"""Models endpoint for listing available LLM providers and configuration."""

import logging
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from ...api.deps import get_current_user
from ...config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("")
async def get_available_models(
    current_user: dict = Depends(get_current_user),
):
    """
    Get list of configured LLM providers and current model configuration.

    The system supports any model from configured providers. Simply set the
    DEFAULT_LLM_MODEL in .env using the format: provider/model-name

    Examples:
        - groq/llama-3.3-70b-versatile
        - groq/gpt-oss-120b
        - openrouter/anthropic/claude-sonnet-4.5
        - openrouter/anthropic/claude-opus-4.5
        - openai/gpt-5
        - gemini/gemini-2.0-flash-exp

    Returns:
        JSON response with configured providers and current model.
    """
    logger.info(f"Models config requested by user {current_user['id']}")

    # Check which providers have API keys configured
    configured_providers = []
    provider_info = {}

    if settings.OPENAI_API_KEY:
        configured_providers.append("openai")
        provider_info["openai"] = {
            "name": "OpenAI",
            "description": "GPT models including GPT-4, GPT-4o, GPT-5 family, o1/o3 reasoning models",
            "format": "openai/<model-name>",
            "examples": ["openai/gpt-4o", "openai/gpt-4o-mini", "openai/o1", "openai/gpt-5"],
            "available": True,
        }

    if settings.OPENROUTER_API_KEY:
        configured_providers.append("openrouter")
        provider_info["openrouter"] = {
            "name": "OpenRouter",
            "description": "Access to 200+ models including Claude, GPT, Gemini, Llama, Qwen, and more",
            "format": "openrouter/<provider>/<model-name> or <provider>/<model-name>",
            "examples": [
                "anthropic/claude-sonnet-4",
                "anthropic/claude-opus-4.5",
                "openai/gpt-4o",
                "google/gemini-2.0-flash",
                "qwen/qwen-3-72b",
                "meta-llama/llama-3.3-70b-instruct",
            ],
            "available": True,
        }

    if settings.GOOGLE_API_KEY:
        configured_providers.append("gemini")
        provider_info["gemini"] = {
            "name": "Google Gemini",
            "description": "Gemini models with large context windows",
            "format": "gemini/<model-name>",
            "examples": ["gemini/gemini-2.0-flash-exp", "gemini/gemini-1.5-pro", "gemini/gemini-2.0-flash-thinking-exp"],
            "available": True,
        }

    if settings.GROQ_API_KEY:
        configured_providers.append("groq")
        provider_info["groq"] = {
            "name": "Groq",
            "description": "Ultra-fast inference for Llama, Mixtral, GPT-OSS, and more",
            "format": "groq/<model-name>",
            "examples": ["groq/llama-3.3-70b-versatile", "groq/mixtral-8x7b-32768", "groq/gpt-oss-120b"],
            "available": True,
        }

    # Current configuration from .env
    current_config = {
        "provider": settings.DEFAULT_LLM_PROVIDER,
        "model": settings.DEFAULT_LLM_MODEL,
    }

    return JSONResponse(
        content={
            "providers": provider_info,
            "configured_providers": configured_providers,
            "current": current_config,
            "usage": {
                "description": "Set DEFAULT_LLM_MODEL in .env to use any model",
                "format": "<provider>/<model-name>",
                "note": "The system dynamically supports any model from configured providers",
            },
        }
    )
