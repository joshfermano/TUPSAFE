/**
 * User Details Dialog
 *
 * Comprehensive user information display with tabbed interface:
 * - Profile tab: Basic user information
 * - Submissions tab: PDS and SALN submission history
 * - Activity tab: Recent audit logs
 */

'use client';

import { format, isValid, parseISO } from 'date-fns';
import {
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/**
 * Safely format a date value that may be null, undefined, or invalid
 */
function formatDate(
  value: string | Date | null | undefined,
  formatStr: string = 'PPP'
): string {
  if (!value) return 'N/A';

  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDetails } from '@/hooks/useUsers';

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  userId,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const { data: user, isLoading } = useUserDetails(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Comprehensive user information and activity
          </DialogDescription>
        </DialogHeader>

        {isLoading && <LoadingSkeleton />}

        {user && (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Header with badges */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.employeeId || user.applicantId || 'No ID'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={user.email || 'No email'}
                />
                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={user.phoneNumber || 'N/A'}
                />
                <InfoItem
                  icon={Building}
                  label="Department"
                  value={user.department?.name || 'N/A'}
                />
                <InfoItem
                  icon={Briefcase}
                  label="Position"
                  value={user.position?.title || 'N/A'}
                />
                <InfoItem
                  icon={Shield}
                  label="User Type"
                  value={user.userType}
                  className="capitalize"
                />
                <InfoItem
                  icon={CheckCircle2}
                  label="Account Status"
                  value={user.accountStatus}
                  className="capitalize"
                />
              </div>

              <Separator />

              {/* Employment Details */}
              <div>
                <h4 className="font-semibold mb-3">Employment Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    label="Employment Category"
                    value={user.employmentCategory?.replace('_', ' ')}
                    className="capitalize"
                  />
                  <InfoItem
                    label="Academic Rank"
                    value={user.academicRank || 'N/A'}
                  />
                  <InfoItem
                    label="Tenure Status"
                    value={user.tenureStatus || 'N/A'}
                  />
                  <InfoItem
                    label="Employment Type"
                    value={user.employmentType || 'N/A'}
                  />
                  <InfoItem
                    label="Campus Assignment"
                    value={user.campusAssignment || 'N/A'}
                  />
                  <InfoItem
                    label="Hire Date"
                    value={formatDate(user.hireDate)}
                  />
                </div>
              </div>

              <Separator />

              {/* System Information */}
              <div>
                <h4 className="font-semibold mb-3">System Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={Calendar}
                    label="Created"
                    value={formatDate(user.createdAt)}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Last Updated"
                    value={formatDate(user.updatedAt)}
                  />
                  <InfoItem
                    label="Email Verified"
                    value={
                      user.emailVerifiedAt ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {formatDate(user.emailVerifiedAt)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          Not verified
                        </div>
                      )
                    }
                  />
                  <InfoItem
                    label="Temporary Password"
                    value={user.temporaryPassword ? 'Yes' : 'No'}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* PDS Submissions */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">PDS Submissions</h4>
                  <div className="text-3xl font-bold mb-1">
                    {user.pdsSubmissionsCount || 0}
                  </div>
                  {user.lastPdsSubmission && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Last Submission
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {user.lastPdsSubmission.status}
                        </Badge>
                      </div>
                      {user.lastPdsSubmission.submittedAt && (
                        <p className="text-muted-foreground">
                          {formatDate(user.lastPdsSubmission.submittedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* SALN Submissions */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">SALN Submissions</h4>
                  <div className="text-3xl font-bold mb-1">
                    {user.salnSubmissionsCount || 0}
                  </div>
                  {user.lastSalnSubmission && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Last Submission (Year {user.lastSalnSubmission.year})
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {user.lastSalnSubmission.status}
                        </Badge>
                      </div>
                      {user.lastSalnSubmission.submittedAt && (
                        <p className="text-muted-foreground">
                          {formatDate(user.lastSalnSubmission.submittedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              {user.recentAuditLogs && user.recentAuditLogs.length > 0 ? (
                <div className="space-y-2">
                  {user.recentAuditLogs.map(
                    (log: (typeof user.recentAuditLogs)[0]) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(log.createdAt, 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {log.entityType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface InfoItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="h-4 w-4 mt-1 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`text-sm ${className || ''}`}>{value}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
