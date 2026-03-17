/**
 * Registration Details Dialog
 *
 * Displays comprehensive registration information in a tabbed dialog.
 * Tabs: Profile Information, Review History (if reviewed), Audit Trail
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { User, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRegistrationDetails } from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';
import { capitalize } from '@/lib/formatting-helpers';

interface RegistrationDetailsDialogProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (registration: Registration) => void;
  onReject?: (registration: Registration) => void;
}

export function RegistrationDetailsDialog({
  registration,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: RegistrationDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');

  const { data: details, isLoading } = useRegistrationDetails(
    registration?.id || ''
  );

  const isPending = details?.status === 'pending' || details?.accountStatus === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
          <DialogDescription>
            View comprehensive information about this registration request
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : details ? (
          <ScrollArea className="flex-1 -mx-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="review" disabled={!details.reviewedBy}>
                <Clock className="h-4 w-4 mr-2" />
                Review
              </TabsTrigger>
              <TabsTrigger value="audit">
                <FileText className="h-4 w-4 mr-2" />
                Audit Trail
              </TabsTrigger>
            </TabsList>

            {/* Profile Information Tab */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Status Banner */}
                {(() => {
                  const status = details?.status || details?.accountStatus;
                  const isPending = status === 'pending';
                  const isApproved = details?.status === 'approved' || details?.accountStatus === 'active';
                  
                  return (
                    <div
                      className={`rounded-lg p-4 border ${
                        isPending
                          ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30'
                          : isApproved
                          ? 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30'
                          : 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isPending ? (
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : isApproved ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <div>
                            <div className="font-semibold text-foreground">
                              Status: {capitalize(status, 'Unknown')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested {details?.requestedAt ? formatDistanceToNow(new Date(details.requestedAt), { addSuffix: true }) : 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={details?.userType === 'employee' ? 'default' : 'secondary'}
                          className={
                            details?.userType === 'employee'
                              ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300 border-blue-500/30'
                              : 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/25 dark:text-orange-300 border-orange-500/30'
                          }
                        >
                          {details?.userType === 'employee' ? 'Employee' : 'Applicant'}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}

                {/* Personal Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField label="First Name" value={details?.firstName} />
                  <InfoField label="Middle Name" value={details?.middleName} />
                  <InfoField label="Last Name" value={details?.lastName} />
                  <InfoField label="Email" value={details?.email} />
                  <InfoField label="Phone Number" value={details?.phoneNumber} />
                  <InfoField
                    label={details?.userType === 'employee' ? 'Employee ID' : 'Applicant ID'}
                    value={details?.userType === 'employee' ? details?.employeeId : details?.applicantId}
                  />
                </div>

                <Separator />

                {/* Employment Details */}
                <div>
                  <h4 className="font-semibold mb-3">Employment Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Role" value={capitalize(details?.role, '—')} />
                    <InfoField label="Department" value={details?.department?.name} />
                    <InfoField label="College" value={details?.department?.code?.startsWith('COL') ? details?.department?.name : undefined} />
                    <InfoField label="Position" value={details?.position?.title} />
                    <InfoField label="Academic Rank" value={details?.academicRank} />
                    <InfoField label="Tenure Status" value={details?.tenureStatus} />
                    <InfoField label="Employment Type" value={details?.employmentType} />
                    <InfoField label="Campus Assignment" value={details?.campusAssignment} />
                    <InfoField
                      label="Account Status"
                      value={capitalize(details?.accountStatus, '—')}
                      badge
                    />
                  </div>
                </div>

                <Separator />

                {/* Account Information */}
                <div>
                  <h4 className="font-semibold mb-3">Account Information</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField
                      label="Email Verified"
                      value={details?.emailVerifiedAt ? 'Yes' : 'No'}
                      badge
                    />
                    <InfoField
                      label="Account Active"
                      value={details?.isActive ? 'Yes' : 'No'}
                      badge
                    />
                    <InfoField
                      label="Created At"
                      value={details?.createdAt ? format(new Date(details.createdAt), 'PPpp') : '—'}
                    />
                    <InfoField
                      label="Updated At"
                      value={details?.updatedAt ? format(new Date(details.updatedAt), 'PPpp') : '—'}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Review History Tab */}
            <TabsContent value="review" className="space-y-4 mt-4">
              {details?.reviewedBy ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Reviewed By" value={details.reviewedBy.name} />
                    <InfoField
                      label="Reviewed At"
                      value={
                        details.reviewedAt
                          ? format(new Date(details.reviewedAt), 'PPpp')
                          : 'N/A'
                      }
                    />
                    <InfoField
                      label="Decision"
                      value={capitalize(details?.status || details?.accountStatus, 'N/A')}
                      badge
                    />
                    {details.rejectedAt && (
                      <InfoField
                        label="Rejected At"
                        value={format(new Date(details.rejectedAt), 'PPpp')}
                      />
                    )}
                  </div>

                  {details.adminNotes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Admin Notes</h4>
                        <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                          {details.adminNotes}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No review information available yet. Registration is pending approval.
                </div>
              )}
            </TabsContent>

            {/* Audit Trail Tab */}
            <TabsContent value="audit" className="space-y-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Audit trail functionality coming soon. This will show complete history
                of all actions taken on this registration.
              </div>
            </TabsContent>
          </Tabs>
          </ScrollArea>
        ) : null}

        {/* Action Buttons */}
        {details && isPending && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                if (registration) onReject?.(registration);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                if (registration) onApprove?.(registration);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper component for displaying information fields
function InfoField({
  label,
  value,
  badge = false,
}: {
  label: string;
  value?: string | null;
  badge?: boolean;
}) {
  const displayValue = value || '—';

  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      {badge ? (
        <Badge variant="secondary">{displayValue}</Badge>
      ) : (
        <div className="text-sm">{displayValue}</div>
      )}
    </div>
  );
}
