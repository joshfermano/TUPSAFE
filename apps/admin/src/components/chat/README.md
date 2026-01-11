# Chat Components

Production-ready AI chat interface components for the TUPSAFE admin portal.

## Components

### ChatContainer
Main container component that manages the entire chat interface.

**Features:**
- Message state management via useChat hook
- Auto-scrolling to latest message
- Empty state with suggested prompts
- Error handling with user feedback
- Tool usage indicators
- Toast notifications for events

**Props:**
- `className?: string` - Optional CSS classes

**Usage:**
```tsx
import { ChatContainer } from '@/components/chat';

export default function AssistantPage() {
  return <ChatContainer />;
}
```

### ChatMessage
Individual message component with rich rendering capabilities.

**Features:**
- Different styling for user/assistant/system messages
- Markdown rendering with GFM support
- Syntax highlighting for code blocks
- Copy to clipboard functionality
- Tool usage badges
- Timestamps
- Streaming indicators

**Props:**
```tsx
interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
}
```

**Usage:**
```tsx
<ChatMessage
  id="msg-1"
  role="assistant"
  content="Here's a code example:\n\n```typescript\nconst foo = 'bar';\n```"
  timestamp={new Date()}
  toolsUsed={['database_query', 'report_generator']}
/>
```

### ChatInput
Auto-expanding textarea input with send button.

**Features:**
- Auto-resize (3-10 rows)
- Character counter (4000 limit)
- Enter to send, Shift+Enter for newline
- Send button with loading state
- Disabled state support
- Visual validation feedback

**Props:**
```tsx
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}
```

**Usage:**
```tsx
<ChatInput
  onSend={(message) => console.log(message)}
  disabled={isLoading}
  placeholder="Type your message..."
  maxLength={4000}
/>
```

### ChatHeader
Header component with controls and status indicators.

**Features:**
- Model selector dropdown
- Clear chat button with confirmation
- Connection status indicator
- Message count display
- Responsive design

**Props:**
```tsx
interface ChatHeaderProps {
  model: string;
  onModelChange: (model: string) => void;
  onClearChat: () => void;
  isConnected?: boolean;
  messageCount?: number;
  className?: string;
}
```

**Available Models:**
- `openrouter` - Multiple models via OpenRouter API
- `openai` - GPT-4 and GPT-3.5 models
- `gemini` - Google Gemini Pro and Ultra
- `groq` - Fast inference with Groq

**Usage:**
```tsx
<ChatHeader
  model="openrouter"
  onModelChange={(model) => setModel(model)}
  onClearChat={() => clearHistory()}
  isConnected={true}
  messageCount={10}
/>
```

## Hooks

### useChat
Custom hook for managing chat functionality with SSE streaming.

**Features:**
- SSE streaming support with AbortController
- Message state management
- Session management with localStorage persistence
- Tool usage tracking
- Error handling
- History persistence
- Clear history functionality
- Regenerate last response

**Options:**
```tsx
interface UseChatOptions {
  apiEndpoint?: string;      // Default: '/api/ai/chat/stream'
  model?: string;             // Default: 'openrouter'
  onError?: (error: Error) => void;
}
```

**Returns:**
```tsx
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
```

**Usage:**
```tsx
import { useChat } from '@/hooks/useChat';

function ChatComponent() {
  const {
    messages,
    isStreaming,
    currentTools,
    error,
    sendMessage,
    clearHistory,
  } = useChat({
    model: 'openrouter',
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      {messages.map(msg => (
        <ChatMessage key={msg.id} {...msg} />
      ))}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </div>
  );
}
```

## API Routes

### POST /api/ai/chat/stream
Streaming SSE endpoint for real-time AI responses.

**Authentication:** Required (admin or hr role)

**Request Body:**
```typescript
{
  message: string;           // Required: User message
  sessionId?: string;        // Optional: Session ID
  model?: string;           // Optional: AI model
  history?: Array<{         // Optional: Conversation history
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}
```

**Response:** Server-Sent Events stream

**Event Types:**
- `data: {"type":"content","content":"text"}` - Streamed text content
- `data: {"type":"tool","tool":"tool_name"}` - Tool usage indicator
- `data: {"type":"error","error":"message"}` - Error occurred
- `data: [DONE]` - Stream completed

### POST /api/ai/chat
Non-streaming endpoint for complete responses.

**Authentication:** Required (admin or hr role)

**Request Body:** Same as streaming endpoint

**Response:**
```typescript
{
  content: string;
  toolsUsed?: string[];
  model: string;
}
```

## Styling

All components use:
- TUP maroon (#8B1538) for primary accents
- shadcn/ui component primitives
- Tailwind CSS for styling
- Dark mode support via next-themes
- Responsive breakpoints (md, lg)

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly
- High contrast mode support

## Performance

- React.memo for expensive renders
- useCallback for stable callbacks
- Auto-scroll optimization
- Lazy loading for messages
- Efficient SSE streaming
- LocalStorage throttling

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Dependencies

Required packages:
```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

Peer dependencies (already in admin app):
- lucide-react
- date-fns
- sonner
- @radix-ui/react-* (via shadcn/ui)

## Examples

### Basic Chat Interface
```tsx
import { ChatContainer } from '@/components/chat';

export default function AssistantPage() {
  return (
    <div className="h-screen">
      <ChatContainer />
    </div>
  );
}
```

### Custom Chat with Manual Control
```tsx
import { ChatMessage, ChatInput, ChatHeader } from '@/components/chat';
import { useChat } from '@/hooks/useChat';

export default function CustomChat() {
  const [model, setModel] = useState('openrouter');
  const { messages, isStreaming, sendMessage, clearHistory } = useChat({ model });

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        model={model}
        onModelChange={setModel}
        onClearChat={clearHistory}
        messageCount={messages.length}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} {...msg} />
        ))}
      </div>
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

### With Custom Error Handling
```tsx
import { useChat } from '@/hooks/useChat';
import { toast } from 'sonner';

const { messages, sendMessage } = useChat({
  onError: (error) => {
    toast.error('Chat Error', {
      description: error.message,
      action: {
        label: 'Retry',
        onClick: () => sendMessage(lastMessage),
      },
    });
  },
});
```

## Troubleshooting

### Streaming not working
- Verify AI_AGENT_URL is set in .env.local
- Check Python AI service is running
- Verify authentication is working
- Check browser console for errors

### Markdown not rendering
- Ensure react-markdown and remark-gfm are installed
- Check for parsing errors in console
- Verify markdown syntax is valid

### Messages not persisting
- Check localStorage is enabled
- Verify sessionId is being generated
- Check browser console for storage errors

### Performance issues
- Limit visible messages (virtualization)
- Reduce message history sent to API
- Optimize markdown rendering
- Check for memory leaks

## Contributing

When adding new features:
1. Follow existing component patterns
2. Maintain TypeScript strict mode
3. Add proper error handling
4. Include loading states
5. Support dark mode
6. Test accessibility
7. Update this documentation
