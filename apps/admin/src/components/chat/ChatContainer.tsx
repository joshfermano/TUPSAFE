/**
 * ChatContainer Component
 *
 * Main container for the chat interface. Manages chat state, message rendering,
 * and auto-scrolling behavior.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { useChat } from '@/hooks/useChat';
import { toast } from 'sonner';

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    currentTools,
    error,
    sendMessage,
    clearHistory,
    sessionId,
  } = useChat({
    onError: (err) => {
      toast.error('Chat Error', {
        description: err.message || 'Failed to send message. Please try again.',
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleClearChat = () => {
    clearHistory();
    toast.success('Chat cleared', {
      description: 'Conversation history has been cleared.',
    });
  };

  // Suggested prompts for the empty state
  const suggestedPrompts = [
    {
      title: 'Pending Submissions',
      description: 'Overview of pending PDS and SALN',
      prompt: 'Show me an overview of pending submissions',
    },
    {
      title: 'Compliance Report',
      description: 'Generate compliance summary',
      prompt: 'Generate a compliance report for the current year',
    },
    {
      title: 'Department Analysis',
      description: 'Identify areas needing attention',
      prompt: 'List all departments with low compliance rates',
    },
    {
      title: 'System Help',
      description: 'Learn about workflows',
      prompt: 'Help me understand the approval workflow',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 bg-background border rounded-lg shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header - fixed at top */}
      <ChatHeader
        onClearChat={handleClearChat}
        messageCount={messages.length}
        isConnected={true}
      />

      {/* Messages Area - scrollable, takes remaining space */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-center">
                <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#8B1538]/10 mb-4">
                  <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-[#8B1538]" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  AI Assistant Ready
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-6 px-4">
                  Ask me anything about TUPSAFE, administrative tasks, data analysis,
                  or general questions.
                </p>
                
                {/* Suggested prompts grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-xl px-2">
                  {suggestedPrompts.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto py-3 px-3 sm:px-4 text-left justify-start hover:bg-accent/50 transition-colors"
                      onClick={() => handleSendMessage(item.prompt)}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage key={message.id} {...message} />
            ))}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Tool Usage Indicator */}
            {currentTools.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B1538] animate-pulse" />
                  <span className="text-xs">
                    Using: {currentTools.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </ScrollArea>

      {/* Input Area - fixed at bottom */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? 'AI is thinking...'
                : 'Ask me anything about TUPSAFE...'
            }
          />
        </div>
      </div>
    </div>
  );
}
