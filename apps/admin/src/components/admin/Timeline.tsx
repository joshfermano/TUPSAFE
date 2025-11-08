/**
 * Timeline Component
 *
 * Professional timeline component for displaying chronological activity logs.
 * Features clean design with icons, timestamps, and activity descriptions.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TimelineEvent {
  id: string;
  type: 'login' | 'logout' | 'submission' | 'update' | 'status_change' | 'admin_action';
  title: string;
  description?: string;
  timestamp: Date;
  icon?: LucideIcon;
  metadata?: Record<string, string | number>;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

interface TimelineItemProps {
  event: TimelineEvent;
  isLast?: boolean;
}

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'login':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'logout':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800/30';
    case 'submission':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'update':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    case 'status_change':
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    case 'admin_action':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800/30';
  }
};

const getEventTypeLabel = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'login':
      return 'Login';
    case 'logout':
      return 'Logout';
    case 'submission':
      return 'Submission';
    case 'update':
      return 'Update';
    case 'status_change':
      return 'Status Change';
    case 'admin_action':
      return 'Admin Action';
    default:
      return 'Event';
  }
};

function TimelineItem({ event, isLast }: TimelineItemProps) {
  const Icon = event.icon;

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-10 h-full w-px bg-border" />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background',
          getEventColor(event.type)
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{event.title}</p>
              <Badge variant="outline" className="text-xs">
                {getEventTypeLabel(event.type)}
              </Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {format(event.timestamp, 'MMM d, yyyy h:mm a')}
          </time>
        </div>

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="rounded-md border bg-muted/50 p-2">
            <dl className="grid gap-1 text-xs">
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
        />
      ))}
    </div>
  );
}
