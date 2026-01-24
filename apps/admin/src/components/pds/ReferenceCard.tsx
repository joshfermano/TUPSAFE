'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataField } from '@/components/shared';
import { cn } from '@/lib/utils';

interface ReferenceData {
  name?: string;
  address?: string;
  telephoneNo?: string;
}

interface ReferenceCardProps {
  data: ReferenceData;
  index?: number;
  className?: string;
}

/**
 * ReferenceCard component for displaying reference entries
 *
 * Converts the 3-column References table to a responsive card:
 * - Mobile: Stacked layout
 * - Desktop: Inline/grid layout showing all fields
 */
export function ReferenceCard({ data, index, className }: ReferenceCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {index !== undefined && (
            <span className="mb-2 inline-block text-xs font-medium text-muted-foreground">
              #{index + 1}
            </span>
          )}
          <dl className="space-y-3">
            <DataField label="Name" value={data.name} />
            <DataField label="Address" value={data.address} />
            <DataField label="Telephone No." value={data.telephoneNo} />
          </dl>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          {index !== undefined && (
            <span className="mb-2 inline-block text-xs font-medium text-muted-foreground">
              #{index + 1}
            </span>
          )}
          <dl className="flex flex-wrap items-start gap-x-8 gap-y-4">
            <DataField
              label="Name"
              value={data.name}
              className="min-w-[180px] flex-1"
            />
            <DataField
              label="Address"
              value={data.address}
              className="min-w-[200px] flex-[2]"
            />
            <DataField
              label="Telephone No."
              value={data.telephoneNo}
              className="min-w-[140px]"
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
