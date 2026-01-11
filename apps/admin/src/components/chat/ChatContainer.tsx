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
  // Use scrollTop on the viewport instead of scrollIntoView to prevent parent scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
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
        'flex flex-1 min-h-0 flex-col w-full bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden',
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
      <ScrollArea className="flex-1 min-h-0 overscroll-contain" ref={scrollAreaRef}>
        <div className="px-4 py-6 md:px-8 lg:px-12 xl:px-16">
          <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-center">
                <div className="flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-[#8B1538]/10 to-[#8B1538]/5 mb-4">
                  <Bot className="h-10 w-10 md:h-12 md:w-12 text-[#8B1538]" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  AI Assistant Ready
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-6 px-4">
                  Ask me anything about TUPSAFE, administrative tasks, data analysis,
                  or general questions.
                </p>
                
                {/* Suggested prompts grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl px-2">
                  {suggestedPrompts.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto py-3 px-3 sm:px-4 text-left justify-start bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl"
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
      <div className="shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-md px-4 py-4 md:px-8 lg:px-12 md:py-5">
        <div className="max-w-4xl mx-auto">
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
