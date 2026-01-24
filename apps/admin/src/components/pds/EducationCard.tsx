'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { DataField } from '@/components/shared';
import { cn } from '@/lib/utils';

interface EducationData {
  level?: string;
  schoolName?: string;
  degreeCourse?: string;
  periodFrom?: string;
  periodTo?: string;
  highestLevelEarned?: string;
  yearGraduated?: number;
  honorsReceived?: string;
}

interface EducationCardProps {
  data: EducationData;
  index?: number;
  className?: string;
}

/**
 * Format year range for display
 */
function formatYearRange(from?: string, to?: string): string {
  if (!from && !to) return '—';
  if (from && to) return `${from} - ${to}`;
  if (from) return `${from} - Present`;
  return to || '—';
}

/**
 * Capitalize and format level name
 */
function formatLevel(level?: string): string {
  if (!level) return '—';
  return level
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * EducationCard component for displaying educational background entries
 *
 * Converts the 7-column Education table to a responsive card:
 * - Mobile: Level + School as summary, collapsible details
 * - Desktop: Grid layout showing all fields
 */
export function EducationCard({ data, index, className }: EducationCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayInfo = {
    primary: data.schoolName || 'Unknown School',
    secondary: formatLevel(data.level),
    tertiary: data.degreeCourse,
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
                {displayInfo.tertiary && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {displayInfo.tertiary}
                  </p>
                )}
              </div>
              {data.yearGraduated && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Graduated</p>
                  <p className="font-semibold tabular-nums text-foreground">
                    {data.yearGraduated}
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
                    label="Level"
                    value={formatLevel(data.level)}
                  />
                  <DataField
                    label="School Name"
                    value={data.schoolName}
                    className="col-span-2"
                  />
                  <DataField
                    label="Degree/Course"
                    value={data.degreeCourse}
                    className="col-span-2"
                  />
                  <DataField
                    label="Period of Attendance"
                    value={formatYearRange(data.periodFrom, data.periodTo)}
                  />
                  <DataField
                    label="Year Graduated"
                    value={data.yearGraduated?.toString()}
                  />
                  <DataField
                    label="Highest Level/Units"
                    value={data.highestLevelEarned}
                  />
                  <DataField
                    label="Honors Received"
                    value={data.honorsReceived}
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
              label="Level"
              value={formatLevel(data.level)}
            />
            <DataField
              label="School Name"
              value={data.schoolName}
              className="col-span-2"
            />
            <DataField
              label="Year Graduated"
              value={data.yearGraduated?.toString()}
            />
            <DataField
              label="Degree/Course"
              value={data.degreeCourse}
              className="col-span-2"
            />
            <DataField
              label="Period of Attendance"
              value={formatYearRange(data.periodFrom, data.periodTo)}
            />
            <DataField
              label="Highest Level/Units"
              value={data.highestLevelEarned}
            />
            <DataField
              label="Honors Received"
              value={data.honorsReceived}
              className="col-span-4"
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
