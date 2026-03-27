'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  User,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Info,
  FileText,
  HelpCircle,
  UserCheck,
  Printer,
  XCircle,
  CheckCircle,
  Loader2,
  Paperclip,
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
import { Badge } from '@/components/ui/badge';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserAvatar } from '@/components/admin/UserAvatar';
import {
  SectionCardField,
  SectionCardGrid,
} from '@/components/admin/SectionCard';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import { LoadingCard } from '@/components/admin/LoadingCard';
import { ErrorAlert } from '@/components/admin/ErrorAlert';
import { EmptyState } from '@/components/admin/EmptyState';

import {
  DataSection,
  ValidationBadge,
  getSectionStatus,
} from '@/components/shared';
import {
  EducationCard,
  WorkExperienceCard,
  VoluntaryWorkCard,
  ReferenceCard,
  ChildCard,
  QuestionItem,
  QuestionList,
  CivilServiceCard,
  TrainingCard,
} from '@/components/pds';

import { usePdsSubmissionsQuery } from '@/hooks/usePdsSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { usePDSPdf, transformPdsForPdf } from '@/hooks/usePDSPdf';
import {
  formatAddress,
  formatCitizenship,
  formatHeight,
  formatWeight,
  capitalize,
} from '@/lib/formatting-helpers';
import type { PDSSubmissionDetail } from '@tupsafe/types';

/**
 * PDS Submission View Page - Enhanced with Full CSC Format Sections
 *
 * Comprehensive view page for reviewing PDS submissions in the admin portal.
 * Features complete CSC format with all 10 sections, validation indicators,
 * and collapsible sections for better organization.
 *
 * Features:
 * - Complete PDS data display with all CSC sections
 * - Collapsible DataSection components for easy navigation
 * - Validation indicators (complete/incomplete)
 * - Employee information sidebar
 * - Review actions (Approve, Reject, Request Changes)
 * - Breadcrumb navigation
 * - PDF export capability
 * - Responsive layout with clean modern design
 * - Professional shadcn/ui styling with TUP Crimson accents
 */
export default function PdsSubmissionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = params.id as string;

  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);
  const [reviewAction, setReviewAction] = React.useState<'approve' | 'reject'>(
    'approve'
  );

  const {
    useCompleteSubmission,
    approveSubmissionAsync,
    rejectSubmissionAsync,
    isApproving,
    isRejecting,
  } = usePdsSubmissionsQuery();

  const {
    data: completeSubmission,
    isLoading,
    error,
    refetch,
  } = useCompleteSubmission(submissionId);

  const isSubmitting = isApproving || isRejecting;

  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  const pdfReadyData = React.useMemo(() => {
    if (!completeSubmission) return null;
    return transformPdsForPdf({
      ...completeSubmission.pdsData,
      id: completeSubmission.submission.id,
      submittedAt: completeSubmission.submission.submittedAt,
      version: completeSubmission.submission.version,
    });
  }, [completeSubmission]);

  // UI view-model adapter: converts canonical flat pdsData fields to nested format for display
  // This is display-only; PDF export uses the canonical pdsData directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewPdsData = React.useMemo((): any => {
    if (!completeSubmission?.pdsData) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pd = completeSubmission.pdsData as any;
    return {
      personalInfo: pd.personalInfo
        ? {
            ...pd.personalInfo,
            // Map heightM/weightKg to height/weight for display helpers
            height: pd.personalInfo.heightM
              ? parseFloat(pd.personalInfo.heightM as string)
              : undefined,
            weight: pd.personalInfo.weightKg
              ? parseFloat(pd.personalInfo.weightKg as string)
              : undefined,
          }
        : null,
      // Convert flat familyBackground to nested for display
      familyBackground: pd.familyBackground
        ? {
            spouse: {
              surname: pd.familyBackground.spouseSurname,
              firstName: pd.familyBackground.spouseFirstName,
              middleName: pd.familyBackground.spouseMiddleName,
              nameExtension: pd.familyBackground.spouseNameExtension,
              occupation: pd.familyBackground.spouseOccupation,
              employer: pd.familyBackground.spouseEmployer,
              businessAddress: pd.familyBackground.spouseBusinessAddress,
              telephoneNo: pd.familyBackground.spouseTelephoneNo,
            },
            father: {
              surname: pd.familyBackground.fatherSurname,
              firstName: pd.familyBackground.fatherFirstName,
              middleName: pd.familyBackground.fatherMiddleName,
              nameExtension: pd.familyBackground.fatherNameExtension,
            },
            mother: {
              maidenName: pd.familyBackground.motherMaidenSurname,
              firstName: pd.familyBackground.motherFirstName,
              middleName: pd.familyBackground.motherMiddleName,
            },
          }
        : null,
      children: pd.children,
      education: pd.education,
      // Map canonical civilService fields to view fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      civilService: pd.civilService?.map((cs: any) => ({
        id: cs.id,
        careerService: cs.eligibilityName,
        rating: cs.rating ? parseFloat(cs.rating as string) : null,
        dateOfExamination: cs.dateOfExam,
        placeOfExamination: cs.placeOfExam,
        licenseNumber: cs.licenseNo,
        validity: cs.licenseValidityDate,
        attachments: cs.attachments,
      })),
      // Map canonical workExperience fields to view fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workExperience: pd.workExperience?.map((we: any) => ({
        id: we.id,
        positionTitle: we.positionTitle,
        department: we.departmentAgency,
        monthlySalary: we.monthlySalary
          ? parseFloat(we.monthlySalary as string)
          : null,
        salaryGrade: we.salaryGrade,
        statusOfAppointment: we.statusOfAppointment,
        govService: we.isGovernment,
        periodFrom: we.dateFrom,
        periodTo: we.dateTo,
      })),
      // Map canonical voluntaryWork fields to view fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      voluntaryWork: pd.voluntaryWork?.map((vw: any) => ({
        id: vw.id,
        organizationName: vw.organizationName,
        organizationAddress: vw.organizationAddress,
        positionNature: vw.positionNature,
        dateFrom: vw.dateFrom,
        dateTo: vw.dateTo,
        numberOfHours: vw.numberOfHours,
      })),
      training: pd.training,
      // Map canonical otherInfo fields to view fields
      otherInfo: pd.otherInfo
        ? {
            skills: pd.otherInfo.skills as string[] | undefined,
            recognitions: pd.otherInfo.recognitions,
            associations: pd.otherInfo.associations,
            references: pd.otherInfo.references,
            questions: pd.otherInfo.questions,
          }
        : null,
    };
  }, [completeSubmission?.pdsData]);

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

  // Handle PDF export with runtime assertions
  const handleExportPdf = React.useCallback(async () => {
    if (!pdfReadyData) {
      toast.error('PDS data not available');
      return;
    }

    // Runtime assertions: verify canonical data shape at PDF boundary
    console.log('[Admin PDS PDF] Asserting data shape:', {
      hasPersonalInfo: !!pdfReadyData.personalInfo,
      hasSurname: !!pdfReadyData.personalInfo?.surname,
      hasFirstName: !!pdfReadyData.personalInfo?.firstName,
      hasFamilyBackground: !!pdfReadyData.familyBackground,
      familyBackgroundKeys: pdfReadyData.familyBackground
        ? Object.keys(pdfReadyData.familyBackground)
        : [],
      spouseFields: pdfReadyData.familyBackground
        ? {
            hasSurname: 'spouseSurname' in pdfReadyData.familyBackground,
            hasFirstName: 'spouseFirstName' in pdfReadyData.familyBackground,
          }
        : null,
    });

    try {
      // Validate before generating
      const { validatePDSForPDF } = await import(
        '@/../../employee/src/lib/utils/pds-validation'
      );
      const validation = validatePDSForPDF(pdfReadyData);

      if (!validation.isValid) {
        const errorList = validation.errors
          .map((e) => `• ${e.message}`)
          .join('\n');
        toast.error('Cannot generate PDF', {
          description: errorList,
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('PDF Generation Warnings:', validation.warnings);
      }

      // Generate PDF
      toast.loading('Generating PDF...', { id: 'admin-pdf' });
      await downloadPDF(pdfReadyData);
      toast.success('PDF downloaded successfully', { id: 'admin-pdf' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        id: 'admin-pdf',
      });
    }
  }, [pdfReadyData, downloadPDF]);

  const handlePrintPdf = React.useCallback(async () => {
    if (!pdfReadyData) {
      toast.error('PDS data not available');
      return;
    }

    try {
      // Validate before generating
      const { validatePDSForPDF } = await import(
        '@/../../employee/src/lib/utils/pds-validation'
      );
      const validation = validatePDSForPDF(pdfReadyData);

      if (!validation.isValid) {
        const errorList = validation.errors
          .map((e) => `• ${e.message}`)
          .join('\n');
        toast.error('Cannot generate PDF', {
          description: errorList,
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('PDF Generation Warnings:', validation.warnings);
      }

      toast.loading('Opening print preview...', { id: 'admin-print' });
      await openPDFInNewTab(pdfReadyData);
      toast.success('PDF opened - use Ctrl+P to print', { id: 'admin-print' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to open print preview', {
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        id: 'admin-print',
      });
    }
  }, [pdfReadyData, openPDFInNewTab]);

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

  const { submission, employee: submissionUser } =
    completeSubmission as PDSSubmissionDetail;
  // Use viewPdsData (UI adapter) for display, pdfReadyData for PDF export
  // Admin can only review submissions that are in reviewable states
  // API only accepts 'submitted' or 'reviewing' status for approve/reject
  const canReview =
    submission.status === 'submitted' || submission.status === 'reviewing';
  const isAlreadyApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';
  const isDraft = submission.status === 'draft';

  // PDF is available for approved, submitted, and reviewing statuses
  const canDownloadPDF =
    submission.status === 'approved' ||
    submission.status === 'submitted' ||
    submission.status === 'reviewing';

  // Department and position info
  const department = submissionUser?.department;
  const position = submissionUser?.position;

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

        {/* Submission Actions Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {isAlreadyApproved
                      ? 'Approved Submission'
                      : isRejected
                      ? 'Rejected Submission'
                      : isDraft
                      ? 'Draft Submission'
                      : 'Review Submission'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAlreadyApproved
                      ? 'This PDS has been approved and is ready for download'
                      : isRejected
                      ? 'This PDS was rejected. The employee must revise and resubmit.'
                      : isDraft
                      ? 'This PDS is still a draft and has not been submitted for review.'
                      : "Review and validate the employee's Personal Data Sheet"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canDownloadPDF && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={isGenerating || isSubmitting}>
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintPdf}
                      disabled={isGenerating || isSubmitting}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print PDF
                    </Button>
                  </>
                )}
                {canReview && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setReviewAction('reject');
                        setIsReviewDialogOpen(true);
                      }}
                      disabled={isSubmitting}
                      className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setReviewAction('approve');
                        setIsReviewDialogOpen(true);
                      }}
                      disabled={isSubmitting}
                      className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {isDraft && !canReview && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setReviewAction('reject');
                      setIsReviewDialogOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject Draft
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header Section */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/submissions/pds')}
                  className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  PDS Submission Review
                </h1>
              </div>
              <p className="text-muted-foreground">
                Submitted on{' '}
                {submission.submittedAt
                  ? format(new Date(submission.submittedAt), 'MMMM d, yyyy')
                  : 'N/A'}
                {' - '}
                {submission.year}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge
                status={
                  submission.status as
                    | 'draft'
                    | 'submitted'
                    | 'reviewing'
                    | 'approved'
                    | 'rejected'
                }
              />
            </div>
          </div>
        </div>

        {/* Main Layout - Two Column Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* CSC Format Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Personal Data Sheet (CSC Revised 2017)
                </CardTitle>
              </CardHeader>
            </Card>

            {/* I. PERSONAL INFORMATION */}
            <DataSection
              icon={User}
              title="I. PERSONAL INFORMATION"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.personalInfo, true)}
                />
              }
              defaultOpen={true}>
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    1. Full Name
                  </h4>
                  <SectionCardGrid columns={4}>
                    <SectionCardField
                      label="Surname"
                      value={viewPdsData?.personalInfo?.surname}
                    />
                    <SectionCardField
                      label="First Name"
                      value={viewPdsData?.personalInfo?.firstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={viewPdsData?.personalInfo?.middleName}
                    />
                    <SectionCardField
                      label="Name Extension"
                      value={viewPdsData?.personalInfo?.nameExtension}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Birth Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    2. Birth Information
                  </h4>
                  <SectionCardGrid columns={3}>
                    <SectionCardField
                      label="Date of Birth"
                      value={
                        viewPdsData?.personalInfo?.dateOfBirth
                          ? format(
                              new Date(viewPdsData?.personalInfo.dateOfBirth),
                              'MMMM d, yyyy'
                            )
                          : null
                      }
                    />
                    <SectionCardField
                      label="Place of Birth"
                      value={viewPdsData?.personalInfo?.placeOfBirth}
                    />
                    <SectionCardField
                      label="Sex"
                      value={capitalize(viewPdsData?.personalInfo?.sex)}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Civil Status & Citizenship */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    3. Civil Status & Citizenship
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Civil Status"
                      value={capitalize(viewPdsData?.personalInfo?.civilStatus)}
                    />
                    <SectionCardField
                      label="Citizenship"
                      value={
                        viewPdsData?.personalInfo?.citizenship
                          ? formatCitizenship(
                              viewPdsData?.personalInfo.citizenship as never
                            )
                          : 'N/A'
                      }
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Physical Attributes */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    4. Physical Attributes
                  </h4>
                  <SectionCardGrid columns={4}>
                    <SectionCardField
                      label="Height"
                      value={formatHeight(viewPdsData?.personalInfo?.height)}
                    />
                    <SectionCardField
                      label="Weight"
                      value={formatWeight(viewPdsData?.personalInfo?.weight)}
                    />
                    <SectionCardField
                      label="Blood Type"
                      value={viewPdsData?.personalInfo?.bloodType}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Address & Contact */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    5. Address & Contact Information
                  </h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField
                      label="Residential Address"
                      value={formatAddress(
                        viewPdsData?.personalInfo?.residentialAddress
                      )}
                    />
                    <SectionCardField
                      label="Permanent Address"
                      value={formatAddress(
                        viewPdsData?.personalInfo?.permanentAddress
                      )}
                    />
                    <SectionCardField
                      label="Telephone Number"
                      value={viewPdsData?.personalInfo?.telephoneNo}
                    />
                    <SectionCardField
                      label="Mobile Number"
                      value={viewPdsData?.personalInfo?.mobileNo}
                    />
                    <SectionCardField
                      label="Email Address"
                      value={viewPdsData?.personalInfo?.emailAddress}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Government IDs */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    6. Government Issued IDs
                  </h4>
                  <SectionCardGrid columns={3}>
                    <SectionCardField
                      label="GSIS ID No."
                      value={viewPdsData?.personalInfo?.gsisNo}
                    />
                    <SectionCardField
                      label="PAG-IBIG ID No."
                      value={viewPdsData?.personalInfo?.pagibigNo}
                    />
                    <SectionCardField
                      label="PhilHealth No."
                      value={viewPdsData?.personalInfo?.philhealthNo}
                    />
                    <SectionCardField
                      label="SSS No."
                      value={viewPdsData?.personalInfo?.sssNo}
                    />
                    <SectionCardField
                      label="TIN"
                      value={viewPdsData?.personalInfo?.tinNo}
                    />
                  </SectionCardGrid>
                </div>
              </div>
            </DataSection>

            {/* II. FAMILY BACKGROUND */}
            <DataSection
              icon={Users}
              title="II. FAMILY BACKGROUND"
              badge={
                <ValidationBadge
                  status={getSectionStatus(
                    viewPdsData?.familyBackground,
                    true
                  )}
                />
              }
              defaultOpen={false}>
              <div className="space-y-6">
                {/* Spouse Information */}
                {viewPdsData?.familyBackground?.spouse?.surname && (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Spouse Information
                      </h4>
                      <SectionCardGrid columns={2}>
                        <SectionCardField
                          label="Surname"
                          value={viewPdsData?.familyBackground.spouse.surname}
                        />
                        <SectionCardField
                          label="First Name"
                          value={viewPdsData?.familyBackground.spouse.firstName}
                        />
                        <SectionCardField
                          label="Middle Name"
                          value={
                            viewPdsData?.familyBackground.spouse.middleName
                          }
                        />
                        <SectionCardField
                          label="Name Extension"
                          value={
                            viewPdsData?.familyBackground.spouse.nameExtension
                          }
                        />
                        <SectionCardField
                          label="Occupation"
                          value={
                            viewPdsData?.familyBackground.spouse.occupation
                          }
                        />
                        <SectionCardField
                          label="Employer/Business Name"
                          value={viewPdsData?.familyBackground.spouse.employer}
                        />
                        <SectionCardField
                          label="Business Address"
                          value={
                            viewPdsData?.familyBackground.spouse.businessAddress
                          }
                        />
                        <SectionCardField
                          label="Telephone No."
                          value={
                            viewPdsData?.familyBackground.spouse.telephoneNo
                          }
                        />
                      </SectionCardGrid>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Father Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Father&apos;s Name
                  </h4>
                  <SectionCardGrid columns={3}>
                    <SectionCardField
                      label="Surname"
                      value={viewPdsData?.familyBackground?.father?.surname}
                    />
                    <SectionCardField
                      label="First Name"
                      value={viewPdsData?.familyBackground?.father?.firstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={viewPdsData?.familyBackground?.father?.middleName}
                    />
                  </SectionCardGrid>
                </div>

                <Separator />

                {/* Mother Information */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Mother&apos;s Maiden Name
                  </h4>
                  <SectionCardGrid columns={3}>
                    <SectionCardField
                      label="Maiden Surname"
                      value={viewPdsData?.familyBackground?.mother?.maidenName}
                    />
                    <SectionCardField
                      label="First Name"
                      value={viewPdsData?.familyBackground?.mother?.firstName}
                    />
                    <SectionCardField
                      label="Middle Name"
                      value={viewPdsData?.familyBackground?.mother?.middleName}
                    />
                  </SectionCardGrid>
                </div>

                {/* Children */}
                {viewPdsData?.children && viewPdsData?.children.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Children (List all children&apos;s names in
                        chronological order)
                      </h4>
                      <div className="space-y-2">
                        {viewPdsData?.children.map(
                          (
                            child: {
                              fullName: string;
                              dateOfBirth: string;
                            },
                            index: number
                          ) => (
                            <ChildCard
                              key={index}
                              data={child}
                              index={index}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}

                {(!viewPdsData?.children ||
                  viewPdsData?.children.length === 0) && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No children listed
                    </p>
                  </>
                )}
              </div>
            </DataSection>

            {/* III. EDUCATIONAL BACKGROUND */}
            <DataSection
              icon={GraduationCap}
              title="III. EDUCATIONAL BACKGROUND"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.education, true)}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.education && viewPdsData?.education.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.education.map(
                    (
                      edu: {
                        level?: string;
                        schoolName?: string;
                        degreeCourse?: string;
                        periodFrom?: string;
                        periodTo?: string;
                        highestLevelEarned?: string;
                        yearGraduated?: number;
                        honorsReceived?: string;
                      },
                      index: number
                    ) => (
                      <EducationCard key={index} data={edu} index={index} />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No educational background provided
                </p>
              )}
            </DataSection>

            {/* IV. CIVIL SERVICE ELIGIBILITY */}
            <DataSection
              icon={Award}
              title="IV. CIVIL SERVICE ELIGIBILITY"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.civilService, false)}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.civilService &&
              viewPdsData?.civilService.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.civilService.map(
                    (
                      exam: {
                        id?: string;
                        careerService?: string;
                        rating?: number | null;
                        dateOfExamination?: string;
                        placeOfExamination?: string;
                        licenseNumber?: string;
                        validity?: string;
                        attachments?: Array<{
                          id: string;
                          fileName: string;
                          fileUrl: string | null;
                        }>;
                      },
                      index: number
                    ) => (
                      <CivilServiceCard key={index} data={exam} index={index} />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No civil service eligibility provided
                </p>
              )}
            </DataSection>

            {/* V. WORK EXPERIENCE */}
            <DataSection
              icon={Briefcase}
              title="V. WORK EXPERIENCE"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.workExperience, false)}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.workExperience &&
              viewPdsData?.workExperience.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.workExperience.map(
                    (
                      work: {
                        id?: string;
                        positionTitle?: string;
                        department?: string;
                        monthlySalary?: number | null;
                        salaryGrade?: string;
                        statusOfAppointment?: string;
                        govService?: boolean;
                        periodFrom?: string;
                        periodTo?: string;
                      },
                      index: number
                    ) => (
                      <WorkExperienceCard
                        key={index}
                        data={work}
                        index={index}
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No work experience provided
                </p>
              )}
            </DataSection>

            {/* VI. VOLUNTARY WORK */}
            <DataSection
              icon={Heart}
              title="VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC/NON-GOVERNMENT/PEOPLE/VOLUNTARY ORGANIZATIONS"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.voluntaryWork, false)}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.voluntaryWork &&
              viewPdsData?.voluntaryWork.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.voluntaryWork.map(
                    (
                      work: {
                        id?: string;
                        organizationName?: string;
                        organizationAddress?: string;
                        positionNature?: string;
                        dateFrom?: string;
                        dateTo?: string;
                        numberOfHours?: number;
                      },
                      index: number
                    ) => (
                      <VoluntaryWorkCard
                        key={index}
                        data={work}
                        index={index}
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No voluntary work or involvement provided
                </p>
              )}
            </DataSection>

            {/* VII. LEARNING AND DEVELOPMENT */}
            <DataSection
              icon={BookOpen}
              title="VII. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.training, false)}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.training && viewPdsData?.training.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.training.map(
                    (
                      training: {
                        id?: string;
                        title?: string;
                        dateFrom?: string;
                        dateTo?: string;
                        hours?: number;
                        typeOfLd?: string;
                        conductedBy?: string;
                        attachments?: Array<{
                          id: string;
                          fileName: string;
                          fileUrl: string | null;
                        }>;
                      },
                      index: number
                    ) => (
                      <TrainingCard key={index} data={training} index={index} />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No learning and development interventions provided
                </p>
              )}
            </DataSection>

            {/* VIII. OTHER INFORMATION */}
            <DataSection
              icon={Info}
              title="VIII. OTHER INFORMATION"
              badge={
                <ValidationBadge
                  status={getSectionStatus(viewPdsData?.otherInfo, true)}
                />
              }
              defaultOpen={false}>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    31. Special Skills and Hobbies
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg border min-h-[60px]">
                    {viewPdsData?.otherInfo?.skills &&
                    viewPdsData?.otherInfo.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewPdsData?.otherInfo.skills.map(
                          (skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No special skills or hobbies listed
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    32. Non-Academic Distinctions/Recognition
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg border min-h-[60px]">
                    {viewPdsData?.otherInfo?.recognitions &&
                    viewPdsData?.otherInfo.recognitions.length > 0 ? (
                      <ul className="space-y-2">
                        {viewPdsData?.otherInfo.recognitions.map(
                          (
                            recog: {
                              title?: string;
                              year?: string;
                              organization?: string;
                            },
                            index: number
                          ) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">
                                {recog.title || 'Recognition'}
                              </span>
                              {recog.year && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  ({recog.year})
                                </span>
                              )}
                              {recog.organization && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {recog.organization}
                                </span>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No recognitions listed
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    33. Membership in Association/Organization
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg border min-h-[60px]">
                    {viewPdsData?.otherInfo?.associations &&
                    viewPdsData?.otherInfo.associations.length > 0 ? (
                      <ul className="space-y-2">
                        {viewPdsData?.otherInfo.associations.map(
                          (
                            org: {
                              name?: string;
                              position?: string;
                              yearJoined?: string;
                            },
                            index: number
                          ) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">
                                {org.name || 'Organization'}
                              </span>
                              {org.position && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {org.position}
                                </span>
                              )}
                              {org.yearJoined && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  ({org.yearJoined})
                                </span>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No memberships listed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DataSection>

            {/* IX. QUESTIONS */}
            <DataSection
              icon={HelpCircle}
              title="IX. QUESTIONS (34-40c)"
              badge={
                <ValidationBadge
                  status={getSectionStatus(
                    viewPdsData?.otherInfo?.questions,
                    true
                  )}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.otherInfo?.questions ? (
                <QuestionList>
                  <QuestionItem
                    number="34."
                    question="Are you related by consanguinity or affinity to the appointing or recommending authority?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q34_related_to_authority ?? viewPdsData?.otherInfo.questions.Q34_criminal_charged
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q34_related_to_authority_details ?? viewPdsData?.otherInfo.questions.Q34_criminal_charged_details
                    }
                  />
                  <QuestionItem
                    number="35a."
                    question="Have you ever been found guilty of any administrative offense?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q35a_admin_offense ?? viewPdsData?.otherInfo.questions.Q35_criminal_convicted
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q35a_admin_offense_details ?? viewPdsData?.otherInfo.questions.Q35_criminal_convicted_details
                    }
                  />
                  <QuestionItem
                    number="35b."
                    question="Have you ever been criminally charged before any court?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q35b_criminal_charged
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q35b_criminal_charged_details
                    }
                  />
                  <QuestionItem
                    number="36."
                    question="Have you ever been convicted of any crime or violation?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q36_convicted_of_crime
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q36_convicted_of_crime_details
                    }
                  />
                  <QuestionItem
                    number="37."
                    question="Have you ever been separated from the service?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q37_separated_from_service ?? viewPdsData?.otherInfo.questions.Q36_separated_from_service
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q37_separated_from_service_details ?? viewPdsData?.otherInfo.questions.Q36_separated_from_service_details
                    }
                  />
                  <QuestionItem
                    number="38a."
                    question="Have you ever been a candidate in a national or local election?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q38a_candidate_for_election ?? viewPdsData?.otherInfo.questions.Q37_candidate_for_election
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q38a_candidate_for_election_details ?? viewPdsData?.otherInfo.questions.Q37_candidate_for_election_details
                    }
                  />
                  <QuestionItem
                    number="38b."
                    question="Have you resigned from government service to campaign?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q38b_resigned_to_campaign ?? viewPdsData?.otherInfo.questions.Q38_resigned_from_government
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q38b_resigned_to_campaign_details ?? viewPdsData?.otherInfo.questions.Q38_resigned_from_government_details
                    }
                  />
                  <QuestionItem
                    number="39."
                    question="Have you acquired immigrant or permanent resident status?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q39_immigrant_status ?? viewPdsData?.otherInfo.questions.Q39_immigrant_or_acquired_residence
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q39_immigrant_status_details ?? viewPdsData?.otherInfo.questions.Q39_immigrant_or_acquired_residence_details
                    }
                  />
                  <QuestionItem
                    number="40a."
                    question="Are you a member of any indigenous group?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q40a_indigenous_group ?? viewPdsData?.otherInfo.questions.Q40_indigenous_group
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q40a_indigenous_group_details ?? viewPdsData?.otherInfo.questions.Q40_indigenous_group_details
                    }
                  />
                  <QuestionItem
                    number="40b."
                    question="Are you a person with disability?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q40b_disabled ?? viewPdsData?.otherInfo.questions.Q41_disabled
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q40b_disabled_details ?? viewPdsData?.otherInfo.questions.Q41_disabled_details
                    }
                  />
                  <QuestionItem
                    number="40c."
                    question="Are you a solo parent?"
                    answer={
                      viewPdsData?.otherInfo.questions.Q40c_solo_parent ?? viewPdsData?.otherInfo.questions.Q42_solo_parent
                    }
                    details={
                      viewPdsData?.otherInfo.questions.Q40c_solo_parent_details ?? viewPdsData?.otherInfo.questions.Q42_solo_parent_details
                    }
                  />
                </QuestionList>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No questions data provided
                </p>
              )}
            </DataSection>

            {/* X. REFERENCES */}
            <DataSection
              icon={UserCheck}
              title="X. REFERENCES"
              badge={
                <ValidationBadge
                  status={getSectionStatus(
                    viewPdsData?.otherInfo?.references,
                    true
                  )}
                />
              }
              defaultOpen={false}>
              {viewPdsData?.otherInfo?.references &&
              viewPdsData?.otherInfo.references.length > 0 ? (
                <div className="space-y-3">
                  {viewPdsData?.otherInfo.references.map(
                    (
                      ref: {
                        name?: string;
                        address?: string;
                        telephoneNo?: string;
                      },
                      index: number
                    ) => (
                      <ReferenceCard key={index} data={ref} index={index} />
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No references provided
                </p>
              )}
            </DataSection>
          </div>

          {/* Sidebar - Employee Info */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center space-y-3">
                  {submissionUser && (
                    <UserAvatar
                      user={{
                        firstName: submissionUser.firstName,
                        lastName: submissionUser.lastName,
                        avatarUrl: submissionUser.avatarUrl,
                      }}
                      size="lg"
                      className="h-20 w-20"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {submissionUser?.firstName} {submissionUser?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {submissionUser?.employeeId || 'N/A'}
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
                      <StatusBadge
                        status={
                          submission.status as
                            | 'draft'
                            | 'submitted'
                            | 'reviewing'
                            | 'approved'
                            | 'rejected'
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="font-medium">
                      {submission.submittedAt
                        ? format(
                            new Date(submission.submittedAt),
                            'MMM d, yyyy h:mm a'
                          )
                        : 'N/A'}
                    </dd>
                  </div>
                  {submission.reviewedAt && (
                    <div>
                      <dt className="text-muted-foreground">Reviewed</dt>
                      <dd className="font-medium">
                        {format(
                          new Date(submission.reviewedAt),
                          'MMM d, yyyy h:mm a'
                        )}
                      </dd>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Attachments Summary */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      // Calculate attachment counts
                      const civilServiceCount =
                        viewPdsData?.civilService?.reduce(
                          (acc: number, cs: { attachments?: unknown[] }) =>
                            acc + (cs.attachments?.length || 0),
                          0
                        ) || 0;
                      const trainingCount =
                        viewPdsData?.training?.reduce(
                          (acc: number, t: { attachments?: unknown[] }) =>
                            acc + (t.attachments?.length || 0),
                          0
                        ) || 0;
                      const totalCount = civilServiceCount + trainingCount;

                      // Display summary
                      if (totalCount === 0) {
                        return (
                          <p className="text-muted-foreground text-center py-2">
                            No attachments
                          </p>
                        );
                      }

                      return (
                        <>
                          <div className="flex items-center justify-between p-2 rounded bg-muted/50 border">
                            <span className="text-muted-foreground">
                              Total Files
                            </span>
                            <Badge variant="secondary" className="font-semibold">
                              {totalCount}
                            </Badge>
                          </div>
                          {civilServiceCount > 0 && (
                            <div className="flex items-center justify-between px-2">
                              <span className="text-muted-foreground text-xs">
                                Civil Service
                              </span>
                              <span className="text-xs font-medium">
                                {civilServiceCount}
                              </span>
                            </div>
                          )}
                          {trainingCount > 0 && (
                            <div className="flex items-center justify-between px-2">
                              <span className="text-muted-foreground text-xs">
                                Training
                              </span>
                              <span className="text-xs font-medium">
                                {trainingCount}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleExportPdf}
                    className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
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
        defaultAction={reviewAction}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
