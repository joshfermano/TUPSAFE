/**
 * ChatHeader Component
 *
 * Header for the chat interface with title and action buttons.
 */

'use client';

import React from 'react';
import { Bot, Trash2, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  onClearChat: () => void;
  isConnected?: boolean;
  messageCount?: number;
  className?: string;
}

export function ChatHeader({
  onClearChat,
  isConnected = true,
  messageCount = 0,
  className,
}: ChatHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border/30 bg-background px-4 md:px-8 lg:px-12 py-4 shrink-0',
        className
      )}
    >
      {/* Left Side: Title and Status */}
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
        <div className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-xl bg-gradient-to-br from-[#8B1538] to-[#6B0F28] text-white shadow-md shadow-[#8B1538]/20 shrink-0">
          <Bot className="h-5 w-5 md:h-5.5 md:w-5.5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-medium tracking-tight">
              Assistant
            </h1>
            {isConnected ? (
              <Badge variant="outline" className="h-5 px-1.5 gap-1 hidden xs:flex">
                <CircleDot className="h-2 w-2 fill-green-500 text-green-500" />
                <span className="text-[10px]">Online</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 gap-1 hidden xs:flex">
                <CircleDot className="h-2 w-2 fill-red-500 text-red-500" />
                <span className="text-[10px]">Offline</span>
              </Badge>
            )}
          </div>
          {messageCount > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {messageCount} message{messageCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Right Side: Clear Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 md:h-9 gap-1.5 shrink-0 px-2.5 md:px-3"
            disabled={messageCount === 0}
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden md:inline text-xs md:text-sm">Clear</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onClearChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
