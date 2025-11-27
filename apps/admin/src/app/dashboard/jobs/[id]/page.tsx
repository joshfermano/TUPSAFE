/**
 * Job Details Page
 *
 * Detailed view of a single job position with:
 * - Position information
 * - Applications table
 * - Status management
 * - Actions (edit, close)
 */

'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Users,
  Edit,
  XCircle,
  MapPin,
  DollarSign,
  FileText,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ApplicationsDataTable,
  EditJobDialog,
} from '@/components/jobs';
import {
  useOpenPositionDetails,
  usePositionApplications,
  useOpenPositions,
} from '@/hooks/useJobsQuery';
import type { UpdateOpenPositionData } from '@tupsafe/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JobDetailsPageProps {
  params: Promise<{ id: string }>;
}

// Status badge configuration
const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  filled: {
    label: 'Filled',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
  },
};

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applicationsFilters, setApplicationsFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all' as const,
  });

  // Fetch position details
  const { data: position, isLoading, isError, error } = useOpenPositionDetails(id);

  // Fetch applications for this position
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = usePositionApplications(id, applicationsFilters);

  // Get mutation functions
  const { updatePosition, isUpdating } = useOpenPositions();

  // Handle actions
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleClosePosition = () => {
    if (!confirm('Are you sure you want to close this position? Applications will no longer be accepted.')) {
      return;
    }

    updatePosition(
      {
        id,
        data: { status: 'closed' },
      },
      {
        onSuccess: () => {
          toast.success('Position closed successfully');
        },
        onError: (error) => {
          toast.error('Failed to close position', {
            description: error.message,
          });
        },
      }
    );
  };

  const handleUpdatePosition = (data: UpdateOpenPositionData) => {
    updatePosition(
      { id, data },
      {
        onSuccess: () => {
          toast.success('Position updated successfully');
          setEditDialogOpen(false);
        },
        onError: (error) => {
          toast.error('Failed to update position', {
            description: error.message,
          });
        },
      }
    );
  };

  const handleViewApplication = (applicationId: string) => {
    router.push(`/dashboard/jobs/${id}/applications/${applicationId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-[200px] bg-muted animate-pulse rounded" />
        <div className="h-[400px] bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Error state
  if (isError || !position) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Position</AlertTitle>
          <AlertDescription>
            {error?.message || 'Position not found or failed to load.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusInfo = statusConfig[position.status as keyof typeof statusConfig];
  const deadline = new Date(position.applicationDeadline);
  const isOverdue = deadline < new Date();
  const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/jobs">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </Link>

      {/* Position Details Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{position.positionTitle}</CardTitle>
                {position.isFeatured && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn('font-medium', statusInfo?.className)}>
                  {statusInfo?.label || position.status}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {position.positionCode}
                </Badge>
                {position.employmentCategory && (
                  <Badge variant="secondary" className="capitalize">
                    {position.employmentCategory.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {position.status === 'open' && (
                <Button variant="destructive" onClick={handleClosePosition}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Close Position
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium">{position.applicationsReceived}</div>
                <div className="text-xs text-muted-foreground">Applications</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium">{position.numberOfOpenings}</div>
                <div className="text-xs text-muted-foreground">Openings</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {format(deadline, 'MMM dd, yyyy')}
                </div>
                <div className={cn(
                  'text-xs',
                  isOverdue ? 'text-red-600 dark:text-red-400' :
                  daysUntil <= 7 ? 'text-orange-600 dark:text-orange-400' :
                  'text-muted-foreground'
                )}>
                  {isOverdue ? 'Overdue' :
                   daysUntil === 0 ? 'Today' :
                   daysUntil === 1 ? 'Tomorrow' :
                   `${daysUntil} days left`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium">{position.department?.name || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">Department</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs for Details */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Position Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {position.description}
                </p>
              </div>

              {position.qualifications && position.qualifications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Qualifications</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {position.qualifications.map((qual, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {qual}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {position.responsibilities && position.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {position.responsibilities.map((resp, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {position.requirements?.education && position.requirements.education.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Education</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {position.requirements.education.map((edu, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {edu}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {position.requirements?.experience && position.requirements.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {position.requirements.experience.map((exp, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {position.requirements?.skills && position.requirements.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {position.requirements.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {position.salaryGrade && (
                  <div>
                    <div className="text-sm font-medium">Salary Grade</div>
                    <div className="text-sm text-muted-foreground">{position.salaryGrade}</div>
                  </div>
                )}

                {(position.salaryRangeMin || position.salaryRangeMax) && (
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Salary Range
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {position.salaryRangeMin && `₱${position.salaryRangeMin.toLocaleString()}`}
                      {position.salaryRangeMin && position.salaryRangeMax && ' - '}
                      {position.salaryRangeMax && `₱${position.salaryRangeMax.toLocaleString()}`}
                    </div>
                  </div>
                )}

                {position.employmentType && (
                  <div>
                    <div className="text-sm font-medium">Employment Type</div>
                    <div className="text-sm text-muted-foreground">{position.employmentType}</div>
                  </div>
                )}

                {position.postedAt && (
                  <div>
                    <div className="text-sm font-medium">Posted</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(position.postedAt), 'PPP')}
                    </div>
                  </div>
                )}

                {position.postedBy && (
                  <div>
                    <div className="text-sm font-medium">Posted By</div>
                    <div className="text-sm text-muted-foreground">
                      {position.postedBy.firstName} {position.postedBy.lastName}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Applications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications
              </CardTitle>
              <CardDescription>
                {applicationsData?.pagination.total || 0} application(s) received
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="text-sm border rounded-md px-3 py-1"
                value={applicationsFilters.status}
                onChange={(e) =>
                  setApplicationsFilters((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                    page: 1,
                  }))
                }
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="for_interview">For Interview</option>
                <option value="interviewed">Interviewed</option>
                <option value="for_final_review">Final Review</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {applicationsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Applications</AlertTitle>
              <AlertDescription>
                Failed to load applications for this position.
              </AlertDescription>
            </Alert>
          ) : (
            <ApplicationsDataTable
              data={applicationsData?.applications || []}
              isLoading={applicationsLoading}
              onViewDetails={handleViewApplication}
            />
          )}

          {/* Pagination */}
          {applicationsData && applicationsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {applicationsData.pagination.page} of {applicationsData.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={applicationsData.pagination.page <= 1}
                  onClick={() =>
                    setApplicationsFilters((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    applicationsData.pagination.page >= applicationsData.pagination.totalPages
                  }
                  onClick={() =>
                    setApplicationsFilters((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditJobDialog
        position={position}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdatePosition}
        isLoading={isUpdating}
      />
    </div>
  );
}
