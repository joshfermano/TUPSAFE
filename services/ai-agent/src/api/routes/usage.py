"""Usage tracking endpoints for monitoring token and cost consumption."""

import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status

from ...api.deps import get_current_user
from ...api.middleware import get_token_tracker

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/daily", response_model=Dict[str, Any])
async def get_daily_usage(
    current_user: dict = Depends(get_current_user),
):
    """
    Get daily usage statistics for the current user.

    Returns token consumption, cost, and remaining limits for the current day.
    Useful for monitoring usage and preventing unexpected limit exhaustion.

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        Dict with daily usage statistics:
            - daily_tokens: Total tokens used today
            - daily_cost: Total cost in USD today
            - max_tokens: Maximum allowed tokens per day
            - max_cost: Maximum allowed cost per day
            - tokens_remaining: Tokens remaining today
            - cost_remaining: Cost remaining today (USD)
            - date: Current UTC date

    Example Response:
        {
            "daily_tokens": 15000,
            "daily_cost": 0.45,
            "max_tokens": 100000,
            "max_cost": 10.0,
            "tokens_remaining": 85000,
            "cost_remaining": 9.55,
            "date": "2025-01-09"
        }
    """
    try:
        logger.info(f"Usage request from user {current_user['id']}")

        token_tracker = get_token_tracker()
        usage_stats = await token_tracker.get_daily_usage(current_user["id"])

        # Add date for context
        from datetime import datetime
        usage_stats["date"] = datetime.utcnow().strftime("%Y-%m-%d")

        # Add user context
        usage_stats["user_id"] = current_user["id"]
        usage_stats["role"] = current_user["role"]

        logger.info(
            f"Usage for user {current_user['id']}: "
            f"{usage_stats['daily_tokens']} tokens, ${usage_stats['daily_cost']:.2f}"
        )

        return usage_stats

    except Exception as e:
        logger.error(f"Error fetching usage stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching usage statistics: {str(e)}",
        )


@router.get("/limits", response_model=Dict[str, Any])
async def get_rate_limits(
    current_user: dict = Depends(get_current_user),
):
    """
    Get rate limit configuration for the current user's role.

    Returns the configured rate limits for requests per minute/hour
    and token/cost limits per day.

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        Dict with rate limit configuration:
            - role: User's role
            - rate_limits: Request rate limits by time window
            - token_limits: Token consumption limits
            - cost_limits: Cost limits in USD

    Example Response:
        {
            "role": "hr",
            "rate_limits": {
                "per_minute": 40,
                "per_hour": 1500
            },
            "token_limits": {
                "max_tokens_per_request": 4000,
                "max_tokens_per_day": 100000
            },
            "cost_limits": {
                "max_cost_per_day": 10.0
            }
        }
    """
    try:
        from ...config import settings

        role = current_user["role"]

        # Get role-specific rate limits
        rate_limits = {
            "per_minute": getattr(
                settings.rate_limits,
                f"{role.upper()}_RATE_LIMIT_PER_MINUTE",
                30,
            ),
            "per_hour": getattr(
                settings.rate_limits,
                f"{role.upper()}_RATE_LIMIT_PER_HOUR",
                1000,
            ),
        }

        # Get token and cost limits
        token_limits = {
            "max_tokens_per_request": settings.rate_limits.MAX_TOKENS_PER_REQUEST,
            "max_tokens_per_day": settings.rate_limits.MAX_TOKENS_PER_USER_PER_DAY,
        }

        cost_limits = {
            "max_cost_per_day": settings.rate_limits.MAX_COST_PER_USER_PER_DAY,
        }

        return {
            "role": role,
            "rate_limits": rate_limits,
            "token_limits": token_limits,
            "cost_limits": cost_limits,
        }

    except Exception as e:
        logger.error(f"Error fetching rate limits: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching rate limits: {str(e)}",
        )
