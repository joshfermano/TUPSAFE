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
import { DataField } from './DataField';
import { cn } from '@/lib/utils';

type PropertyType = 'real' | 'personal' | 'liability' | 'business' | 'relative';

interface PropertyCardProps {
  type: PropertyType;
  data: Record<string, unknown>;
  index?: number;
  className?: string;
}

/**
 * Format currency values in PHP format
 */
function formatCurrency(value: unknown): string {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) return '—';

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Safely get string value from data
 */
function getString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * PropertyCard component for displaying SALN property entries
 *
 * Renders different layouts based on property type:
 * - Real Properties: 8 fields in 4-column grid (desktop)
 * - Personal Properties: 3 fields inline
 * - Liabilities: 3 fields inline
 * - Business Interests: 4 fields in 2-column grid
 * - Relatives in Government: 4 fields in 2-column grid
 *
 * Mobile: Compact card with collapsible details
 * Desktop: Full grid layout showing all fields
 */
export function PropertyCard({ type, data, index, className }: PropertyCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Get display info based on property type
  const displayInfo = React.useMemo(() => {
    switch (type) {
      case 'real':
        return {
          primary: getString(data.description) || 'Untitled Property',
          secondary: getString(data.kind) || getString(data.exactLocation),
          amount: formatCurrency(data.currentFairMarketValue || data.assessedValue),
          amountLabel: 'Fair Market Value',
        };
      case 'personal':
        return {
          primary: getString(data.description) || 'Untitled Property',
          secondary: data.yearAcquired ? `Acquired: ${data.yearAcquired}` : '',
          amount: formatCurrency(data.acquisitionCost),
          amountLabel: 'Acquisition Cost',
        };
      case 'liability':
        return {
          primary: getString(data.nature) || 'Untitled Liability',
          secondary: getString(data.nameOfCreditors),
          amount: formatCurrency(data.outstandingBalance),
          amountLabel: 'Outstanding Balance',
        };
      case 'business':
        return {
          primary: getString(data.entityName) || 'Untitled Business',
          secondary: getString(data.natureOfBusiness),
          amount: null,
          amountLabel: null,
        };
      case 'relative':
        return {
          primary: getString(data.name) || 'Unnamed Relative',
          secondary: getString(data.relationship),
          amount: null,
          amountLabel: null,
        };
      default:
        return {
          primary: 'Unknown Entry',
          secondary: '',
          amount: null,
          amountLabel: null,
        };
    }
  }, [type, data]);

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
              </div>
              {displayInfo.amount && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{displayInfo.amountLabel}</p>
                  <p className="font-semibold tabular-nums text-foreground">
                    {displayInfo.amount}
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
              <div className="border-t border-border/50 bg-muted/30 p-4">
                {renderMobileDetails(type, data)}
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
          {renderDesktopLayout(type, data)}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Render mobile details based on property type
 */
function renderMobileDetails(type: PropertyType, data: Record<string, unknown>) {
  switch (type) {
    case 'real':
      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Description" value={getString(data.description)} className="col-span-2" />
          <DataField label="Kind" value={getString(data.kind)} />
          <DataField label="Exact Location" value={getString(data.exactLocation)} />
          <DataField
            label="Assessed Value"
            value={<span className="tabular-nums">{formatCurrency(data.assessedValue)}</span>}
          />
          <DataField
            label="Fair Market Value"
            value={<span className="tabular-nums">{formatCurrency(data.currentFairMarketValue)}</span>}
          />
          <DataField
            label="Acquisition Cost"
            value={<span className="tabular-nums">{formatCurrency(data.acquisitionCost)}</span>}
          />
          <DataField label="Acquisition Year" value={getString(data.acquisitionYear)} />
          <DataField label="Acquisition Mode" value={getString(data.acquisitionMode)} className="col-span-2" />
        </dl>
      );

    case 'personal':
      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Description" value={getString(data.description)} className="col-span-2" />
          <DataField label="Year Acquired" value={getString(data.yearAcquired)} />
          <DataField
            label="Acquisition Cost"
            value={<span className="tabular-nums">{formatCurrency(data.acquisitionCost)}</span>}
          />
        </dl>
      );

    case 'liability':
      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Nature" value={getString(data.nature)} className="col-span-2" />
          <DataField label="Name of Creditors" value={getString(data.nameOfCreditors)} className="col-span-2" />
          <DataField
            label="Outstanding Balance"
            value={<span className="tabular-nums">{formatCurrency(data.outstandingBalance)}</span>}
            className="col-span-2"
          />
        </dl>
      );

    case 'business':
      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Entity Name" value={getString(data.entityName)} className="col-span-2" />
          <DataField label="Business Address" value={getString(data.businessAddress)} className="col-span-2" />
          <DataField label="Nature of Business" value={getString(data.natureOfBusiness)} />
          <DataField label="Date of Acquisition" value={getString(data.dateOfAcquisition)} />
        </dl>
      );

    case 'relative':
      return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <DataField label="Name" value={getString(data.name)} className="col-span-2" />
          <DataField label="Relationship" value={getString(data.relationship)} />
          <DataField label="Position" value={getString(data.position)} />
          <DataField label="Agency/Office Address" value={getString(data.agencyOfficeAddress)} className="col-span-2" />
        </dl>
      );

    default:
      return null;
  }
}

/**
 * Render desktop layout based on property type
 */
function renderDesktopLayout(type: PropertyType, data: Record<string, unknown>) {
  switch (type) {
    case 'real':
      // 8 fields in 4-column grid
      return (
        <dl className="grid grid-cols-4 gap-x-6 gap-y-4">
          <DataField label="Description" value={getString(data.description)} className="col-span-2" />
          <DataField label="Kind" value={getString(data.kind)} />
          <DataField label="Exact Location" value={getString(data.exactLocation)} />
          <DataField
            label="Assessed Value"
            value={<span className="tabular-nums">{formatCurrency(data.assessedValue)}</span>}
          />
          <DataField
            label="Current Fair Market Value"
            value={<span className="tabular-nums">{formatCurrency(data.currentFairMarketValue)}</span>}
          />
          <DataField
            label="Acquisition Cost"
            value={<span className="tabular-nums">{formatCurrency(data.acquisitionCost)}</span>}
          />
          <DataField label="Acquisition Year" value={getString(data.acquisitionYear)} />
          <DataField label="Acquisition Mode" value={getString(data.acquisitionMode)} className="col-span-4" />
        </dl>
      );

    case 'personal':
      // 3 fields inline
      return (
        <dl className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <DataField label="Description" value={getString(data.description)} className="min-w-[200px] flex-1" />
          <DataField label="Year Acquired" value={getString(data.yearAcquired)} />
          <DataField
            label="Acquisition Cost"
            value={<span className="tabular-nums">{formatCurrency(data.acquisitionCost)}</span>}
          />
        </dl>
      );

    case 'liability':
      // 3 fields inline
      return (
        <dl className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <DataField label="Nature" value={getString(data.nature)} className="min-w-[150px] flex-1" />
          <DataField label="Name of Creditors" value={getString(data.nameOfCreditors)} className="min-w-[150px] flex-1" />
          <DataField
            label="Outstanding Balance"
            value={<span className="tabular-nums">{formatCurrency(data.outstandingBalance)}</span>}
          />
        </dl>
      );

    case 'business':
      // 4 fields in 2-column grid
      return (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <DataField label="Entity Name" value={getString(data.entityName)} />
          <DataField label="Nature of Business" value={getString(data.natureOfBusiness)} />
          <DataField label="Business Address" value={getString(data.businessAddress)} />
          <DataField label="Date of Acquisition" value={getString(data.dateOfAcquisition)} />
        </dl>
      );

    case 'relative':
      // 4 fields in 2-column grid
      return (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <DataField label="Name" value={getString(data.name)} />
          <DataField label="Relationship" value={getString(data.relationship)} />
          <DataField label="Position" value={getString(data.position)} />
          <DataField label="Agency/Office Address" value={getString(data.agencyOfficeAddress)} />
        </dl>
      );

    default:
      return null;
  }
}
