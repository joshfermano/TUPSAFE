/**
 * Application Review Page
 *
 * Detailed application review with:
 * - Applicant information
 * - Application details
 * - PDS summary preview
 * - Status history timeline
 * - Status update functionality
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Briefcase,
  Calendar,
  MapPin,
  Download,
  ExternalLink,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ApplicationTimeline,
  UpdateStatusDialog,
} from '@/components/jobs';
import { useApplicationDetails, useJobApplications } from '@/hooks/useJobsQuery';
import type { UpdateApplicationStatusData, ApplicationStatus } from '@tupsafe/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApplicationReviewPageProps {
  params: Promise<{ id: string; appId: string }>;
}

// Status badge configuration
const statusConfig: Record<ApplicationStatus, {
  label: string;
  className: string;
}> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200',
  },
  for_interview: {
    label: 'For Interview',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200',
  },
  interviewed: {
    label: 'Interviewed',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200',
  },
  for_final_review: {
    label: 'Final Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  hired: {
    label: 'Hired',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200',
  },
};

export default function ApplicationReviewPage({ params }: ApplicationReviewPageProps) {
  const { id: positionId, appId } = use(params);
  const router = useRouter();

  // State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch application details
  const { data: applicationData, isLoading, isError, error } = useApplicationDetails(appId);

  // Get mutation functions (only need the mutation, not the query)
  const { updateApplicationStatus, isUpdatingStatus, deleteApplication, isDeletingApplication } = useJobApplications({ enableQuery: false });

  // Handle status update
  const handleUpdateStatus = (data: UpdateApplicationStatusData) => {
    updateApplicationStatus(
      { applicationId: appId, data },
      {
        onSuccess: () => {
          toast.success('Application status updated successfully');
          setStatusDialogOpen(false);
        },
        onError: (error) => {
          toast.error('Failed to update status', {
            description: error.message,
          });
        },
      }
    );
  };

  // Handle delete application
  const handleDeleteApplication = () => {
    deleteApplication(appId, {
      onSuccess: () => {
        toast.success('Application deleted successfully');
        setDeleteDialogOpen(false);
        // Navigate back to the position page
        router.push(`/dashboard/jobs/${positionId}`);
      },
      onError: (error) => {
        toast.error('Failed to delete application', {
          description: error.message,
        });
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-[200px] bg-muted animate-pulse rounded" />
        <div className="h-[600px] bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Error state
  if (isError || !applicationData) {
    return (
      <div className="space-y-6">
        <Link href={`/dashboard/jobs/${positionId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Position
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Application</AlertTitle>
          <AlertDescription>
            {error?.message || 'Application not found or failed to load.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Destructure nested data for easier access
  const appDetails = applicationData.application;
  const applicant = applicationData.applicant;
  const position = applicationData.position;
  const pdsData = applicationData.pdsData;
  const statusHistory = applicationData.statusHistory || [];

  const statusInfo = statusConfig[appDetails.status];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href={`/dashboard/jobs/${positionId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Position
        </Button>
      </Link>

      {/* Application Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Review</h1>
          <p className="text-muted-foreground">
            {applicant.firstName} {applicant.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setStatusDialogOpen(true)}>
            Update Status
          </Button>
          {/* Delete button - only shows for withdrawn applications */}
          {appDetails.status === 'withdrawn' && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Application
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the application for{' '}
                    <strong>{applicant.firstName} {applicant.lastName}</strong>{' '}
                    (#{appDetails.applicationNumber}). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeletingApplication}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteApplication}
                    disabled={isDeletingApplication}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletingApplication ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Application Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>Application Summary</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {appDetails.applicationNumber}
              </Badge>
            </div>
            <Badge variant="outline" className={cn('font-medium', statusInfo.className)}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Position</div>
              <div className="text-sm text-muted-foreground">{position.positionTitle}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Application Date</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(appDetails.applicationDate), 'PPP')}
              </div>
            </div>
            {appDetails.reviewedAt && (
              <div>
                <div className="text-sm font-medium">Reviewed Date</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(appDetails.reviewedAt), 'PPP')}
                </div>
              </div>
            )}
            {appDetails.interviewDate && (
              <div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Interview Date
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(appDetails.interviewDate), 'PPP')}
                </div>
              </div>
            )}
          </div>

          {appDetails.coverLetter && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Cover Letter</div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {appDetails.coverLetter}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Applicant Info and Documents */}
      <Tabs defaultValue="applicant" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applicant">Applicant Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Interview Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="applicant" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Full Name</div>
                    <div className="text-sm text-muted-foreground">
                      {applicant.firstName} {applicant.middleName || ''}{' '}
                      {applicant.lastName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">
                      {applicant.email}
                    </div>
                  </div>
                </div>

                {applicant.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                      <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">
                        {applicant.phoneNumber}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {applicant.applicantId && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium">Applicant ID</div>
                    <Badge variant="outline" className="font-mono mt-1">
                      {applicant.applicantId}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* PDS Summary if linked */}
          {pdsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Personal Data Sheet
                </CardTitle>
                <CardDescription>
                  PDS was submitted with this application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">PDS Submission</div>
                      <div className="text-sm text-muted-foreground">
                        Version {pdsData.version}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/submissions/pds/view/${pdsData.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View PDS
                    </Link>
                  </Button>
                </div>

                {/* PDS Preview Data */}
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Education Summary</div>
                  {pdsData.education && pdsData.education.length > 0 ? (
                    <div className="space-y-1">
                      {pdsData.education.slice(0, 3).map((edu, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          • {edu.level}: {edu.schoolName}
                          {edu.degreeCourse && ` - ${edu.degreeCourse}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No education records</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submitted Documents
              </CardTitle>
              <CardDescription>
                Documents uploaded with the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appDetails.resumeUrl && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Resume/CV</div>
                        <div className="text-sm text-muted-foreground">PDF document</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={appDetails.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}

                {appDetails.additionalDocuments && appDetails.additionalDocuments.length > 0 && (
                  <>
                    {appDetails.additionalDocuments.map((docUrl: string, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium">Document {index + 1}</div>
                            <div className="text-sm text-muted-foreground">Additional document</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={docUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {!appDetails.resumeUrl && (!appDetails.additionalDocuments || appDetails.additionalDocuments.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No documents submitted with this application
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview & Review Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {appDetails.interviewLocation && (
                <div className="mb-4">
                  <div className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Interview Location
                  </div>
                  <div className="text-sm text-muted-foreground">{appDetails.interviewLocation}</div>
                </div>
              )}

              {appDetails.interviewNotes && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Interview Notes</div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {appDetails.interviewNotes}
                    </p>
                  </div>
                </div>
              )}

              {appDetails.reviewerNotes && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Reviewer Notes</div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {appDetails.reviewerNotes}
                    </p>
                  </div>
                </div>
              )}

              {appDetails.rejectionReason && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Rejection Reason</div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                      {appDetails.rejectionReason}
                    </p>
                  </div>
                </div>
              )}

              {!appDetails.interviewLocation && !appDetails.interviewNotes && !appDetails.reviewerNotes && !appDetails.rejectionReason && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No interview or review notes recorded yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status History Timeline */}
      <ApplicationTimeline
        timeline={statusHistory}
        isLoading={false}
      />

      {/* Update Status Dialog */}
      {statusDialogOpen && (
        <UpdateStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          application={{
            id: appDetails.id,
            applicationNumber: appDetails.applicationNumber,
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
            positionTitle: position.positionTitle,
            currentStatus: appDetails.status,
          }}
          onSubmit={handleUpdateStatus}
          isLoading={isUpdatingStatus}
        />
      )}
    </div>
  );
}
