/**
 * AI Assistant Loading State
 *
 * Loading skeleton for the AI Assistant page.
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssistantLoading() {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg shadow-sm overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between gap-4 border-b bg-background/95 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 sm:w-28" />
        </div>

        {/* Messages Area Skeleton */}
        <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Message Skeleton 1 */}
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 max-w-[80%]">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-3 w-12 mt-2 ml-2" />
              </div>
            </div>

            {/* Message Skeleton 2 */}
            <div className="flex gap-3 flex-row-reverse">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 max-w-[80%] flex flex-col items-end">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-3 w-12 mt-2 mr-2" />
              </div>
            </div>

            {/* Message Skeleton 3 */}
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 max-w-[80%]">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <div className="flex items-center gap-2 mt-2 ml-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="shrink-0 border-t p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            <Skeleton className="h-[60px] w-full rounded-lg" />
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-3 w-40 sm:w-48" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
