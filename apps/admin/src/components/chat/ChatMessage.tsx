/**
 * ChatMessage Component
 *
 * Displays individual chat messages with different styling for user vs assistant.
 * Supports markdown rendering, tool usage indicators, timestamps, and copy functionality.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Check, Copy, User, Bot, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  toolsUsed,
  isStreaming,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format timestamp
  const formattedTime = useMemo(() => {
    return format(timestamp, 'HH:mm');
  }, [timestamp]);

  return (
    <div
      className={cn(
        'flex gap-2.5 sm:gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          'h-8 w-8 md:h-9 md:w-9 shrink-0 shadow-sm',
          isUser
            ? 'ring-1 ring-[#8B1538]/30'
            : 'ring-1 ring-border'
        )}
      >
        <AvatarFallback
          className={cn(
            'text-xs font-medium',
            isUser
              ? 'bg-[#8B1538] text-white'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1 min-w-0 max-w-[88%] sm:max-w-[80%] lg:max-w-[75%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 md:px-5 md:py-3.5 shadow-sm',
            isUser
              ? 'bg-gradient-to-r from-[#8B1538] to-[#7B1230] text-white shadow-md shadow-[#8B1538]/10'
              : 'bg-muted/40 text-foreground hover:bg-muted/50 transition-colors'
          )}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-2 prose-pre:bg-transparent prose-pre:p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(codeProps) {
                    const { className, children, style: _style, ref: _ref, ...restProps } = codeProps;
                    const inline = !className;
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    return !inline && language ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={language}
                        PreTag="div"
                        className="!rounded-lg !my-2 !text-[13px] !leading-relaxed"
                        customStyle={{
                          margin: 0,
                          padding: '0.875rem 1rem',
                          fontSize: '13px',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : !inline ? (
                      // Code block without language
                      <pre className="bg-muted/80 rounded-lg p-3 my-2 overflow-x-auto">
                        <code className="text-[13px] font-mono" {...restProps}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-muted/80 px-1.5 py-0.5 rounded text-[13px] font-mono"
                        {...restProps}
                      >
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-4 mb-2 space-y-0.5 text-sm">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-4 mb-2 space-y-0.5 text-sm">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B1538] dark:text-[#e87d9a] hover:underline font-medium"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-2 rounded-lg border border-border">
                        <table className="min-w-full text-sm">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide bg-muted/50 border-b border-border">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 py-2 border-b border-border/50 last:border-b-0">
                        {children}
                      </td>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-[#8B1538]/50 pl-3 my-2 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    );
                  },
                  h1({ children }) {
                    return <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-semibold mt-3 mb-1 first:mt-0">{children}</h3>;
                  },
                  hr() {
                    return <hr className="my-3 border-border/50" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
              )}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
          )}
        </div>

        {/* Metadata Row */}
        <div
          className={cn(
            'flex items-center gap-1.5 sm:gap-2 px-1',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Timestamp */}
          <span className="text-[11px] text-muted-foreground/70">{formattedTime}</span>

          {/* Tools Used Count */}
          {toolsUsed && toolsUsed.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground/70">
              <Wrench className="h-2.5 w-2.5" />
              <span className="text-[11px]">
                {toolsUsed.length}
              </span>
            </div>
          )}

          {/* Copy Button (only for non-empty assistant messages) */}
          {isAssistant && content && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground/70 hover:text-foreground" />
              )}
            </Button>
          )}
        </div>

        {/* Tool Details - Only show if there are tools and not during streaming */}
        {toolsUsed && toolsUsed.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1 px-1 mt-0.5">
            {toolsUsed.map((tool, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 font-normal bg-muted/50"
              >
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
