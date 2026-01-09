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
        'flex items-center justify-between gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-3 sm:py-4 shrink-0',
        className
      )}
    >
      {/* Left Side: Title and Status */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-[#8B1538] text-white shadow-sm shrink-0">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">
              AI Assistant
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
            className="h-8 sm:h-9 gap-1.5 shrink-0 px-2.5 sm:px-3"
            disabled={messageCount === 0}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Clear</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
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
