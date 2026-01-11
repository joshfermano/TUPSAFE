"""Test script for TUPSAFE AI Agent.

This script tests the agent implementation with various queries and providers.
Run with: python test_agent.py
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.agents import TUPSAFEAgent
from src.llm import get_llm, list_providers, is_provider_available


def print_separator(title: str = ""):
    """Print a visual separator."""
    print("\n" + "=" * 80)
    if title:
        print(f" {title}")
        print("=" * 80)
    print()


def check_environment():
    """Check if required environment variables are set."""
    print_separator("Environment Check")

    providers_status = {
        "OpenRouter": os.getenv("OPENROUTER_API_KEY"),
        "OpenAI": os.getenv("OPENAI_API_KEY"),
        "Google Gemini": os.getenv("GOOGLE_API_KEY"),
        "Groq": os.getenv("GROQ_API_KEY"),
    }

    print("API Key Status:")
    for provider, key in providers_status.items():
        status = "✓ Configured" if key else "✗ Not configured"
        print(f"  {provider}: {status}")

    supabase_url = os.getenv("SUPABASE_URL")
    print(f"\nSupabase URL: {'✓ Set' if supabase_url else '✗ Not set'}")

    configured_count = sum(1 for key in providers_status.values() if key)
    if configured_count == 0:
        print("\n⚠️  WARNING: No LLM providers configured!")
        print("   Please set at least one API key in your .env file")
        return False

    return True


def test_llm_providers():
    """Test LLM provider factory."""
    print_separator("LLM Provider Factory Test")

    print("Available providers:")
    for provider in list_providers():
        available = is_provider_available(provider)
        print(f"  - {provider}: {'✓' if available else '✗'}")

    # Test provider/model combinations
    test_cases = [
        ("anthropic/claude-3.5-sonnet", "openrouter"),
        ("gpt-4o", "openai"),
        ("gemini-2.0-flash-exp", "gemini"),
        ("llama-3.3-70b-versatile", "groq"),
        ("openai/gpt-oss-120b", "groq"),  # Groq model with openai/ prefix
    ]

    print("\nProvider/model test:")
    for model, provider in test_cases:
        try:
            llm = get_llm(model=model, provider=provider, streaming=False)
            print(f"  ✓ provider={provider}, model={model} -> {type(llm).__name__}")
        except ValueError as e:
            print(f"  ✗ provider={provider}, model={model} -> Error: {e}")
        except Exception as e:
            print(f"  ⚠ provider={provider}, model={model} -> Provider not configured: {e}")


async def test_agent_basic():
    """Test basic agent functionality."""
    print_separator("Basic Agent Test")

    try:
        # Use the first available provider
        if os.getenv("OPENROUTER_API_KEY"):
            provider = "openrouter"
            model = "anthropic/claude-3.5-sonnet"
        elif os.getenv("OPENAI_API_KEY"):
            provider = "openai"
            model = "gpt-4o-mini"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "gemini"
            model = "gemini-2.0-flash-exp"
        elif os.getenv("GROQ_API_KEY"):
            provider = "groq"
            model = "llama-3.3-70b-versatile"
        else:
            print("⚠️  No LLM provider configured, skipping agent test")
            return

        print(f"Initializing agent with provider={provider}, model={model}")
        agent = TUPSAFEAgent(
            model=model,
            provider=provider,
            temperature=0.7,
            enable_memory=True
        )
        print("✓ Agent initialized successfully")

        # Test simple query
        print("\nTest Query: 'Hello, what can you help me with?'")
        response = await agent.ainvoke(
            "Hello, what can you help me with?",
            session_id="test-session-basic"
        )

        answer = response["messages"][-1].content
        print(f"\nAgent Response:\n{answer}")

        print("\n✓ Basic agent test completed successfully")

    except Exception as e:
        print(f"\n✗ Agent test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_agent_streaming():
    """Test streaming functionality."""
    print_separator("Streaming Test")

    try:
        # Use the first available provider
        if os.getenv("OPENROUTER_API_KEY"):
            provider = "openrouter"
            model = "anthropic/claude-3.5-sonnet"
        elif os.getenv("OPENAI_API_KEY"):
            provider = "openai"
            model = "gpt-4o-mini"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "gemini"
            model = "gemini-2.0-flash-exp"
        elif os.getenv("GROQ_API_KEY"):
            provider = "groq"
            model = "llama-3.3-70b-versatile"
        else:
            print("⚠️  No LLM provider configured, skipping streaming test")
            return

        print(f"Initializing agent with provider={provider}, model={model}")
        agent = TUPSAFEAgent(model=model, provider=provider)

        print("\nTest Query: 'Explain what TUPSAFE is in one sentence.'")
        print("Streaming response:\n")

        full_response = ""
        async for event in agent.astream_events(
            "Explain what TUPSAFE is in one sentence.",
            session_id="test-session-stream"
        ):
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    print(content, end="", flush=True)
                    full_response += content

        print("\n\n✓ Streaming test completed successfully")

    except Exception as e:
        print(f"\n✗ Streaming test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_agent_with_tools():
    """Test agent with database tools."""
    print_separator("Database Tools Test")

    try:
        if not os.getenv("SUPABASE_URL"):
            print("⚠️  Supabase not configured, skipping tools test")
            return

        # Use the first available provider
        if os.getenv("OPENROUTER_API_KEY"):
            provider = "openrouter"
            model = "anthropic/claude-3.5-sonnet"
        elif os.getenv("OPENAI_API_KEY"):
            provider = "openai"
            model = "gpt-4o-mini"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "gemini"
            model = "gemini-2.0-flash-exp"
        elif os.getenv("GROQ_API_KEY"):
            provider = "groq"
            model = "llama-3.3-70b-versatile"
        else:
            print("⚠️  No LLM provider configured, skipping tools test")
            return

        print(f"Initializing agent with provider={provider}, model={model}")
        agent = TUPSAFEAgent(model=model, provider=provider)

        # Test tool usage
        queries = [
            "How many employees are in the system?",
            "What is the SALN compliance rate?",
        ]

        for query in queries:
            print(f"\nTest Query: '{query}'")
            print("Agent response:\n")

            async for event in agent.astream_events(
                query,
                session_id="test-session-tools"
            ):
                if event["event"] == "on_tool_start":
                    tool_name = event["name"]
                    print(f"\n[🔧 Using tool: {tool_name}]")

                elif event["event"] == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        print(content, end="", flush=True)

            print("\n")

        print("✓ Database tools test completed successfully")

    except Exception as e:
        print(f"\n✗ Tools test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_conversation_memory():
    """Test conversation memory."""
    print_separator("Conversation Memory Test")

    try:
        # Use the first available provider
        if os.getenv("OPENROUTER_API_KEY"):
            provider = "openrouter"
            model = "anthropic/claude-3.5-sonnet"
        elif os.getenv("OPENAI_API_KEY"):
            provider = "openai"
            model = "gpt-4o-mini"
        elif os.getenv("GOOGLE_API_KEY"):
            provider = "gemini"
            model = "gemini-2.0-flash-exp"
        elif os.getenv("GROQ_API_KEY"):
            provider = "groq"
            model = "llama-3.3-70b-versatile"
        else:
            print("⚠️  No LLM provider configured, skipping memory test")
            return

        agent = TUPSAFEAgent(model=model, provider=provider, enable_memory=True)
        session_id = "test-session-memory"

        # First message
        print("Message 1: 'My name is Alice'")
        response1 = await agent.ainvoke("My name is Alice", session_id)
        print(f"Response: {response1['messages'][-1].content}\n")

        # Second message (should remember context)
        print("Message 2: 'What is my name?'")
        response2 = await agent.ainvoke("What is my name?", session_id)
        answer = response2['messages'][-1].content
        print(f"Response: {answer}\n")

        if "alice" in answer.lower():
            print("✓ Agent remembered the name from previous message")
        else:
            print("⚠️  Agent may not have remembered the context")

        # Test memory retrieval
        history = agent.get_conversation_history(session_id)
        print(f"\nConversation history length: {len(history)} messages")

        # Clear memory
        agent.clear_conversation_history(session_id)
        history_after = agent.get_conversation_history(session_id)
        print(f"After clearing: {len(history_after)} messages")

        print("\n✓ Memory test completed successfully")

    except Exception as e:
        print(f"\n✗ Memory test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests."""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "TUPSAFE AI Agent Test Suite" + " " * 31 + "║")
    print("╚" + "═" * 78 + "╝")

    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed. Please configure at least one LLM provider.")
        return

    # Test LLM providers
    test_llm_providers()

    # Test agent
    await test_agent_basic()

    # Test streaming
    await test_agent_streaming()

    # Test tools
    await test_agent_with_tools()

    # Test memory
    await test_conversation_memory()

    print_separator("Test Summary")
    print("✓ All tests completed!")
    print("\nNext steps:")
    print("  1. Review the responses above")
    print("  2. Check AI_AGENT_IMPLEMENTATION.md for detailed documentation")
    print("  3. Try the agent in your application")
    print()


if __name__ == "__main__":
    asyncio.run(main())
