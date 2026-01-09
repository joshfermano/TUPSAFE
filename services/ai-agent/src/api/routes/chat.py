"""Chat endpoints for interacting with TUPSAFE AI Agent."""

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from ...api.deps import get_agent, get_current_user
from ...api.middleware import get_rate_limiter, get_token_tracker
from ...schemas.chat import ChatRequest, ChatResponse, StreamEvent
from ...agents.tupsafe_agent import TUPSAFEAgent

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/stream", response_class=EventSourceResponse)
async def chat_stream(
    request: ChatRequest,
    agent: TUPSAFEAgent = Depends(get_agent),
    current_user: dict = Depends(get_current_user),
):
    logger.info(f"=== chat_stream endpoint reached, user: {current_user.get('id', 'unknown')} ===")
    """
    Stream chat responses using Server-Sent Events (SSE).

    Args:
        request: Chat request with message, optional session_id and model_id
        agent: TUPSAFE AI agent instance
        current_user: Authenticated user from JWT token

    Returns:
        SSE stream of chat events
    """
    try:
        # Check rate limits before processing
        rate_limiter = get_rate_limiter()
        rate_limit_status = await rate_limiter.check_rate_limit(
            user_id=current_user["id"],
            role=current_user["role"],
            endpoint="chat_stream",
            window="minute",
        )

        logger.info(
            f"Chat stream request from user {current_user['id']}: {request.message[:50]}..."
        )

        # Track token usage (will be updated after completion)
        token_tracker = get_token_tracker()

        async def event_generator() -> AsyncGenerator[dict, None]:
            """Generate SSE events from agent stream.

            Events are formatted for the Next.js frontend which expects:
            - {"type": "content", "content": "text"} for content chunks
            - {"type": "tool", "tool": "tool_name"} for tool usage
            - {"type": "error", "error": "message"} for errors
            - [DONE] for completion
            """
            try:
                async for event in agent.stream_chat(
                    message=request.message,
                    user_id=current_user["id"],
                    session_id=request.session_id,
                    model_id=request.model_id,
                ):
                    # Forward agent events directly (already properly formatted)
                    # event is {"type": "content", "content": "..."} or {"type": "tool", "tool": "..."}
                    yield {
                        "data": json.dumps(event),
                    }

                # Send completion signal
                yield {
                    "data": "[DONE]",
                }

            except Exception as e:
                logger.error(f"Error in stream generator: {e}", exc_info=True)
                yield {
                    "data": json.dumps({"type": "error", "error": str(e)}),
                }

        return EventSourceResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        logger.error(f"Error in chat stream: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat stream error: {str(e)}",
        )


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    response: Response,
    agent: TUPSAFEAgent = Depends(get_agent),
    current_user: dict = Depends(get_current_user),
):
    """
    Non-streaming chat endpoint.

    Args:
        request: Chat request with message, optional session_id and model_id
        response: Response object for adding headers
        agent: TUPSAFE AI agent instance
        current_user: Authenticated user from JWT token

    Returns:
        Complete chat response
    """
    try:
        # Check rate limits before processing
        rate_limiter = get_rate_limiter()
        rate_limit_status = await rate_limiter.check_rate_limit(
            user_id=current_user["id"],
            role=current_user["role"],
            endpoint="chat",
            window="minute",
        )

        logger.info(
            f"Chat request from user {current_user['id']}: {request.message[:50]}..."
        )

        # Get agent response
        agent_response = await agent.chat(
            message=request.message,
            user_id=current_user["id"],
            session_id=request.session_id,
            model_id=request.model_id,
        )

        # Add rate limit headers to response
        await rate_limiter.add_rate_limit_headers(response, rate_limit_status)

        # Track token usage (estimate based on response length)
        # In production, you'd get actual token counts from the LLM API
        token_tracker = get_token_tracker()
        estimated_input_tokens = len(request.message) // 4
        estimated_output_tokens = len(agent_response) // 4

        try:
            await token_tracker.track_tokens(
                user_id=current_user["id"],
                model=request.model_id or "anthropic/claude-sonnet-4",
                input_tokens=estimated_input_tokens,
                output_tokens=estimated_output_tokens,
            )
        except HTTPException:
            # Token limit exceeded - already logged in tracker
            raise
        except Exception as e:
            # Don't fail the request if token tracking fails
            logger.warning(f"Failed to track tokens: {e}")

        return ChatResponse(
            response=agent_response,
            session_id=request.session_id or "default",
        )

    except HTTPException:
        # Re-raise HTTP exceptions (rate limits, auth errors, etc.)
        raise
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}",
        )


@router.delete("/session/{session_id}")
async def clear_session(
    session_id: str,
    agent: TUPSAFEAgent = Depends(get_agent),
    current_user: dict = Depends(get_current_user),
):
    """
    Clear a chat session and its history.

    Args:
        session_id: Session identifier to clear
        agent: TUPSAFE AI agent instance
        current_user: Authenticated user from JWT token

    Returns:
        Success message
    """
    try:
        logger.info(
            f"Clearing session {session_id} for user {current_user['id']}"
        )

        await agent.clear_session(
            session_id=session_id,
            user_id=current_user["id"],
        )

        return {"message": f"Session {session_id} cleared successfully"}

    except Exception as e:
        logger.error(f"Error clearing session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing session: {str(e)}",
        )
