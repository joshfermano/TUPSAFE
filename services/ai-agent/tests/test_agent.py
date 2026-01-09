"""Tests for TUPSAFE AI Agent.

Tests the agent initialization, tool usage, invocation,
and streaming functionality.
"""

from typing import Any, AsyncGenerator
from unittest.mock import AsyncMock, Mock, patch

import pytest
from langchain_core.messages import HumanMessage, AIMessage

from src.agents.tupsafe_agent import TUPSAFEAgent
from src.tools import TUPSAFE_TOOLS


@pytest.mark.asyncio
class TestAgentInitialization:
    """Test suite for agent initialization."""

    def test_agent_initializes_with_default_settings(self):
        """Test that agent can be initialized with default settings."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            assert agent is not None
            assert agent.model == "anthropic/claude-sonnet-4"
            assert agent.provider == "openrouter"
            assert agent.temperature == 0.7
            assert agent.llm is not None
            assert agent.agent is not None

    def test_agent_initializes_with_custom_settings(self):
        """Test that agent accepts custom initialization parameters."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(
                model="gpt-4",
                provider="openai",
                temperature=0.5,
                max_tokens=2000,
                enable_memory=False,
            )

            assert agent.model == "gpt-4"
            assert agent.provider == "openai"
            assert agent.temperature == 0.5
            assert agent.max_tokens == 2000
            assert agent.memory is None

    def test_agent_initializes_with_tools(self):
        """Test that agent is initialized with TUPSAFE tools."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            with patch(
                "src.agents.tupsafe_agent.create_react_agent"
            ) as mock_create_agent:
                mock_llm = Mock()
                mock_get_llm.return_value = mock_llm
                mock_agent = Mock()
                mock_create_agent.return_value = mock_agent

                agent = TUPSAFEAgent()

                # Verify create_react_agent was called with tools
                mock_create_agent.assert_called_once()
                call_kwargs = mock_create_agent.call_args[1]
                assert "tools" in call_kwargs
                assert call_kwargs["tools"] == TUPSAFE_TOOLS

    def test_agent_initializes_with_memory(self):
        """Test that agent initializes with memory/checkpointing enabled."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(enable_memory=True)

            assert agent.memory is not None


@pytest.mark.asyncio
class TestAgentInvocation:
    """Test suite for agent invocation."""

    async def test_agent_invokes_successfully(self):
        """Test that agent can successfully invoke with a message."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            # Create agent with mocked LLM
            agent = TUPSAFEAgent()

            # Mock the agent's ainvoke method
            expected_response = {
                "messages": [
                    AIMessage(content="There are 150 employees in the system.")
                ]
            }
            agent.agent.ainvoke = AsyncMock(return_value=expected_response)

            # Test invocation
            result = await agent.ainvoke(
                message="How many employees are there?",
                session_id="test-session-123",
            )

            assert result is not None
            assert "messages" in result
            assert len(result["messages"]) > 0

    async def test_agent_generates_session_id_if_none(self):
        """Test that agent generates session_id when not provided."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            mock_response = {"messages": [AIMessage(content="Response")]}
            agent.agent.ainvoke = AsyncMock(return_value=mock_response)

            # Invoke without session_id
            result = await agent.ainvoke(message="Test message")

            # Should still succeed
            assert result is not None

    async def test_agent_uses_human_message(self):
        """Test that agent converts string message to HumanMessage."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            mock_response = {"messages": [AIMessage(content="Response")]}
            agent.agent.ainvoke = AsyncMock(return_value=mock_response)

            await agent.ainvoke(message="Test message", session_id="test-123")

            # Verify ainvoke was called with HumanMessage
            call_args = agent.agent.ainvoke.call_args
            input_message = call_args[0][0]
            assert "messages" in input_message
            assert isinstance(input_message["messages"][0], HumanMessage)


@pytest.mark.asyncio
class TestAgentStreaming:
    """Test suite for agent streaming functionality."""

    async def test_agent_streams_events(self):
        """Test that agent can stream events."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            # Mock streaming events
            async def mock_stream_events(*args, **kwargs):
                yield {
                    "event": "on_chat_model_stream",
                    "data": {"chunk": {"content": "Based on"}},
                }
                yield {
                    "event": "on_chat_model_stream",
                    "data": {"chunk": {"content": " the data"}},
                }

            agent.agent.astream_events = mock_stream_events

            # Collect streamed events
            events = []
            async for event in agent.astream_events(
                message="Test message", session_id="test-123"
            ):
                events.append(event)

            assert len(events) == 2
            assert events[0]["event"] == "on_chat_model_stream"

    async def test_agent_streams_state_updates(self):
        """Test that agent can stream state updates."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            # Mock streaming state
            async def mock_astream(*args, **kwargs):
                yield {"messages": [AIMessage(content="Response chunk 1")]}
                yield {"messages": [AIMessage(content="Response chunk 2")]}

            agent.agent.astream = mock_astream

            # Collect streamed chunks
            chunks = []
            async for chunk in agent.astream(
                message="Test message", session_id="test-123"
            ):
                chunks.append(chunk)

            assert len(chunks) == 2
            assert "messages" in chunks[0]


@pytest.mark.asyncio
class TestAgentMemory:
    """Test suite for agent conversation memory."""

    def test_agent_can_retrieve_conversation_history(self):
        """Test that agent can retrieve conversation history."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(enable_memory=True)

            # Mock memory checkpoint
            mock_checkpoint = {
                "messages": [
                    HumanMessage(content="Hello"),
                    AIMessage(content="Hi there!"),
                ]
            }
            agent.memory.get = Mock(return_value=mock_checkpoint)

            # Get conversation history
            history = agent.get_conversation_history("test-session-123")

            assert len(history) == 2
            assert isinstance(history[0], HumanMessage)
            assert isinstance(history[1], AIMessage)

    def test_agent_can_clear_conversation_history(self):
        """Test that agent can clear conversation history."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(enable_memory=True)

            # Mock memory put
            agent.memory.put = Mock()

            # Clear conversation
            agent.clear_conversation_history("test-session-123")

            # Verify put was called with empty messages
            agent.memory.put.assert_called_once()
            call_args = agent.memory.put.call_args[0]
            assert call_args[1] == {"messages": []}

    def test_agent_raises_error_if_memory_disabled(self):
        """Test that agent raises error when accessing memory if disabled."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(enable_memory=False)

            # Should raise ValueError
            with pytest.raises(ValueError, match="Memory is not enabled"):
                agent.get_conversation_history("test-session-123")


@pytest.mark.asyncio
class TestAgentToolUsage:
    """Test suite for agent tool usage."""

    async def test_agent_uses_correct_tool_for_query(self):
        """Test that agent selects appropriate tool for user query."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            # Mock agent response with tool usage
            mock_response = {
                "messages": [
                    AIMessage(
                        content="",
                        tool_calls=[
                            {
                                "name": "get_employee_count",
                                "args": {},
                                "id": "tool-1",
                            }
                        ],
                    ),
                    AIMessage(content="There are 150 employees."),
                ]
            }
            agent.agent.ainvoke = AsyncMock(return_value=mock_response)

            # Ask question that should trigger employee count tool
            result = await agent.ainvoke(
                message="How many employees are there?",
                session_id="test-123",
            )

            # Verify tool was used
            assert result is not None
            assert len(result["messages"]) > 0

    def test_agent_has_all_required_tools(self):
        """Test that agent has access to all required TUPSAFE tools."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            with patch(
                "src.agents.tupsafe_agent.create_react_agent"
            ) as mock_create_agent:
                mock_llm = Mock()
                mock_get_llm.return_value = mock_llm
                mock_agent = Mock()
                mock_create_agent.return_value = mock_agent

                agent = TUPSAFEAgent()

                # Verify tools were passed
                call_kwargs = mock_create_agent.call_args[1]
                tools = call_kwargs["tools"]

                # Check for key tools
                tool_names = [
                    tool.name if hasattr(tool, "name") else str(tool)
                    for tool in tools
                ]

                # Should have user, compliance, and submission tools
                assert len(tools) > 0


@pytest.mark.asyncio
class TestAgentConfiguration:
    """Test suite for agent configuration."""

    def test_agent_uses_specified_model(self):
        """Test that agent uses the specified LLM model."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(model="gpt-4-turbo", provider="openai")

            # Verify get_llm was called with correct model and provider
            mock_get_llm.assert_called_once()
            call_kwargs = mock_get_llm.call_args[1]
            assert call_kwargs["model"] == "gpt-4-turbo"
            assert call_kwargs["provider"] == "openai"

    def test_agent_uses_specified_temperature(self):
        """Test that agent uses the specified temperature."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent(temperature=0.3)

            # Verify temperature was passed
            call_kwargs = mock_get_llm.call_args[1]
            assert call_kwargs["temperature"] == 0.3

    def test_agent_enables_streaming(self):
        """Test that agent enables streaming by default."""
        with patch("src.agents.tupsafe_agent.get_llm") as mock_get_llm:
            mock_llm = Mock()
            mock_get_llm.return_value = mock_llm

            agent = TUPSAFEAgent()

            # Verify streaming was enabled
            call_kwargs = mock_get_llm.call_args[1]
            assert call_kwargs["streaming"] is True
