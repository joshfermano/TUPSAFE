'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChildData {
  fullName: string;
  dateOfBirth: string;
}

interface ChildCardProps {
  data: ChildData;
  index?: number;
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * ChildCard component for displaying children entries
 *
 * A simple inline card design for the children list
 * showing name and date of birth in a compact format.
 */
export function ChildCard({ data, index, className }: ChildCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          {index !== undefined && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          )}
          <span className="font-medium text-foreground">{data.fullName}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Date of Birth</p>
          <p className="text-sm font-medium tabular-nums text-foreground">
            {formatDate(data.dateOfBirth)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
