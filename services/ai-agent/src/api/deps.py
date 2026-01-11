"""Dependency injection for FastAPI routes."""

from typing import Annotated

from fastapi import Depends

from ..agents.tupsafe_agent import TUPSAFEAgent
from .middleware.auth import get_current_user

# Re-export authentication dependency
__all__ = ["get_agent", "get_current_user"]


async def get_agent() -> TUPSAFEAgent:
    """
    Get TUPSAFE AI agent instance.

    Returns:
        Initialized TUPSAFEAgent instance
    """
    return TUPSAFEAgent()


# Type aliases for dependency injection
CurrentUser = Annotated[dict, Depends(get_current_user)]
Agent = Annotated[TUPSAFEAgent, Depends(get_agent)]
