'use client';

import * as React from 'react';
import { ChevronDown, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataField } from '@/components/shared';
import { PdsAttachmentsList } from '@/components/admin/PdsAttachmentsList';
import { cn } from '@/lib/utils';

interface AttachmentData {
  id: string;
  fileName: string;
  fileUrl: string | null;
}

interface TrainingData {
  id?: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  hours?: number;
  typeOfLd?: string;
  conductedBy?: string;
  attachments?: AttachmentData[];
}

interface TrainingCardProps {
  data: TrainingData;
  index?: number;
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Format date range for display
 */
function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return '—';
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return `${formatDate(from)} - Present`;
  return to ? formatDate(to) : '—';
}

/**
 * TrainingCard component for displaying learning and development entries
 *
 * Converts the Training section to a responsive card:
 * - Mobile: Training title as summary, collapsible details
 * - Desktop: Grid layout showing all fields
 * - Includes attachment display
 */
export function TrainingCard({ data, index, className }: TrainingCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayInfo = {
    primary: data.title || 'Unknown Training',
    secondary: data.conductedBy,
    hours: data.hours,
    hasAttachments: data.attachments && data.attachments.length > 0,
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {/* Mobile Summary */}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                {index !== undefined && (
                  <span className="mb-1 inline-block text-xs font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
                <h4 className="font-medium text-foreground">
                  {displayInfo.primary}
                </h4>
                {displayInfo.secondary && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {displayInfo.secondary}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateRange(data.dateFrom, data.dateTo)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {displayInfo.hours !== undefined && displayInfo.hours !== null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {displayInfo.hours}
                    </p>
                  </div>
                )}
                {displayInfo.hasAttachments && (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Mobile Expand Button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-none border-t border-border/50 text-muted-foreground hover:text-foreground">
                <span className="text-xs">
                  {isOpen ? 'Hide Details' : 'View Details'}
                </span>
                <ChevronDown
                  className={cn(
                    'ml-1.5 h-3 w-3 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {/* Mobile Expanded Content */}
            <CollapsibleContent>
              <div className="border-t border-border/50 bg-muted/50 p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <DataField
                    label="Training Title"
                    value={data.title}
                    className="col-span-2"
                  />
                  <DataField label="From" value={formatDate(data.dateFrom)} />
                  <DataField label="To" value={formatDate(data.dateTo)} />
                  <DataField
                    label="Number of Hours"
                    value={
                      data.hours !== null && data.hours !== undefined
                        ? data.hours.toString()
                        : null
                    }
                  />
                  <DataField label="Type of L&D" value={data.typeOfLd} />
                  <DataField
                    label="Conducted/Sponsored By"
                    value={data.conductedBy}
                    className="col-span-2"
                  />
                </dl>

                {/* Attachments */}
                {data.attachments && data.attachments.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({data.attachments.length})
                      </h5>
                      <PdsAttachmentsList attachments={data.attachments} />
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop Layout */}
        <div className="hidden p-4 md:block">
          {index !== undefined && (
            <span className="mb-3 inline-block text-xs font-medium text-muted-foreground">
              #{index + 1}
            </span>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DataField
              label="Training Title"
              value={data.title}
              className="col-span-2"
            />
            <DataField label="From" value={formatDate(data.dateFrom)} />
            <DataField label="To" value={formatDate(data.dateTo)} />
            <DataField
              label="Number of Hours"
              value={
                data.hours !== null && data.hours !== undefined
                  ? data.hours.toString()
                  : null
              }
            />
            <DataField label="Type of L&D" value={data.typeOfLd} />
            <DataField
              label="Conducted/Sponsored By"
              value={data.conductedBy}
              className="col-span-2"
            />
          </dl>

          {/* Attachments */}
          {data.attachments && data.attachments.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({data.attachments.length})
                </h5>
                <PdsAttachmentsList attachments={data.attachments} />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
