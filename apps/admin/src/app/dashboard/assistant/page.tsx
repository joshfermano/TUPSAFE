/**
 * AI Assistant Page
 *
 * Full-page AI chat interface for the admin portal.
 * Provides intelligent assistance for system management, data analysis, and general queries.
 */

'use client';

import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function AssistantPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <ChatContainer className="flex-1 min-h-0 w-full overflow-hidden" />
    </div>
  );
}
