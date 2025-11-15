'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  User,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Info,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserAvatar } from '@/components/admin/UserAvatar';
import {
  SectionCard,
  SectionCardField,
  SectionCardGrid,
} from '@/components/admin/SectionCard';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import { LoadingCard } from '@/components/admin/LoadingCard';
import { ErrorAlert } from '@/components/admin/ErrorAlert';
import { EmptyState } from '@/components/admin/EmptyState';

import { usePdsSubmissionsQuery } from '@/hooks/usePdsSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  formatAddress,
  formatCitizenship,
  formatCurrency,
  formatDateRange,
  formatYearRange,
  formatBoolean,
  formatHeight,
  formatWeight,
} from '@/lib/formatting-helpers';

/**
 * PDS Submission View Page
 *
 * Comprehensive view page for reviewing PDS submissions in the admin portal.
 *
 * Features:
 * - Complete PDS data display with all sections
 * - Employee information sidebar
 * - Review actions (Approve, Reject, Request Changes)
 * - Breadcrumb navigation
 * - PDF export capability
 * - Responsive layout with glassmorphism effects
 * - Professional shadcn/ui styling with TUP Crimson accents
 */
export default function PdsSubmissionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = params.id as string;

  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);

  const {
    useCompleteSubmission,
    approveSubmissionAsync,
    rejectSubmissionAsync,
    requestChangesAsync,
    isApproving,
    isRejecting,
    isRequestingChanges,
  } = usePdsSubmissionsQuery();

  const {
    data: completeSubmission,
    isLoading,
    error,
    refetch,
  } = useCompleteSubmission(submissionId);

  const isSubmitting = isApproving || isRejecting || isRequestingChanges;

  // Handle approval
  const handleApprove = React.useCallback(
    async (notes?: string) => {
      if (!user?.id) return;

      await approveSubmissionAsync({
        submissionId,
        reviewNotes: notes,
        reviewedBy: user.id,
      });

      toast.success('PDS Approved', {
        description: 'The submission has been approved successfully',
      });
    },
    [submissionId, user?.id, approveSubmissionAsync]
  );

  // Handle rejection
  const handleReject = React.useCallback(
    async (notes: string) => {
      if (!user?.id) return;

      await rejectSubmissionAsync({
        submissionId,
        reviewNotes: notes,
        reviewedBy: user.id,
      });

      toast.success('PDS Rejected', {
        description: 'The submission has been rejected',
      });
    },
    [submissionId, user?.id, rejectSubmissionAsync]
  );

  // Handle request changes
  const handleRequestChanges = React.useCallback(
    async (notes: string) => {
      if (!user?.id) return;

      await requestChangesAsync({
        submissionId,
        reviewNotes: notes,
        reviewedBy: user.id,
      });

      toast.success('Changes Requested', {
        description: 'The employee will be notified to revise their submission',
      });
    },
    [submissionId, user?.id, requestChangesAsync]
  );

  // Handle PDF export
  const handleExportPdf = React.useCallback(() => {
    toast.info('PDF Export', {
      description: 'PDF export functionality will be implemented soon',
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <LoadingCard count={1} className="h-24" />
          <LoadingCard count={3} className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <ErrorAlert error={error} retry={() => refetch()} />
      </div>
    );
  }

  // Not found state
  if (!completeSubmission) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <EmptyState
          icon={User}
          title="Submission Not Found"
          description="The PDS submission you're looking for doesn't exist or has been removed."
          action={{
            label: 'Back to Submissions',
            onClick: () => router.push('/dashboard/submissions/pds'),
          }}
        />
      </div>
    );
  }

  const { submission, user: submissionUser, department, position } = completeSubmission;
  const canReview = submission.status === 'submitted' || submission.status === 'reviewing';

  return (
    <>
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/submissions/pds">
                PDS Submissions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>View Submission</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/submissions/pds')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">PDS Submission Review</h1>
              </div>
              <p className="text-muted-foreground">
                Submitted on {format(new Date(submission.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={submission.status} />
              {canReview && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="gap-2 bg-tup-primary hover:bg-tup-primary/90"
                  >
                    Review Submission
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Layout - Two Column Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Personal Information Section */}
            <SectionCard title="Personal Information" icon={<User className="h-5 w-5" />}>
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Basic Information
                  </h4>
                  <SectionCardGrid columns={3}>
                    <SectionCardField
                      label="Surname"
                      value={completeSubmission.personalInfo?.surname}
                    />
                    <SectionCardField
                      label="First Name"
                      value={completeSubmission.personalInfo?.firstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={completeSubmission.personalInfo?.middleName}
                    />
                    <SectionCardField
                      label="Name Extension"
                      value={completeSubmission.personalInfo?.nameExtension}
                    />
                    <SectionCardField
                      label="Date of Birth"
                      value={
                        completeSubmission.personalInfo?.dateOfBirth
                          ? format(
                              new Date(completeSubmission.personalInfo.dateOfBirth),
                              'MMMM d, yyyy'
                            )
                          : null
                      }
                    />
                    <SectionCardField
                      label="Place of Birth"
                      value={completeSubmission.personalInfo?.placeOfBirth}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Address & Contact
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Residential Address"
                      value={formatAddress(completeSubmission.personalInfo?.residentialAddress)}
                    />
                    <SectionCardField
                      label="Permanent Address"
                      value={formatAddress(completeSubmission.personalInfo?.permanentAddress)}
                    />
                    <SectionCardField
                      label="Telephone Number"
                      value={completeSubmission.personalInfo?.telephoneNo}
                    />
                    <SectionCardField
                      label="Mobile Number"
                      value={completeSubmission.personalInfo?.mobileNo}
                    />
                    <SectionCardField
                      label="Email Address"
                      value={completeSubmission.personalInfo?.emailAddress}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Civil Status & Citizenship */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Civil Status & Citizenship
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Civil Status"
                      value={completeSubmission.personalInfo?.civilStatus}
                    />
                    <SectionCardField
                      label="Citizenship"
                      value={formatCitizenship(completeSubmission.personalInfo?.citizenship)}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Additional Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Additional Information
                  </h4>
                  <SectionCardGrid columns={4}>
                    <SectionCardField
                      label="Height"
                      value={formatHeight(completeSubmission.personalInfo?.heightM)}
                    />
                    <SectionCardField
                      label="Weight"
                      value={formatWeight(completeSubmission.personalInfo?.weightKg)}
                    />
                    <SectionCardField
                      label="Blood Type"
                      value={completeSubmission.personalInfo?.bloodType}
                    />
                    <SectionCardField
                      label="Sex"
                      value={completeSubmission.personalInfo?.sex}
                    />
                    <SectionCardField
                      label="GSIS ID No."
                      value={completeSubmission.personalInfo?.gsisNo}
                    />
                    <SectionCardField
                      label="PAG-IBIG ID No."
                      value={completeSubmission.personalInfo?.pagibigNo}
                    />
                    <SectionCardField
                      label="PhilHealth No."
                      value={completeSubmission.personalInfo?.philhealthNo}
                    />
                    <SectionCardField
                      label="SSS No."
                      value={completeSubmission.personalInfo?.sssNo}
                    />
                    <SectionCardField
                      label="TIN"
                      value={completeSubmission.personalInfo?.tinNo}
                    />
                    <SectionCardField
                      label="Agency Employee No."
                      value={completeSubmission.personalInfo?.agencyEmployeeNo}
                    />
                  </SectionCardGrid>
                </div>
              </div>
            </SectionCard>

            {/* Family Background */}
            <SectionCard title="Family Background" icon={<Users className="h-5 w-5" />}>
              <div className="space-y-6">
                {/* Spouse Information */}
                {completeSubmission.familyBackground?.spouseSurname && (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Spouse Information
                      </h4>
                      <SectionCardGrid columns={2}>
                        <SectionCardField
                          label="Surname"
                          value={completeSubmission.familyBackground.spouseSurname}
                        />
                        <SectionCardField
                          label="First Name"
                          value={completeSubmission.familyBackground.spouseFirstName}
                        />
                        <SectionCardField
                          label="Middle Name"
                          value={completeSubmission.familyBackground.spouseMiddleName}
                        />
                        <SectionCardField
                          label="Occupation"
                          value={completeSubmission.familyBackground.spouseOccupation}
                        />
                        <SectionCardField
                          label="Employer/Business"
                          value={completeSubmission.familyBackground.spouseEmployer}
                        />
                        <SectionCardField
                          label="Business Address"
                          value={completeSubmission.familyBackground.spouseBusinessAddress}
                        />
                      </SectionCardGrid>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Father Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Father Information
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Surname"
                      value={completeSubmission.familyBackground?.fatherSurname}
                    />
                    <SectionCardField
                      label="First Name"
                      value={completeSubmission.familyBackground?.fatherFirstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={completeSubmission.familyBackground?.fatherMiddleName}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Mother Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Mother Information
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Maiden Surname"
                      value={completeSubmission.familyBackground?.motherMaidenSurname}
                    />
                    <SectionCardField
                      label="First Name"
                      value={completeSubmission.familyBackground?.motherFirstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={completeSubmission.familyBackground?.motherMiddleName}
                    />
                  </SectionCardGrid>
                </div>

                {/* Children */}
                {completeSubmission.children && completeSubmission.children.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Children
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Date of Birth</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completeSubmission.children.map((child: { fullName: string; dateOfBirth: string }, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{child.fullName}</TableCell>
                              <TableCell>
                                {format(new Date(child.dateOfBirth), 'MMMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>

            {/* Educational Background */}
            <SectionCard
              title="Educational Background"
              icon={<GraduationCap className="h-5 w-5" />}
            >
              {completeSubmission.education && completeSubmission.education.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Degree/Course</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Highest Level/Units</TableHead>
                      <TableHead>Year Graduated</TableHead>
                      <TableHead>Honors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeSubmission.education.map((edu: { level: string; schoolName: string; degreeCourse: string | null; periodFrom: string | null; periodTo: string | null; highestLevelEarned: string | null; yearGraduated: number | null; honorsReceived: string | null }, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="capitalize">{edu.level}</TableCell>
                        <TableCell>{edu.schoolName}</TableCell>
                        <TableCell>{edu.degreeCourse || '-'}</TableCell>
                        <TableCell>
                          {formatYearRange(edu.periodFrom, edu.periodTo)}
                        </TableCell>
                        <TableCell>{edu.highestLevelEarned || '-'}</TableCell>
                        <TableCell>{edu.yearGraduated || '-'}</TableCell>
                        <TableCell>{edu.honorsReceived || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No educational background provided
                </p>
              )}
            </SectionCard>

            {/* Civil Service Eligibility */}
            <SectionCard title="Civil Service Eligibility" icon={<Award className="h-5 w-5" />}>
              {completeSubmission.civilService &&
              completeSubmission.civilService.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eligibility Name</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Date of Exam</TableHead>
                      <TableHead>Place of Exam</TableHead>
                      <TableHead>License No.</TableHead>
                      <TableHead>License Validity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeSubmission.civilService.map((exam: { eligibilityName: string; rating: string | null; dateOfExam: string | null; placeOfExam: string | null; licenseNo: string | null; licenseValidityDate: string | null }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{exam.eligibilityName}</TableCell>
                        <TableCell>{exam.rating || '-'}</TableCell>
                        <TableCell>
                          {exam.dateOfExam
                            ? format(new Date(exam.dateOfExam), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{exam.placeOfExam || '-'}</TableCell>
                        <TableCell>{exam.licenseNo || '-'}</TableCell>
                        <TableCell>
                          {exam.licenseValidityDate
                            ? format(new Date(exam.licenseValidityDate), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No civil service eligibility provided
                </p>
              )}
            </SectionCard>

            {/* Work Experience */}
            <SectionCard title="Work Experience" icon={<Briefcase className="h-5 w-5" />}>
              {completeSubmission.workExperience &&
              completeSubmission.workExperience.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Department/Agency</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Salary Grade</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gov&apos;t Service</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeSubmission.workExperience.map((work: { positionTitle: string; departmentAgency: string; monthlySalary: string | null; salaryGrade: string | null; dateFrom: string | null; dateTo: string | null; isGovernment: boolean | null }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{work.positionTitle}</TableCell>
                        <TableCell>{work.departmentAgency}</TableCell>
                        <TableCell>
                          {formatCurrency(work.monthlySalary)}
                        </TableCell>
                        <TableCell>{work.salaryGrade || '-'}</TableCell>
                        <TableCell>
                          {formatDateRange(work.dateFrom, work.dateTo)}
                        </TableCell>
                        <TableCell>{formatBoolean(work.isGovernment)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No work experience provided
                </p>
              )}
            </SectionCard>

            {/* Voluntary Work */}
            <SectionCard title="Voluntary Work" icon={<Heart className="h-5 w-5" />}>
              {completeSubmission.voluntaryWork &&
              completeSubmission.voluntaryWork.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Position/Nature</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeSubmission.voluntaryWork.map((work: { organizationName: string; organizationAddress: string | null; positionNature: string | null; dateFrom: string | null; dateTo: string | null; numberOfHours: number | null }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{work.organizationName}</TableCell>
                        <TableCell>{work.organizationAddress || '-'}</TableCell>
                        <TableCell>{work.positionNature || '-'}</TableCell>
                        <TableCell>
                          {formatDateRange(work.dateFrom, work.dateTo)}
                        </TableCell>
                        <TableCell>{work.numberOfHours || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No voluntary work provided
                </p>
              )}
            </SectionCard>

            {/* Learning & Development */}
            <SectionCard
              title="Learning & Development"
              icon={<BookOpen className="h-5 w-5" />}
            >
              {completeSubmission.training && completeSubmission.training.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Title</TableHead>
                      <TableHead>Type of LD</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Conducted By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeSubmission.training.map((training: { title: string; typeOfLd: string | null; hours: number | null; dateFrom: string | null; dateTo: string | null; conductedBy: string | null }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{training.title}</TableCell>
                        <TableCell>{training.typeOfLd || '-'}</TableCell>
                        <TableCell>{training.hours || '-'}</TableCell>
                        <TableCell>
                          {training.dateFrom && training.dateTo
                            ? `${format(new Date(training.dateFrom), 'MMM dd, yyyy')} - ${format(new Date(training.dateTo), 'MMM dd, yyyy')}`
                            : '-'}
                        </TableCell>
                        <TableCell>{training.conductedBy || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No training or development programs provided
                </p>
              )}
            </SectionCard>

            {/* Other Information */}
            <SectionCard title="Other Information" icon={<Info className="h-5 w-5" />}>
              <div className="space-y-4">
                <SectionCardField
                  label="Special Skills & Hobbies"
                  value={
                    completeSubmission.otherInfo?.skills && completeSubmission.otherInfo.skills.length > 0
                      ? completeSubmission.otherInfo.skills.join(', ')
                      : null
                  }
                />
                <SectionCardField
                  label="Non-Academic Distinctions & Recognition"
                  value={
                    completeSubmission.otherInfo?.recognitions && completeSubmission.otherInfo.recognitions.length > 0
                      ? completeSubmission.otherInfo.recognitions
                          .map((r: { title: string; year: string; organization: string }) => `${r.title} (${r.year}) - ${r.organization}`)
                          .join(' | ')
                      : null
                  }
                />
                <SectionCardField
                  label="Membership in Organizations"
                  value={
                    completeSubmission.otherInfo?.associations && completeSubmission.otherInfo.associations.length > 0
                      ? completeSubmission.otherInfo.associations
                          .map((a: { name: string; position?: string }) => `${a.name}${a.position ? ` (${a.position})` : ''}`)
                          .join(' | ')
                      : null
                  }
                />
              </div>
            </SectionCard>
          </div>

          {/* Sidebar - Employee Info */}
          <div className="space-y-6">
            <Card className="sticky top-6 gradient-card-subtle backdrop-blur-sm border-primary-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center space-y-3">
                  {submissionUser && (
                    <UserAvatar user={submissionUser} size="lg" className="h-20 w-20" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {submissionUser?.firstName} {submissionUser?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {submissionUser?.employeeId}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Department</dt>
                    <dd className="font-medium">{department?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Position</dt>
                    <dd className="font-medium">{position?.title || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <StatusBadge status={submission.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="font-medium">
                      {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
                    </dd>
                  </div>
                  {submission.updatedAt && (
                    <div>
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd className="font-medium">
                        {format(new Date(submission.updatedAt), 'MMM d, yyyy h:mm a')}
                      </dd>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {canReview && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Button
                        onClick={() => setIsReviewDialogOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Review Submission
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExportPdf}
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        submissionId={submissionId}
        submissionType="pds"
        currentStatus={submission.status}
        employeeName={`${submissionUser?.firstName} ${submissionUser?.lastName}`}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
