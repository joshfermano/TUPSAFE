/**
 * Registration Details Dialog
 *
 * Displays comprehensive registration information in a tabbed dialog.
 * Tabs: Profile Information, Review History (if reviewed), Audit Trail
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { X, User, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
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
import { useRegistrationDetails } from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';

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

  const isPending = details?.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                <div
                  className={`rounded-lg p-4 ${
                    details.status === 'pending'
                      ? 'bg-blue-50 border border-blue-200'
                      : details.status === 'approved'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {details.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-blue-600" />
                      ) : details.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-semibold">
                          Status: {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested {formatDistanceToNow(new Date(details.requestedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={details.userType === 'employee' ? 'default' : 'secondary'}
                      className={
                        details.userType === 'employee'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {details.userType === 'employee' ? 'Employee' : 'Applicant'}
                    </Badge>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField label="First Name" value={details.firstName} />
                  <InfoField label="Middle Name" value={details.middleName} />
                  <InfoField label="Last Name" value={details.lastName} />
                  <InfoField label="Email" value={details.email} />
                  <InfoField label="Phone Number" value={details.phoneNumber} />
                  <InfoField
                    label={details.userType === 'employee' ? 'Employee ID' : 'Applicant ID'}
                    value={details.userType === 'employee' ? details.employeeId : details.applicantId}
                  />
                </div>

                <Separator />

                {/* Employment Details */}
                <div>
                  <h4 className="font-semibold mb-3">Employment Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Role" value={details.role} />
                    <InfoField label="Department" value={details.department?.name} />
                    <InfoField label="Position" value={details.position?.title} />
                    <InfoField label="Academic Rank" value={details.academicRank} />
                    <InfoField label="Tenure Status" value={details.tenureStatus} />
                    <InfoField label="Employment Type" value={details.employmentType} />
                    <InfoField label="Campus Assignment" value={details.campusAssignment} />
                    <InfoField
                      label="Account Status"
                      value={details.accountStatus}
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
                      value={details.emailVerifiedAt ? 'Yes' : 'No'}
                      badge
                    />
                    <InfoField
                      label="Account Active"
                      value={details.isActive ? 'Yes' : 'No'}
                      badge
                    />
                    <InfoField
                      label="Created At"
                      value={format(new Date(details.createdAt), 'PPpp')}
                    />
                    <InfoField
                      label="Updated At"
                      value={format(new Date(details.updatedAt), 'PPpp')}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Review History Tab */}
            <TabsContent value="review" className="space-y-4 mt-4">
              {details.reviewedBy && (
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
                      value={details.status}
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
