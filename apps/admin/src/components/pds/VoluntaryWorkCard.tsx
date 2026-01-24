'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { DataField } from '@/components/shared';
import { cn } from '@/lib/utils';

interface VoluntaryWorkData {
  id?: string;
  organizationName?: string;
  organizationAddress?: string;
  positionNature?: string;
  dateFrom?: string;
  dateTo?: string;
  numberOfHours?: number;
}

interface VoluntaryWorkCardProps {
  data: VoluntaryWorkData;
  index?: number;
  className?: string;
}

/**
 * Format date range for display
 */
function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return '—';

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return `${formatDate(from)} - Present`;
  return to ? formatDate(to) : '—';
}

/**
 * VoluntaryWorkCard component for displaying voluntary work entries
 *
 * Converts the 4-column Voluntary Work table to a responsive card:
 * - Mobile: Organization name as summary, collapsible details
 * - Desktop: Grid layout showing all fields
 */
export function VoluntaryWorkCard({ data, index, className }: VoluntaryWorkCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayInfo = {
    primary: data.organizationName || 'Unknown Organization',
    secondary: data.positionNature,
    hours: data.numberOfHours,
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
                <h4 className="truncate font-medium text-foreground">
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
              {displayInfo.hours !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-semibold tabular-nums text-foreground">
                    {displayInfo.hours}
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Expand Button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-none border-t border-border/50 text-muted-foreground hover:text-foreground"
              >
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
                    label="Organization Name"
                    value={data.organizationName}
                    className="col-span-2"
                  />
                  <DataField
                    label="Organization Address"
                    value={data.organizationAddress}
                    className="col-span-2"
                  />
                  <DataField
                    label="Inclusive Dates"
                    value={formatDateRange(data.dateFrom, data.dateTo)}
                  />
                  <DataField
                    label="Number of Hours"
                    value={data.numberOfHours?.toString()}
                  />
                  <DataField
                    label="Position/Nature of Work"
                    value={data.positionNature}
                    className="col-span-2"
                  />
                </dl>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop Layout */}
        <div className="hidden p-4 md:block">
          {index !== undefined && (
            <span className="mb-2 inline-block text-xs font-medium text-muted-foreground">
              #{index + 1}
            </span>
          )}
          <dl className="grid grid-cols-4 gap-x-6 gap-y-4">
            <DataField
              label="Organization Name"
              value={data.organizationName}
              className="col-span-2"
            />
            <DataField
              label="Organization Address"
              value={data.organizationAddress}
              className="col-span-2"
            />
            <DataField
              label="Inclusive Dates"
              value={formatDateRange(data.dateFrom, data.dateTo)}
            />
            <DataField
              label="Number of Hours"
              value={data.numberOfHours?.toString()}
            />
            <DataField
              label="Position/Nature of Work"
              value={data.positionNature}
              className="col-span-2"
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
