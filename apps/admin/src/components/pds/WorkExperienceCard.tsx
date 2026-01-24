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
import { Badge } from '@/components/ui/badge';
import { DataField } from '@/components/shared';
import { cn } from '@/lib/utils';

interface WorkExperienceData {
  id?: string;
  positionTitle?: string;
  department?: string;
  monthlySalary?: number | null;
  salaryGrade?: string;
  statusOfAppointment?: string;
  govService?: boolean;
  periodFrom?: string;
  periodTo?: string;
}

interface WorkExperienceCardProps {
  data: WorkExperienceData;
  index?: number;
  className?: string;
}

/**
 * Format currency values in PHP format
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
 * WorkExperienceCard component for displaying work experience entries
 *
 * Converts the 7-column Work Experience table to a responsive card:
 * - Mobile: Position + Company as summary, collapsible details
 * - Desktop: Grid layout showing all fields
 */
export function WorkExperienceCard({ data, index, className }: WorkExperienceCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayInfo = {
    primary: data.positionTitle || 'Unknown Position',
    secondary: data.department || 'Unknown Organization',
    salary: formatCurrency(data.monthlySalary),
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
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {displayInfo.secondary}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateRange(data.periodFrom, data.periodTo)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {data.govService !== undefined && (
                  <Badge variant={data.govService ? 'default' : 'secondary'} className="text-xs">
                    {data.govService ? 'Gov\'t' : 'Private'}
                  </Badge>
                )}
              </div>
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
                    label="Position Title"
                    value={data.positionTitle}
                    className="col-span-2"
                  />
                  <DataField
                    label="Department/Agency"
                    value={data.department}
                    className="col-span-2"
                  />
                  <DataField
                    label="Inclusive Dates"
                    value={formatDateRange(data.periodFrom, data.periodTo)}
                  />
                  <DataField
                    label="Monthly Salary"
                    value={<span className="tabular-nums">{formatCurrency(data.monthlySalary)}</span>}
                  />
                  <DataField
                    label="Salary Grade"
                    value={data.salaryGrade}
                  />
                  <DataField
                    label="Status of Appointment"
                    value={data.statusOfAppointment}
                  />
                  <DataField
                    label="Gov't Service"
                    value={
                      data.govService !== undefined
                        ? data.govService
                          ? 'Yes'
                          : 'No'
                        : undefined
                    }
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
              label="Position Title"
              value={data.positionTitle}
              className="col-span-2"
            />
            <DataField
              label="Department/Agency/Office/Company"
              value={data.department}
              className="col-span-2"
            />
            <DataField
              label="Inclusive Dates"
              value={formatDateRange(data.periodFrom, data.periodTo)}
            />
            <DataField
              label="Monthly Salary"
              value={<span className="tabular-nums">{formatCurrency(data.monthlySalary)}</span>}
            />
            <DataField
              label="Salary Grade"
              value={data.salaryGrade}
            />
            <DataField
              label="Status of Appointment"
              value={data.statusOfAppointment}
            />
            <DataField
              label="Gov't Service"
              value={
                data.govService !== undefined ? (
                  <Badge variant={data.govService ? 'default' : 'secondary'}>
                    {data.govService ? 'Yes' : 'No'}
                  </Badge>
                ) : undefined
              }
              className="col-span-4"
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
