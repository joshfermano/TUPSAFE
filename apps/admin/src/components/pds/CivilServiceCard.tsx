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

interface CivilServiceData {
  id?: string;
  careerService?: string;
  rating?: number | null;
  dateOfExamination?: string;
  placeOfExamination?: string;
  licenseNumber?: string;
  validity?: string;
  attachments?: AttachmentData[];
}

interface CivilServiceCardProps {
  data: CivilServiceData;
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
 * CivilServiceCard component for displaying civil service eligibility entries
 *
 * Converts the Civil Service Eligibility section to a responsive card:
 * - Mobile: Career Service as summary, collapsible details
 * - Desktop: Grid layout showing all fields
 * - Includes attachment display
 */
export function CivilServiceCard({
  data,
  index,
  className,
}: CivilServiceCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const displayInfo = {
    primary: data.careerService || 'Unknown Eligibility',
    rating: data.rating ? `${data.rating.toFixed(2)}%` : null,
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
                {data.dateOfExamination && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(data.dateOfExamination)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {displayInfo.rating && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {displayInfo.rating}
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
                    label="Career Service/Examination"
                    value={data.careerService}
                    className="col-span-2"
                  />
                  <DataField
                    label="Rating"
                    value={displayInfo.rating}
                  />
                  <DataField
                    label="Date of Examination"
                    value={formatDate(data.dateOfExamination)}
                  />
                  <DataField
                    label="Place of Examination"
                    value={data.placeOfExamination}
                    className="col-span-2"
                  />
                  <DataField label="License Number" value={data.licenseNumber} />
                  <DataField
                    label="Date of Validity"
                    value={formatDate(data.validity)}
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
          <dl className="grid grid-cols-3 gap-x-6 gap-y-4">
            <DataField
              label="Career Service/Examination"
              value={data.careerService}
              className="col-span-3"
            />
            <DataField
              label="Rating"
              value={displayInfo.rating}
            />
            <DataField
              label="Date of Examination"
              value={formatDate(data.dateOfExamination)}
            />
            <DataField
              label="Place of Examination"
              value={data.placeOfExamination}
            />
            <DataField label="License Number" value={data.licenseNumber} />
            <DataField
              label="Date of Validity"
              value={formatDate(data.validity)}
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
