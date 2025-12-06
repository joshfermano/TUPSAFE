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
  AlertCircle,
  Check,
  Printer,
  XCircle,
  CheckCircle,
  Loader2,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

import { usePdsSubmissionsQuery } from '@/hooks/usePdsSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { usePDSPdf, transformPdsForPdf } from '@/hooks/usePDSPdf';
import {
  formatAddress,
  formatCitizenship,
  formatCurrency,
  formatDateRange,
  formatYearRange,
  formatBoolean,
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
 * and collapsible accordions for better organization.
 *
 * Features:
 * - Complete PDS data display with all CSC sections
 * - Collapsible accordion sections for easy navigation
 * - Validation indicators (complete/incomplete)
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
  const [reviewAction, setReviewAction] = React.useState<
    'approve' | 'reject'
  >('approve');

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

  // Handle PDF export
  const handleExportPdf = React.useCallback(async () => {
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

      // Generate PDF
      const filename = `PDS_${
        completeSubmission?.employee?.employeeId || 'Submission'
      }_${new Date().toISOString().split('T')[0]}`;

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
  }, [pdfReadyData, downloadPDF, completeSubmission]);

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

  // Section status types and helpers
  type SectionStatus = 'complete' | 'incomplete' | 'not_applicable';

  const getSectionStatus = (
    sectionData: unknown,
    isRequired: boolean = false
  ): SectionStatus => {
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
  };

  const ValidationBadge = ({ status }: { status: SectionStatus }) => {
    switch (status) {
      case 'complete':
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
            <Check className="h-3 w-3" />
            Complete
          </Badge>
        );
      case 'incomplete':
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
            <AlertCircle className="h-3 w-3" />
            Incomplete
          </Badge>
        );
      case 'not_applicable':
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700">
            <span className="text-xs">—</span>
            N/A
          </Badge>
        );
    }
  };

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

  const {
    submission,
    employee: submissionUser,
    pdsData,
  } = completeSubmission as PDSSubmissionDetail;
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
                      onClick={() => {
                        setReviewAction('reject');
                        setIsReviewDialogOpen(true);
                      }}
                      className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setReviewAction('approve');
                        setIsReviewDialogOpen(true);
                      }}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {isDraft && !canReview && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setReviewAction('reject');
                      setIsReviewDialogOpen(true);
                    }}
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
                {' • '}CY {submission.year}
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
            {/* CSC Format Sections - Collapsible Accordions */}
            <Card className="gradient-card-subtle backdrop-blur-sm border-primary-subtle">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Personal Data Sheet (CSC Revised 2017)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="multiple"
                  defaultValue={['section-1']}
                  className="w-full">
                  {/* I. PERSONAL INFORMATION */}
                  <AccordionItem value="section-1">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            I. PERSONAL INFORMATION
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(pdsData.personalInfo, true)}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        {/* Name */}
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                            1. Full Name
                          </h4>
                          <SectionCardGrid columns={4}>
                            <SectionCardField
                              label="Surname"
                              value={pdsData.personalInfo?.surname}
                            />
                            <SectionCardField
                              label="First Name"
                              value={pdsData.personalInfo?.firstName}
                            />
                            <SectionCardField
                              label="Middle Name"
                              value={pdsData.personalInfo?.middleName}
                            />
                            <SectionCardField
                              label="Name Extension"
                              value={pdsData.personalInfo?.nameExtension}
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
                                pdsData.personalInfo?.dateOfBirth
                                  ? format(
                                      new Date(
                                        pdsData.personalInfo.dateOfBirth
                                      ),
                                      'MMMM d, yyyy'
                                    )
                                  : null
                              }
                            />
                            <SectionCardField
                              label="Place of Birth"
                              value={pdsData.personalInfo?.placeOfBirth}
                            />
                            <SectionCardField
                              label="Sex"
                              value={capitalize(pdsData.personalInfo?.sex)}
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
                              value={capitalize(
                                pdsData.personalInfo?.civilStatus
                              )}
                            />
                            <SectionCardField
                              label="Citizenship"
                              value={
                                pdsData.personalInfo?.citizenship
                                  ? formatCitizenship(
                                      pdsData.personalInfo.citizenship as never
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
                              value={formatHeight(pdsData.personalInfo?.height)}
                            />
                            <SectionCardField
                              label="Weight"
                              value={formatWeight(pdsData.personalInfo?.weight)}
                            />
                            <SectionCardField
                              label="Blood Type"
                              value={pdsData.personalInfo?.bloodType}
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
                                pdsData.personalInfo?.residentialAddress
                              )}
                            />
                            <SectionCardField
                              label="Permanent Address"
                              value={formatAddress(
                                pdsData.personalInfo?.permanentAddress
                              )}
                            />
                            <SectionCardField
                              label="Telephone Number"
                              value={pdsData.personalInfo?.telephoneNo}
                            />
                            <SectionCardField
                              label="Mobile Number"
                              value={pdsData.personalInfo?.mobileNo}
                            />
                            <SectionCardField
                              label="Email Address"
                              value={pdsData.personalInfo?.emailAddress}
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
                              value={pdsData.personalInfo?.gsisNo}
                            />
                            <SectionCardField
                              label="PAG-IBIG ID No."
                              value={pdsData.personalInfo?.pagibigNo}
                            />
                            <SectionCardField
                              label="PhilHealth No."
                              value={pdsData.personalInfo?.philhealthNo}
                            />
                            <SectionCardField
                              label="SSS No."
                              value={pdsData.personalInfo?.sssNo}
                            />
                            <SectionCardField
                              label="TIN"
                              value={pdsData.personalInfo?.tinNo}
                            />
                          </SectionCardGrid>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* II. FAMILY BACKGROUND */}
                  <AccordionItem value="section-2">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            II. FAMILY BACKGROUND
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(
                            pdsData.familyBackground,
                            true
                          )}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        {/* Spouse Information */}
                        {pdsData.familyBackground?.spouse?.surname && (
                          <>
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                Spouse Information
                              </h4>
                              <SectionCardGrid columns={2}>
                                <SectionCardField
                                  label="Surname"
                                  value={
                                    pdsData.familyBackground.spouse.surname
                                  }
                                />
                                <SectionCardField
                                  label="First Name"
                                  value={
                                    pdsData.familyBackground.spouse.firstName
                                  }
                                />
                                <SectionCardField
                                  label="Middle Name"
                                  value={
                                    pdsData.familyBackground.spouse.middleName
                                  }
                                />
                                <SectionCardField
                                  label="Name Extension"
                                  value={
                                    pdsData.familyBackground.spouse
                                      .nameExtension
                                  }
                                />
                                <SectionCardField
                                  label="Occupation"
                                  value={
                                    pdsData.familyBackground.spouse.occupation
                                  }
                                />
                                <SectionCardField
                                  label="Employer/Business Name"
                                  value={
                                    pdsData.familyBackground.spouse.employer
                                  }
                                />
                                <SectionCardField
                                  label="Business Address"
                                  value={
                                    pdsData.familyBackground.spouse
                                      .businessAddress
                                  }
                                />
                                <SectionCardField
                                  label="Telephone No."
                                  value={
                                    pdsData.familyBackground.spouse.telephoneNo
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
                              value={pdsData.familyBackground?.father?.surname}
                            />
                            <SectionCardField
                              label="First Name"
                              value={
                                pdsData.familyBackground?.father?.firstName
                              }
                            />
                            <SectionCardField
                              label="Middle Name"
                              value={
                                pdsData.familyBackground?.father?.middleName
                              }
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
                              value={
                                pdsData.familyBackground?.mother?.maidenName
                              }
                            />
                            <SectionCardField
                              label="First Name"
                              value={
                                pdsData.familyBackground?.mother?.firstName
                              }
                            />
                            <SectionCardField
                              label="Middle Name"
                              value={
                                pdsData.familyBackground?.mother?.middleName
                              }
                            />
                          </SectionCardGrid>
                        </div>

                        {/* Children */}
                        {pdsData.children && pdsData.children.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                Children (List all children&apos;s names in
                                chronological order)
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Name of Children</TableHead>
                                    <TableHead>Date of Birth</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pdsData.children.map((child, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell className="font-medium">
                                        {child.fullName}
                                      </TableCell>
                                      <TableCell>
                                        {format(
                                          new Date(child.dateOfBirth),
                                          'MMMM d, yyyy'
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )}

                        {(!pdsData.children ||
                          pdsData.children.length === 0) && (
                          <>
                            <Separator />
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                              No children listed
                            </p>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* III. EDUCATIONAL BACKGROUND */}
                  <AccordionItem value="section-3">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            III. EDUCATIONAL BACKGROUND
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(pdsData.education, true)}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.education && pdsData.education.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[120px]">
                                    Level
                                  </TableHead>
                                  <TableHead className="min-w-[200px]">
                                    Name of School
                                  </TableHead>
                                  <TableHead className="min-w-[180px]">
                                    Basic Education/Degree/Course
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Period of Attendance
                                  </TableHead>
                                  <TableHead className="min-w-[140px]">
                                    Highest Level/Units Earned
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Year Graduated
                                  </TableHead>
                                  <TableHead className="min-w-[180px]">
                                    Scholarship/Academic Honors
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.education.map((edu, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium capitalize">
                                      {edu.level}
                                    </TableCell>
                                    <TableCell>{edu.schoolName}</TableCell>
                                    <TableCell>
                                      {edu.degreeCourse || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {formatYearRange(
                                        edu.periodFrom,
                                        edu.periodTo
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {edu.highestLevelEarned || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {edu.yearGraduated || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {edu.honorsReceived || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No educational background provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* IV. CIVIL SERVICE ELIGIBILITY */}
                  <AccordionItem value="section-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            IV. CIVIL SERVICE ELIGIBILITY
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(pdsData.civilService, false)}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.civilService &&
                        pdsData.civilService.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[240px]">
                                    Career Service/RA 1080 (Board/Bar) Under
                                    Special Laws/CES/CSEE
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Rating
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Date of Examination
                                  </TableHead>
                                  <TableHead className="min-w-[180px]">
                                    Place of Examination
                                  </TableHead>
                                  <TableHead className="min-w-[140px]">
                                    License Number
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Date of Validity
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.civilService.map((exam, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      {exam.careerService || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {exam.rating
                                        ? `${exam.rating.toFixed(2)}%`
                                        : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {exam.dateOfExamination
                                        ? format(
                                            new Date(exam.dateOfExamination),
                                            'MMM d, yyyy'
                                          )
                                        : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {exam.placeOfExamination || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {exam.licenseNumber || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {exam.validity
                                        ? format(
                                            new Date(exam.validity),
                                            'MMM d, yyyy'
                                          )
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No civil service eligibility provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* V. WORK EXPERIENCE */}
                  <AccordionItem value="section-5">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            V. WORK EXPERIENCE
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(
                            pdsData.workExperience,
                            false
                          )}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.workExperience &&
                        pdsData.workExperience.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[120px]">
                                    Inclusive Dates
                                  </TableHead>
                                  <TableHead className="min-w-[200px]">
                                    Position Title
                                  </TableHead>
                                  <TableHead className="min-w-[240px]">
                                    Department/Agency/Office/Company
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Monthly Salary
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Salary Grade
                                  </TableHead>
                                  <TableHead className="min-w-[160px]">
                                    Status of Appointment
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Gov&apos;t Service
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.workExperience.map((work, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {formatDateRange(
                                        work.periodFrom,
                                        work.periodTo
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {work.positionTitle || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {work.department || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(work.monthlySalary)}
                                    </TableCell>
                                    <TableCell>
                                      {work.salaryGrade || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {work.statusOfAppointment || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {work.govService !== undefined
                                        ? formatBoolean(work.govService)
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No work experience provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* VI. VOLUNTARY WORK */}
                  <AccordionItem value="section-6">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            VI. VOLUNTARY WORK OR INVOLVEMENT IN
                            CIVIC/NON-GOVERNMENT/PEOPLE/VOLUNTARY ORGANIZATIONS
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(
                            pdsData.voluntaryWork,
                            false
                          )}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.voluntaryWork &&
                        pdsData.voluntaryWork.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[240px]">
                                    Name & Address of Organization
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Inclusive Dates
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Number of Hours
                                  </TableHead>
                                  <TableHead className="min-w-[180px]">
                                    Position/Nature of Work
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.voluntaryWork.map((work, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      <div>
                                        <p>{work.organizationName || 'N/A'}</p>
                                        {work.organizationAddress && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {work.organizationAddress}
                                          </p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatDateRange(
                                        work.dateFrom,
                                        work.dateTo
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {work.numberOfHours || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {work.positionNature || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No voluntary work or involvement provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* VII. LEARNING AND DEVELOPMENT */}
                  <AccordionItem value="section-7">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            VII. LEARNING AND DEVELOPMENT (L&D)
                            INTERVENTIONS/TRAINING PROGRAMS ATTENDED
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(pdsData.training, false)}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.training && pdsData.training.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[240px]">
                                    Title of Learning and Development
                                    Interventions/Training Programs
                                  </TableHead>
                                  <TableHead className="min-w-[120px]">
                                    Inclusive Dates
                                  </TableHead>
                                  <TableHead className="min-w-[100px]">
                                    Number of Hours
                                  </TableHead>
                                  <TableHead className="min-w-[140px]">
                                    Type of LD
                                  </TableHead>
                                  <TableHead className="min-w-[240px]">
                                    Conducted/Sponsored By
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.training.map((training, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      {training.title || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {training.dateFrom && training.dateTo
                                        ? `${format(
                                            new Date(training.dateFrom),
                                            'MMM dd, yyyy'
                                          )} - ${format(
                                            new Date(training.dateTo),
                                            'MMM dd, yyyy'
                                          )}`
                                        : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {training.hours || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {training.typeOfLd || '-'}
                                    </TableCell>
                                    <TableCell>
                                      {training.conductedBy || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No training or development programs provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* VIII. OTHER INFORMATION */}
                  <AccordionItem value="section-8">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            VIII. OTHER INFORMATION
                          </span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(pdsData.otherInfo, true)}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                            31. Special Skills and Hobbies
                          </h4>
                          <div className="p-4 bg-muted/30 rounded-md min-h-[60px]">
                            {pdsData.otherInfo?.skills &&
                            pdsData.otherInfo.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {pdsData.otherInfo.skills.map(
                                  (skill, index) => (
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
                          <div className="p-4 bg-muted/30 rounded-md min-h-[60px]">
                            {pdsData.otherInfo?.recognitions &&
                            pdsData.otherInfo.recognitions.length > 0 ? (
                              <ul className="space-y-2">
                                {pdsData.otherInfo.recognitions.map(
                                  (recog, index) => (
                                    <li key={index} className="text-sm">
                                      <span className="font-medium">
                                        {recog.recognition || 'Recognition'}
                                      </span>
                                      {recog.date && (
                                        <span className="text-muted-foreground">
                                          {' '}
                                          ({recog.date})
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
                          <div className="p-4 bg-muted/30 rounded-md min-h-[60px]">
                            {pdsData.otherInfo?.organizations &&
                            pdsData.otherInfo.organizations.length > 0 ? (
                              <ul className="space-y-2">
                                {pdsData.otherInfo.organizations.map(
                                  (org, index) => (
                                    <li key={index} className="text-sm">
                                      <span className="font-medium">
                                        {org.organization || 'Organization'}
                                      </span>
                                      {org.role && (
                                        <span className="text-muted-foreground">
                                          {' '}
                                          - {org.role}
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
                    </AccordionContent>
                  </AccordionItem>

                  {/* IX. QUESTIONS (Placeholder - would need questions data from schema) */}
                  <AccordionItem value="section-9">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            IX. QUESTIONS (34-40)
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="gap-1 bg-gray-50 text-gray-600 border-gray-200">
                          <Info className="h-3 w-3" />
                          Not Available
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground italic text-center py-8">
                          Questions section data not available in current
                          submission
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* X. REFERENCES */}
                  <AccordionItem value="section-10">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">X. REFERENCES</span>
                        </div>
                        <ValidationBadge
                          status={getSectionStatus(
                            pdsData.otherInfo?.references,
                            true
                          )}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {pdsData.otherInfo?.references &&
                        pdsData.otherInfo.references.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[200px]">
                                    Name
                                  </TableHead>
                                  <TableHead className="min-w-[240px]">
                                    Address
                                  </TableHead>
                                  <TableHead className="min-w-[140px]">
                                    Telephone No.
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pdsData.otherInfo.references.map(
                                  (ref, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">
                                        {ref.name || 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {ref.address || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {ref.telephoneNo || '-'}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No references provided
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
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
                    <UserAvatar
                      user={
                        {
                          ...submissionUser,
                          email: submissionUser.email || '',
                        } as {
                          firstName: string;
                          lastName: string;
                          email: string;
                        }
                      }
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
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="font-medium">v{submission.version}</dd>
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
