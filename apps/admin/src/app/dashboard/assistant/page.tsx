/**
 * AI Assistant Page
 *
 * Full-page AI chat interface for the admin portal.
 * Provides intelligent assistance for system management, data analysis, and general queries.
 *
 * The ChatContainer is dynamically imported since it includes AI/streaming
 * dependencies that are not needed until this page is visited.
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChatContainer = dynamic(
  () => import('@/components/chat/ChatContainer').then(m => ({ default: m.ChatContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden p-6 gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    ),
  }
);

export default function AssistantPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <ChatContainer className="flex-1 min-h-0 w-full overflow-hidden" />
    </div>
  );
}
