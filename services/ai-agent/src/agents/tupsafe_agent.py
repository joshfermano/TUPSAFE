"""TUPSAFE AI Agent implementation using LangGraph.

Provides the main conversational agent with memory, tool usage, and streaming capabilities.
"""

from typing import AsyncGenerator, Any
from uuid import uuid4

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from ..config import settings
from ..llm import get_llm
from ..tools import TUPSAFE_TOOLS
from .prompts import TUPSAFE_SYSTEM_PROMPT


class TUPSAFEAgent:
    """Main AI agent for TUPSAFE system.

    Handles conversation management, tool execution, and streaming responses
    for HR and administrative queries.
    """

    def __init__(
        self,
        model: str | None = None,
        provider: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        enable_memory: bool = True,
    ):
        """Initialize the TUPSAFE AI Agent.

        Args:
            model: LLM model identifier (e.g., "gpt-4o", "anthropic/claude-3.5-sonnet").
                  If None, uses settings.DEFAULT_LLM_MODEL.
            provider: LLM provider (openai, openrouter, gemini, groq).
                     If None, uses settings.DEFAULT_LLM_PROVIDER.
            temperature: Sampling temperature for response generation
            max_tokens: Maximum tokens to generate per response
            enable_memory: Enable conversation memory/checkpointing
        """
        # Use defaults from settings if not provided
        self.model = model or settings.DEFAULT_LLM_MODEL
        self.provider = provider or settings.DEFAULT_LLM_PROVIDER
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Initialize LLM
        self.llm = get_llm(
            model=self.model,
            provider=self.provider,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
        )

        # Initialize memory/checkpointer
        self.memory = MemorySaver() if enable_memory else None

        # Create ReAct agent with tools
        # Note: Using 'prompt' parameter for system message (LangGraph 0.2+)
        self.agent = create_react_agent(
            model=self.llm,
            tools=TUPSAFE_TOOLS,
            prompt=TUPSAFE_SYSTEM_PROMPT,
            checkpointer=self.memory,
        )

    def _get_config(self, session_id: str) -> RunnableConfig:
        """Generate configuration for agent execution.

        Args:
            session_id: Unique identifier for conversation thread

        Returns:
            Configuration dict with thread_id for memory
        """
        return {"configurable": {"thread_id": session_id}}

    async def ainvoke(
        self,
        message: str,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """Invoke the agent with a message (non-streaming).

        Args:
            message: User message/query
            session_id: Session identifier for conversation memory.
                       If None, generates a new session.

        Returns:
            Agent response containing messages and metadata

        Example:
            >>> agent = TUPSAFEAgent()
            >>> response = await agent.ainvoke(
            ...     "How many employees submitted SALN?",
            ...     session_id="user-123"
            ... )
            >>> print(response["messages"][-1].content)
        """
        if session_id is None:
            session_id = str(uuid4())

        config = self._get_config(session_id)

        # Prepare input
        input_message = {"messages": [HumanMessage(content=message)]}

        # Invoke agent
        response = await self.agent.ainvoke(input_message, config=config)

        return response

    async def astream_events(
        self,
        message: str,
        session_id: str | None = None,
        version: str = "v2",
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Stream agent execution events including tool calls and responses.

        Args:
            message: User message/query
            session_id: Session identifier for conversation memory.
                       If None, generates a new session.
            version: Event streaming version ("v1" or "v2")

        Yields:
            Event dictionaries containing:
            - event: Event type (on_chat_model_stream, on_tool_start, etc.)
            - data: Event-specific data
            - name: Component name
            - run_id: Unique run identifier

        Example:
            >>> agent = TUPSAFEAgent()
            >>> async for event in agent.astream_events(
            ...     "Show me compliance statistics",
            ...     session_id="user-123"
            ... ):
            ...     if event["event"] == "on_chat_model_stream":
            ...         print(event["data"]["chunk"].content, end="")
        """
        if session_id is None:
            session_id = str(uuid4())

        config = self._get_config(session_id)

        # Prepare input
        input_message = {"messages": [HumanMessage(content=message)]}

        # Stream events
        async for event in self.agent.astream_events(
            input_message,
            config=config,
            version=version,
        ):
            yield event

    async def astream(
        self,
        message: str,
        session_id: str | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Stream agent execution by state updates.

        Args:
            message: User message/query
            session_id: Session identifier for conversation memory.
                       If None, generates a new session.

        Yields:
            State update dictionaries containing messages and metadata

        Example:
            >>> agent = TUPSAFEAgent()
            >>> async for chunk in agent.astream(
            ...     "What departments need to submit SALN?",
            ...     session_id="user-123"
            ... ):
            ...     if "messages" in chunk:
            ...         print(chunk["messages"][-1].content)
        """
        if session_id is None:
            session_id = str(uuid4())

        config = self._get_config(session_id)

        # Prepare input
        input_message = {"messages": [HumanMessage(content=message)]}

        # Stream state updates
        async for chunk in self.agent.astream(input_message, config=config):
            yield chunk

    def get_conversation_history(
        self,
        session_id: str,
    ) -> list[BaseMessage]:
        """Retrieve conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            List of messages in chronological order

        Raises:
            ValueError: If memory is not enabled or session not found
        """
        if not self.memory:
            raise ValueError("Memory is not enabled for this agent")

        config = self._get_config(session_id)

        # Get checkpoint
        checkpoint = self.memory.get(config)
        if not checkpoint:
            return []

        # Extract messages from checkpoint
        messages = checkpoint.get("messages", [])
        return messages

    def clear_conversation_history(self, session_id: str) -> None:
        """Clear conversation history for a session.

        Args:
            session_id: Session identifier to clear

        Raises:
            ValueError: If memory is not enabled
        """
        if not self.memory:
            raise ValueError("Memory is not enabled for this agent")

        config = self._get_config(session_id)
        self.memory.put(config, {"messages": []})

    async def stream_chat(
        self,
        message: str,
        user_id: str,
        session_id: str | None = None,
        model_id: str | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Stream chat responses for the route handler.

        This method yields content chunks and tool usage events
        in a format compatible with the SSE streaming endpoint.

        Args:
            message: User message/query
            user_id: User identifier
            session_id: Session identifier for conversation memory
            model_id: Optional model override (deprecated, ignored - uses agent's configured model)

        Yields:
            Dictionary with either:
            - {"type": "content", "content": "text chunk"}
            - {"type": "tool", "tool": "tool_name"}
        """
        if session_id is None:
            session_id = f"user-{user_id}-{uuid4()}"

        config = self._get_config(session_id)
        input_message = {"messages": [HumanMessage(content=message)]}

        # Stream events and extract content/tool usage
        async for event in self.agent.astream_events(
            input_message,
            config=config,
            version="v2",
        ):
            event_type = event.get("event", "")

            # Handle streaming content
            if event_type == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield {"type": "content", "content": chunk.content}

            # Handle tool calls
            elif event_type == "on_tool_start":
                tool_name = event.get("name", "unknown_tool")
                yield {"type": "tool", "tool": tool_name}

    async def chat(
        self,
        message: str,
        user_id: str,
        session_id: str | None = None,
        model_id: str | None = None,
    ) -> str:
        """Non-streaming chat method for the route handler.

        Args:
            message: User message/query
            user_id: User identifier
            session_id: Session identifier for conversation memory
            model_id: Optional model override (deprecated, ignored - uses agent's configured model)

        Returns:
            Complete response text
        """
        if session_id is None:
            session_id = f"user-{user_id}-{uuid4()}"

        response = await self.ainvoke(message, session_id)

        # Extract the last AI message content
        messages = response.get("messages", [])
        for msg in reversed(messages):
            if isinstance(msg, AIMessage) and msg.content:
                return msg.content

        return "I apologize, but I couldn't generate a response."

    async def clear_session(
        self,
        session_id: str,
        user_id: str,
    ) -> None:
        """Clear a chat session's history.

        Args:
            session_id: Session identifier to clear
            user_id: User identifier (for logging/validation)
        """
        self.clear_conversation_history(session_id)
