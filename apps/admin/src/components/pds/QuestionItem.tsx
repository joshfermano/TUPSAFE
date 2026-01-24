'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuestionItemProps {
  number: string;
  question: string;
  answer?: boolean;
  details?: string;
  className?: string;
}

/**
 * QuestionItem component for displaying PDS Questions section (34-40)
 *
 * Features:
 * - Clean semantic styling with proper light/dark mode support
 * - Uses Badge variants instead of hard-coded colors
 * - Clean detail box styling with proper backgrounds
 */
export function QuestionItem({
  number,
  question,
  answer,
  details,
  className,
}: QuestionItemProps) {
  const hasAnswer = answer !== undefined;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-3">
        <span className="min-w-[30px] text-sm font-semibold text-muted-foreground">
          {number}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">{question}</p>
          <div className="flex items-center gap-3 mb-2">
            {hasAnswer ? (
              <Badge variant={answer ? 'default' : 'secondary'}>
                {answer ? 'Yes' : 'No'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Answered
              </Badge>
            )}
          </div>
          {answer && details && (
            <div className="p-3 bg-muted/50 rounded-lg border mt-2">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Details:
              </p>
              <p className="text-sm text-foreground">{details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * QuestionList component for wrapping multiple QuestionItem components
 * with proper spacing and separators
 */
interface QuestionListProps {
  children: React.ReactNode;
  className?: string;
}

export function QuestionList({ children, className }: QuestionListProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {React.Children.map(children, (child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < React.Children.count(children) - 1 && (
            <div className="border-t border-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
