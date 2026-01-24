'use client';

import { Check, AlertCircle, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SectionStatus = 'complete' | 'incomplete' | 'not_applicable';

interface ValidationBadgeProps {
  status: SectionStatus;
}

/**
 * ValidationBadge component for displaying section validation status
 *
 * Uses semantic Badge variants instead of hard-coded colors
 * for proper light/dark mode support.
 *
 * Statuses:
 * - complete: Green indicator showing the section is fully filled
 * - incomplete: Destructive indicator showing required fields are missing
 * - not_applicable: Muted indicator showing the section is optional and empty
 */
export function ValidationBadge({ status }: ValidationBadgeProps) {
  switch (status) {
    case 'complete':
      return (
        <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          Complete
        </Badge>
      );
    case 'incomplete':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Incomplete
        </Badge>
      );
    case 'not_applicable':
      return (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          N/A
        </Badge>
      );
  }
}

/**
 * Helper function to determine section status based on data
 */
export function getSectionStatus(
  sectionData: unknown,
  isRequired: boolean = false
): SectionStatus {
  if (!sectionData) return isRequired ? 'incomplete' : 'not_applicable';

  if (Array.isArray(sectionData)) {
    if (sectionData.length === 0) return 'not_applicable';
    return 'complete';
  }

  if (typeof sectionData === 'object') {
    const values = Object.values(sectionData as Record<string, unknown>);
    const hasData = values.some(
      (val) => val !== null && val !== undefined && val !== ''
    );
    if (!hasData) return isRequired ? 'incomplete' : 'not_applicable';
    return 'complete';
  }

  return sectionData
    ? 'complete'
    : isRequired
    ? 'incomplete'
    : 'not_applicable';
}
