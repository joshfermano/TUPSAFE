/**
 * ChatInput Component
 *
 * Input component with auto-expanding textarea, send button, and keyboard shortcuts.
 * Supports Enter to send and Shift+Enter for newlines.
 */

'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = !message.trim();
  const isOverLimit = message.length > maxLength;
  const canSend = !isEmpty && !isOverLimit && !disabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (min 2.5 rows on mobile, 3 rows on desktop, max 8 rows)
    const minHeight = 52; // ~2.5 rows
    const maxHeight = 160; // ~8 rows
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
  }, [message]);

  const handleSend = () => {
    if (!canSend) return;

    onSend(message.trim());
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className={cn(
            'resize-none pr-12 min-h-[52px] max-h-[160px] text-sm md:text-base rounded-xl border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-[#8B1538]/20',
            isOverLimit && 'border-destructive focus-visible:ring-destructive'
          )}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            'absolute bottom-2 right-2 h-8 w-8 md:h-9 md:w-9 rounded-xl transition-all',
            'bg-gradient-to-r from-[#8B1538] to-[#6B0F28] hover:bg-[#8B1538]/90 shadow-md shadow-[#8B1538]/20',
            'disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none'
          )}
          title={
            disabled
              ? 'Please wait...'
              : isEmpty
              ? 'Type a message to send'
              : isOverLimit
              ? 'Message too long'
              : 'Send message (Enter)'
          }
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character Counter and Help Text */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 px-1">
        <span className="hidden md:inline">
          Press Enter to send, Shift+Enter for new line
        </span>
        <span className="md:hidden">
          Enter to send
        </span>

        <span
          className={cn(
            'tabular-nums',
            isOverLimit && 'text-destructive font-medium'
          )}
        >
          {message.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
