/**
 * useChat Hook
 *
 * Custom hook for managing AI chat functionality with SSE streaming support.
 * Handles message state, streaming responses, tool usage indicators, and session management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentTools: string[];
  error: string | null;
  sessionId: string;
}

interface UseChatOptions {
  apiEndpoint?: string;
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentTools: string[];
  error: string | null;
  sessionId: string;
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => void;
  regenerateLastResponse: () => Promise<void>;
}

const STORAGE_KEY = 'tupsafe-admin-chat-history';
const SESSION_KEY = 'tupsafe-admin-chat-session';

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Load chat history from localStorage
function loadChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((msg: Record<string, unknown>) => ({
      ...msg,
      timestamp: new Date(msg.timestamp as string | number),
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

// Save chat history to localStorage
function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

// Load or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return stored;

    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  } catch (_error) {
    return generateSessionId();
  }
}

/**
 * Normalize content to a string.
 * If content is not a string (e.g., object/array), render as markdown-first:
 * - Objects/arrays become JSON code blocks
 * - Other types are coerced to string
 */
function normalizeContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (content === null || content === undefined) {
    return '';
  }

  if (typeof content === 'object') {
    // Render as JSON code block for markdown-first display
    try {
      const jsonStr = JSON.stringify(content, null, 2);
      return `\`\`\`json\n${jsonStr}\n\`\`\``;
    } catch {
      return String(content);
    }
  }

  return String(content);
}

/**
 * Parse SSE events from a text buffer.
 * Returns parsed events and the remaining unparsed buffer.
 */
function parseSSEBuffer(buffer: string): {
  events: Array<{
    type: string;
    content?: string;
    tool?: string;
    error?: string;
  }>;
  remaining: string;
} {
  const events: Array<{
    type: string;
    content?: string;
    tool?: string;
    error?: string;
  }> = [];
  const lines = buffer.split('\n');
  let remaining = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If this is the last line and doesn't end with newline, it might be incomplete
    if (i === lines.length - 1 && !buffer.endsWith('\n') && line.length > 0) {
      remaining = line;
      break;
    }

    // Skip empty lines and non-data lines
    if (!line.trim() || !line.startsWith('data:')) {
      continue;
    }

    // Extract data after "data:" (handle both "data: " and "data:")
    const dataStart = line.indexOf(':');
    if (dataStart === -1) continue;

    const data = line.slice(dataStart + 1).trim();

    // Handle [DONE] signal
    if (data === '[DONE]') {
      continue;
    }

    // Parse JSON data
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && parsed.type) {
        events.push(parsed);
      }
    } catch {
      // Skip malformed JSON - might be incomplete
      console.warn('Failed to parse SSE data:', data);
    }
  }

  return { events, remaining };
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { apiEndpoint = '/api/ai/chat/stream', onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTools, setCurrentTools] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  // Load chat history and session ID on mount
  useEffect(() => {
    const history = loadChatHistory();
    setMessages(history);
    setSessionId(getSessionId());
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isStreaming) return;

      lastUserMessageRef.current = message;
      setError(null);
      setCurrentTools([]);

      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      // Create placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            sessionId,
            history: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';
        const toolsUsed: string[] = [];
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode chunk and append to buffer
          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;

          // Parse complete events from buffer
          const { events, remaining } = parseSSEBuffer(sseBuffer);
          sseBuffer = remaining;

          for (const event of events) {
            if (event.type === 'content' && event.content !== undefined) {
              // Normalize content (handles objects, arrays, etc.)
              const normalizedContent = normalizeContent(event.content);
              accumulatedContent += normalizedContent;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  lastMsg.content = accumulatedContent;
                }
                return newMessages;
              });
            } else if (event.type === 'tool' && event.tool) {
              if (!toolsUsed.includes(event.tool)) {
                toolsUsed.push(event.tool);
                setCurrentTools([...toolsUsed]);
              }
            } else if (event.type === 'error' && event.error) {
              throw new Error(event.error);
            }
          }
        }

        // Process any remaining buffer content
        if (sseBuffer.trim()) {
          const { events } = parseSSEBuffer(sseBuffer + '\n');
          for (const event of events) {
            if (event.type === 'content' && event.content !== undefined) {
              const normalizedContent = normalizeContent(event.content);
              accumulatedContent += normalizedContent;
            }
          }
        }

        // Finalize assistant message
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = accumulatedContent;
            lastMsg.isStreaming = false;
            lastMsg.toolsUsed = toolsUsed.length > 0 ? toolsUsed : undefined;
          }
          return newMessages;
        });
      } catch (err) {
        const error = err as Error;

        if (error.name === 'AbortError') {
          console.log('Request aborted');
          return;
        }

        console.error('Chat error:', error);
        setError(error.message);

        if (onError) {
          onError(error);
        }

        // Remove the failed assistant message
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessage.id)
        );
      } finally {
        setIsStreaming(false);
        setCurrentTools([]);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, messages, sessionId, apiEndpoint, onError]
  );

  const regenerateLastResponse = useCallback(async () => {
    if (!lastUserMessageRef.current || isStreaming) return;

    // Remove last assistant message if exists
    setMessages((prev) => {
      const filtered = [...prev];
      if (
        filtered.length > 0 &&
        filtered[filtered.length - 1].role === 'assistant'
      ) {
        filtered.pop();
      }
      // Also remove the last user message as we'll re-add it
      if (
        filtered.length > 0 &&
        filtered[filtered.length - 1].role === 'user'
      ) {
        filtered.pop();
      }
      return filtered;
    });

    // Re-send the last user message
    await sendMessage(lastUserMessageRef.current);
  }, [isStreaming, sendMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentTools([]);
    setIsStreaming(false);

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);

      // Generate new session ID
      const newSessionId = generateSessionId();
      localStorage.setItem(SESSION_KEY, newSessionId);
      setSessionId(newSessionId);
    }

    lastUserMessageRef.current = '';
  }, []);

  return {
    messages,
    isStreaming,
    currentTools,
    error,
    sessionId,
    sendMessage,
    clearHistory,
    regenerateLastResponse,
  };
}
