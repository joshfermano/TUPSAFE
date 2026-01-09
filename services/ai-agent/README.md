# TUPSAFE AI Agent Service

Intelligent assistant for PDS/SALN management and recruitment powered by LangChain and LangGraph.

## Features

- Multi-LLM support (OpenRouter, OpenAI, Google Gemini, Groq)
- Real-time streaming responses via SSE
- Database queries via MCP tools
- Conversation memory with Redis
- Role-based access control (admin/co_admin/hr)

## Quick Start

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Endpoint                            | Description          |
| ------ | ----------------------------------- | -------------------- |
| POST   | `/api/v1/chat/stream`               | Streaming chat (SSE) |
| POST   | `/api/v1/chat`                      | Non-streaming chat   |
| GET    | `/api/v1/chat/history/{session_id}` | Get chat history     |
| DELETE | `/api/v1/chat/history/{session_id}` | Clear history        |
| GET    | `/api/v1/models`                    | Available LLM models |
| GET    | `/api/v1/health`                    | Health check         |

## Environment Variables

See `.env.example` for required configuration.

## Docker

```bash
docker build -t tupsafe-ai-agent .
docker run -p 8000:8000 --env-file .env tupsafe-ai-agent
```
