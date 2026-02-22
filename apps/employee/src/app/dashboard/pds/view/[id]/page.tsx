'use client';

/**
 * PDS View Detail Page
 * CS Form No. 212 Revised 2025 - Read-Only View
 *
 * Design: Clean, minimalistic, modern, premium
 * Layout: Collapsible sections with compact two-column grid
 * Theme: TUP red accent - oklch(0.55_0.22_15)
 */

import React, { use, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../providers/AuthProvider';
import { usePdsSubmissionById } from '../../../../../hooks/usePdsSubmissionById';
import { usePDSPdf } from '../../../../../hooks/usePDSPdf';
import { transformPdsForPdf } from '../../../../../lib/utils/pds-transformations';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Download,
  Printer,
  Edit,
  ChevronRight,
  ChevronDown,
  User,
  MapPin,
  Phone,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Star,
  Loader2,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// UI Components
import { BlurFade } from '../../../../../components/ui/blur-fade';
import { Card } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Separator } from '../../../../../components/ui/separator';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../../../../../components/ui/collapsible';
import { cn } from '../../../../../lib/utils';

// ============================================================================
// View-specific record types for typed iteration over PDS data arrays
// ============================================================================

interface PdsChildRecord {
  fullName?: string;
  dateOfBirth?: string | Date | null;
}

interface PdsEligibilityRecord {
  eligibilityName?: string;
  rating?: string | number | null;
  dateOfExam?: string | Date | null;
  placeOfExam?: string | null;
  licenseNo?: string | null;
  licenseValidityDate?: string | Date | null;
}

interface PdsRecognitionRecord {
  title?: string;
  year?: number | string;
  organization?: string;
}

interface PdsAssociationRecord {
  name?: string;
  position?: string;
  yearJoined?: number | string;
}

interface PdsReferenceRecord {
  name?: string;
  address?: string;
  telephoneNo?: string;
}

/** Education level record when education is stored as an object (keyed by level) */
interface PdsEducationLevelRecord {
  schoolName?: string;
  degreeCourse?: string;
  periodFrom?: string;
  periodTo?: string;
  highestLevelEarned?: string;
  yearGraduated?: string;
  honorsReceived?: string;
}

// ============================================================================
// JSONB field types for database columns that Drizzle types as '{}'
// These provide typed access to nested JSONB data from the database
// ============================================================================

interface PdsAddress {
  houseNumber?: string | null;
  streetName?: string | null;
  street?: string | null;
  subdivision?: string | null;
  barangay?: string | null;
  city?: string | null;
  cityMunicipality?: string | null;
  province?: string | null;
  region?: string | null;
  zipCode?: string | null;
}

interface PdsCitizenship {
  type?: 'Filipino' | 'Dual' | string;
  details?: string;
}

interface PdsQuestions {
  // New 2025 field names
  Q34_related_to_authority?: boolean | string;
  Q34_related_to_authority_details?: string;
  Q35a_admin_offense?: boolean | string;
  Q35a_admin_offense_details?: string;
  Q35b_criminal_charged?: boolean | string;
  Q35b_criminal_charged_details?: string;
  Q36_convicted_of_crime?: boolean | string;
  Q36_convicted_of_crime_details?: string;
  Q37_separated_from_service?: boolean | string;
  Q37_separated_from_service_details?: string;
  Q38a_candidate_for_election?: boolean | string;
  Q38a_candidate_for_election_details?: string;
  Q38b_resigned_to_campaign?: boolean | string;
  Q38b_resigned_to_campaign_details?: string;
  Q39_immigrant_status?: boolean | string;
  Q39_immigrant_status_details?: string;
  Q40a_indigenous_group?: boolean | string;
  Q40a_indigenous_group_details?: string;
  Q40b_disabled?: boolean | string;
  Q40b_disabled_details?: string;
  Q40c_solo_parent?: boolean | string;
  Q40c_solo_parent_details?: string;
  // Old field names (kept for backwards compatibility with existing DB data)
  Q34_criminal_charged?: boolean | string;
  Q34_criminal_charged_details?: string;
  Q35_criminal_convicted?: boolean | string;
  Q35_criminal_convicted_details?: string;
  Q36_separated_from_service?: boolean | string;
  Q36_separated_from_service_details?: string;
  Q37_candidate_for_election?: boolean | string;
  Q37_candidate_for_election_details?: string;
  Q38_resigned_from_government?: boolean | string;
  Q38_resigned_from_government_details?: string;
  Q39_immigrant_or_acquired_residence?: boolean | string;
  Q39_immigrant_or_acquired_residence_details?: string;
  Q39_immigrant_country?: string;
  Q40_indigenous_group?: boolean | string;
  Q40_indigenous_group_details?: string;
  Q40_indigenous_group_name?: string;
  Q41_disabled?: boolean | string;
  Q41_disabled_details?: string;
  Q41_disabled_id_number?: string;
  Q42_solo_parent?: boolean | string;
  Q42_solo_parent_details?: string;
  [key: string]: unknown;
}

/** Type overlay for CompletePDSSubmission JSONB fields */
interface PdsJsonbOverlay {
  personalInfo: {
    citizenship: PdsCitizenship;
    residentialAddress: PdsAddress;
    permanentAddress: PdsAddress;
    [key: string]: unknown;
  } | null;
  familyBackground: {
    [key: string]: unknown;
  } | null;
  children: PdsChildRecord[];
  otherInfo: {
    skills: string[];
    questions: PdsQuestions;
    references: PdsReferenceRecord[];
    recognitions: PdsRecognitionRecord[];
    associations: PdsAssociationRecord[];
    [key: string]: unknown;
  } | null;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  draft: {
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    label: 'Draft',
  },
  submitted: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    label: 'Submitted',
  },
  reviewing: {
    color:
      'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    label: 'Under Review',
  },
  approved: {
    color:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'Approved',
  },
  rejected: {
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    label: 'Rejected',
  },
};

// ============================================================================
// FIELD DISPLAY COMPONENT
// ============================================================================

interface FieldProps {
  label: string;
  value?: string | number | boolean | null;
  fullWidth?: boolean;
}

const Field = React.memo(({ label, value, fullWidth = false }: FieldProps) => {
  const displayValue =
    value === null || value === undefined || value === ''
      ? 'N/A'
      : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : String(value);

  return (
    <div className={cn('space-y-1', fullWidth && 'md:col-span-2')}>
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
        {label}
      </p>
      <p className="text-sm text-slate-900 dark:text-slate-100">
        {displayValue}
      </p>
    </div>
  );
});

Field.displayName = 'Field';

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
}

const Section = React.memo(
  ({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    delay = 0,
  }: SectionProps) => {
    return (
      <BlurFade delay={delay}>
        <Collapsible defaultOpen={defaultOpen}>
          <Card className="p-5 hover:border-[oklch(0.55_0.22_15)] dark:hover:border-[oklch(0.65_0.24_15)] transition-colors">
            <CollapsibleTrigger className="flex justify-between items-center w-full group">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-[oklch(0.55_0.22_15)] dark:text-[oklch(0.65_0.24_15)]" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
              </div>
              <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Separator className="my-4" />
              {children}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </BlurFade>
    );
  }
);

Section.displayName = 'Section';

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
      Loading PDS details...
    </p>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PDSViewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pdsId } = use(params);
  const router = useRouter();
  const { user: _user } = useAuth();

  // Fetch complete PDS data by ID
  const { pdsData: rawPdsData, loading } = usePdsSubmissionById(pdsId);

  // Extract submission metadata from complete data
  const submission = rawPdsData?.submission ?? null;

  // Create compatible data structure for view (handles different property naming conventions)
  // Wrapped in useMemo to ensure stable reference for downstream useMemo dependencies
  const pdsData = useMemo(() => {
    if (!rawPdsData) return null;
    return {
      ...rawPdsData,
      // Add fallback property names for compatibility with view components
      family: rawPdsData.familyBackground,
      eligibility: rawPdsData.civilService,
      learningDevelopment: rawPdsData.training,
    } as typeof rawPdsData & PdsJsonbOverlay & {
      family: (typeof rawPdsData.familyBackground) & { children?: PdsChildRecord[] } | null;
      eligibility: typeof rawPdsData.civilService;
      learningDevelopment: typeof rawPdsData.training;
    };
  }, [rawPdsData]);

  const canEdit =
    submission?.status === 'draft' || submission?.status === 'rejected';

  // Check if PDF download/print is allowed
  // PDF is available for: approved, submitted, reviewing
  // PDF is NOT available for: draft, rejected
  const canDownloadPDF =
    submission?.status === 'approved' ||
    submission?.status === 'submitted' ||
    submission?.status === 'reviewing';

  // Get status-specific message for PDF restriction
  const getPdfRestrictionMessage = () => {
    switch (submission?.status) {
      case 'draft':
        return 'Submit your PDS to enable PDF download';
      case 'rejected':
        return 'Address feedback and resubmit to enable PDF download';
      case 'approved':
      case 'submitted':
      case 'reviewing':
        return 'PDF download available';
      default:
        return 'Submit your PDS to enable PDF download';
    }
  };

  // PDF generation hook
  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  // Transform PDS data for PDF generation
  const pdfReadyData = useMemo(() => {
    if (!pdsData || !submission) {
      console.log('PDF data transformation skipped:', {
        hasPdsData: !!pdsData,
        hasSubmission: !!submission,
      });
      return null;
    }

    // Debug log to check data structure
    console.log('Transforming PDS data for PDF:', {
      hasPersonalInfo: !!pdsData.personalInfo,
      personalInfoKeys: pdsData.personalInfo
        ? Object.keys(pdsData.personalInfo)
        : [],
      hasSurname: !!pdsData.personalInfo?.surname,
      hasFirstName: !!pdsData.personalInfo?.firstName,
    });

    try {
      return transformPdsForPdf({
        ...pdsData,
        id: submission.id,
        submittedAt: submission.submittedAt,
        version: submission.version,
      });
    } catch (error) {
      console.error('Error transforming PDS data for PDF:', error);
      return null;
    }
  }, [pdsData, submission]);

  // Handler for downloading PDF
  const handleDownload = useCallback(async () => {
    // Validate that pdfReadyData exists
    if (!pdfReadyData) {
      toast.error('PDS data not available', {
        description: 'Unable to generate PDF. Please try again.',
      });
      return;
    }

    // Validate required personal info fields exist
    if (
      !pdfReadyData.personalInfo ||
      !pdfReadyData.personalInfo.surname ||
      !pdfReadyData.personalInfo.firstName
    ) {
      console.error('Missing required personal info:', {
        hasPersonalInfo: !!pdfReadyData.personalInfo,
        hasSurname: !!pdfReadyData.personalInfo?.surname,
        hasFirstName: !!pdfReadyData.personalInfo?.firstName,
      });
      toast.error('Incomplete PDS data', {
        description:
          'Required personal information is missing. Please ensure your PDS is complete.',
      });
      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      await downloadPDF(pdfReadyData);
      toast.success('PDF downloaded successfully', {
        id: 'pdf-download',
        description: `PDS_${pdfReadyData.personalInfo.surname}_${pdfReadyData.personalInfo.firstName}.pdf`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        id: 'pdf-download',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }, [pdfReadyData, downloadPDF]);

  // Handler for printing (opens PDF in new tab)
  const handlePrint = useCallback(async () => {
    // Validate that pdfReadyData exists
    if (!pdfReadyData) {
      toast.error('PDS data not available', {
        description: 'Unable to generate PDF for printing. Please try again.',
      });
      return;
    }

    // Validate required personal info fields exist
    if (
      !pdfReadyData.personalInfo ||
      !pdfReadyData.personalInfo.surname ||
      !pdfReadyData.personalInfo.firstName
    ) {
      console.error('Missing required personal info:', {
        hasPersonalInfo: !!pdfReadyData.personalInfo,
        hasSurname: !!pdfReadyData.personalInfo?.surname,
        hasFirstName: !!pdfReadyData.personalInfo?.firstName,
      });
      toast.error('Incomplete PDS data', {
        description:
          'Required personal information is missing. Please ensure your PDS is complete.',
      });
      return;
    }

    try {
      toast.loading('Preparing print preview...', { id: 'pdf-print' });
      await openPDFInNewTab(pdfReadyData);
      toast.success('PDF opened in new tab', {
        id: 'pdf-print',
        description:
          'Use the browser print function (Ctrl+P / Cmd+P) to print.',
      });
    } catch (error) {
      console.error('Print preview error:', error);
      toast.error('Failed to open print preview', {
        id: 'pdf-print',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }, [pdfReadyData, openPDFInNewTab]);

  if (loading || !pdsData || !submission) {
    return <LoadingState />;
  }

  const submissionYear = submission.submittedAt
    ? new Date(submission.submittedAt).getFullYear()
    : new Date(submission.createdAt).getFullYear();

  const statusConfig =
    STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG];

  const handleEdit = () => router.push(`/dashboard/pds/edit/${pdsId}`);

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <BlurFade delay={0.05}>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link
            href="/dashboard"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href="/dashboard/pds/view"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            PDS
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            View Details
          </span>
        </div>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Personal Data Sheet {submissionYear}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              PDS {submission.year} • Submitted{' '}
              {format(
                new Date(submission.submittedAt || submission.createdAt),
                'MMM d, yyyy'
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('px-2 py-0.5', statusConfig.color)}>
                {statusConfig.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDownload}
                disabled={isGenerating || !canDownloadPDF}
                title={
                  !canDownloadPDF ? getPdfRestrictionMessage() : undefined
                }>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handlePrint}
                disabled={isGenerating || !canDownloadPDF}
                title={
                  !canDownloadPDF ? getPdfRestrictionMessage() : undefined
                }>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Print
              </Button>
              {canEdit && (
                <Button
                  size="sm"
                  className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]"
                  onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
            {/* PDF Restriction Notice */}
            {!canDownloadPDF && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Info className="h-3.5 w-3.5" />
                <span>{getPdfRestrictionMessage()}</span>
              </div>
            )}
          </div>
        </div>
      </BlurFade>

      {/* Approval Feedback Panel */}
      {submission.status === 'approved' && submission.reviewNotes && (
        <BlurFade delay={0.12}>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Reviewer Feedback
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1 whitespace-pre-wrap">
                  {submission.reviewNotes}
                </p>
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Rejection Feedback Panel */}
      {submission.status === 'rejected' && submission.rejectionReason && (
        <BlurFade delay={0.12}>
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                  Submission Rejected
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-500 mt-1">
                  {submission.rejectionReason}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-rose-300 hover:bg-rose-100 dark:border-rose-700 dark:hover:bg-rose-900/20"
                  onClick={handleEdit}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit & Resubmit
                </Button>
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {/* I. PERSONAL INFORMATION */}
      <Section
        title="I. Personal Information"
        icon={User}
        defaultOpen
        delay={0.15}>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Surname" value={pdsData.personalInfo?.surname} />
            <Field label="First Name" value={pdsData.personalInfo?.firstName} />
            <Field
              label="Middle Name"
              value={pdsData.personalInfo?.middleName}
            />
            <Field
              label="Name Extension"
              value={pdsData.personalInfo?.nameExtension}
            />
            <Field
              label="Date of Birth"
              value={
                pdsData.personalInfo?.dateOfBirth
                  ? format(
                      new Date(pdsData.personalInfo.dateOfBirth),
                      'MMM d, yyyy'
                    )
                  : 'N/A'
              }
            />
            <Field
              label="Place of Birth"
              value={pdsData.personalInfo?.placeOfBirth}
            />
            <Field label="Sex" value={pdsData.personalInfo?.sex} />
            <Field
              label="Civil Status"
              value={pdsData.personalInfo?.civilStatus}
            />
            <Field label="Height (m)" value={pdsData.personalInfo?.heightM} />
            <Field label="Weight (kg)" value={pdsData.personalInfo?.weightKg} />
            <Field label="Blood Type" value={pdsData.personalInfo?.bloodType} />
            <Field
              label="Citizenship"
              value={
                pdsData.personalInfo?.citizenship
                  ? `${pdsData.personalInfo.citizenship.type}${
                      pdsData.personalInfo.citizenship.details
                        ? ` - ${pdsData.personalInfo.citizenship.details}`
                        : ''
                    }`
                  : undefined
              }
            />
          </div>

          {/* Government IDs */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Government IDs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="GSIS ID No." value={pdsData.personalInfo?.gsisNo} />
              <Field
                label="PAG-IBIG ID No."
                value={pdsData.personalInfo?.pagibigNo}
              />
              <Field
                label="PhilHealth No."
                value={pdsData.personalInfo?.philhealthNo}
              />
              <Field label="SSS No." value={pdsData.personalInfo?.sssNo} />
              <Field label="TIN" value={pdsData.personalInfo?.tinNo} />
              <Field
                label="Agency Employee No."
                value={pdsData.personalInfo?.agencyEmployeeNo}
              />
            </div>
          </div>

          {/* Residential Address */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Residential Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="House/Block/Lot No."
                value={pdsData.personalInfo?.residentialAddress?.houseNumber}
              />
              <Field
                label="Street"
                value={pdsData.personalInfo?.residentialAddress?.streetName}
              />
              <Field
                label="Subdivision/Village"
                value={pdsData.personalInfo?.residentialAddress?.subdivision}
              />
              <Field
                label="Barangay"
                value={pdsData.personalInfo?.residentialAddress?.barangay}
              />
              <Field
                label="City/Municipality"
                value={
                  pdsData.personalInfo?.residentialAddress?.cityMunicipality
                }
              />
              <Field
                label="Province"
                value={pdsData.personalInfo?.residentialAddress?.province}
              />
              <Field
                label="Region"
                value={pdsData.personalInfo?.residentialAddress?.region}
              />
              <Field
                label="Zip Code"
                value={pdsData.personalInfo?.residentialAddress?.zipCode}
              />
            </div>
          </div>

          {/* Permanent Address */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Permanent Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="House/Block/Lot No."
                value={pdsData.personalInfo?.permanentAddress?.houseNumber}
              />
              <Field
                label="Street"
                value={pdsData.personalInfo?.permanentAddress?.streetName}
              />
              <Field
                label="Subdivision/Village"
                value={pdsData.personalInfo?.permanentAddress?.subdivision}
              />
              <Field
                label="Barangay"
                value={pdsData.personalInfo?.permanentAddress?.barangay}
              />
              <Field
                label="City/Municipality"
                value={pdsData.personalInfo?.permanentAddress?.cityMunicipality}
              />
              <Field
                label="Province"
                value={pdsData.personalInfo?.permanentAddress?.province}
              />
              <Field
                label="Region"
                value={pdsData.personalInfo?.permanentAddress?.region}
              />
              <Field
                label="Zip Code"
                value={pdsData.personalInfo?.permanentAddress?.zipCode}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Phone className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Telephone No."
                value={pdsData.personalInfo?.telephoneNo}
              />
              <Field
                label="Mobile No."
                value={pdsData.personalInfo?.mobileNo}
              />
              <Field
                label="Email Address"
                value={pdsData.personalInfo?.emailAddress}
                fullWidth
              />
            </div>
          </div>
        </div>
      </Section>

      {/* II. FAMILY BACKGROUND */}
      <Section title="II. Family Background" icon={Users} delay={0.2}>
        <div className="space-y-4">
          {/* Spouse */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Spouse Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Surname"
                value={
                  pdsData.family?.spouseSurname ||
                  pdsData.familyBackground?.spouseSurname
                }
              />
              <Field
                label="First Name"
                value={
                  pdsData.family?.spouseFirstName ||
                  pdsData.familyBackground?.spouseFirstName
                }
              />
              <Field
                label="Middle Name"
                value={
                  pdsData.family?.spouseMiddleName ||
                  pdsData.familyBackground?.spouseMiddleName
                }
              />
              <Field
                label="Name Extension"
                value={
                  pdsData.family?.spouseNameExtension ||
                  pdsData.familyBackground?.spouseNameExtension
                }
              />
              <Field
                label="Occupation"
                value={
                  pdsData.family?.spouseOccupation ||
                  pdsData.familyBackground?.spouseOccupation
                }
              />
              <Field
                label="Employer/Business Name"
                value={
                  pdsData.family?.spouseEmployer ||
                  pdsData.familyBackground?.spouseEmployer
                }
              />
              <Field
                label="Business Address"
                value={
                  pdsData.family?.spouseBusinessAddress ||
                  pdsData.familyBackground?.spouseBusinessAddress
                }
                fullWidth
              />
              <Field
                label="Telephone No."
                value={
                  pdsData.family?.spouseTelephoneNo ||
                  pdsData.familyBackground?.spouseTelephoneNo
                }
              />
            </div>
          </div>

          {/* Parents */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Father&apos;s Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Surname"
                value={
                  pdsData.family?.fatherSurname ||
                  pdsData.familyBackground?.fatherSurname
                }
              />
              <Field
                label="First Name"
                value={
                  pdsData.family?.fatherFirstName ||
                  pdsData.familyBackground?.fatherFirstName
                }
              />
              <Field
                label="Middle Name"
                value={
                  pdsData.family?.fatherMiddleName ||
                  pdsData.familyBackground?.fatherMiddleName
                }
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Mother&apos;s Maiden Name
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Surname"
                value={
                  pdsData.family?.motherMaidenSurname ||
                  pdsData.familyBackground?.motherMaidenSurname
                }
              />
              <Field
                label="First Name"
                value={
                  pdsData.family?.motherFirstName ||
                  pdsData.familyBackground?.motherFirstName
                }
              />
              <Field
                label="Middle Name"
                value={
                  pdsData.family?.motherMiddleName ||
                  pdsData.familyBackground?.motherMiddleName
                }
              />
            </div>
          </div>

          {/* Children */}
          {(pdsData.family?.children || pdsData.children) &&
            (pdsData.family?.children || pdsData.children || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Children
                </h3>
                <div className="space-y-2">
                  {(pdsData.family?.children || pdsData.children || []).map(
                    (child: PdsChildRecord, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-6">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 flex-1">
                          {child.fullName}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {child.dateOfBirth
                            ? format(new Date(child.dateOfBirth), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </Section>

      {/* III. EDUCATIONAL BACKGROUND */}
      <Section
        title="III. Educational Background"
        icon={GraduationCap}
        delay={0.25}>
        <div className="space-y-3">
          {pdsData.education &&
          typeof pdsData.education === 'object' &&
          !Array.isArray(pdsData.education) ? (
            [
              'elementary',
              'secondary',
              'vocational',
              'college',
              'graduate',
            ].map((level) => {
              const eduObj = pdsData.education as unknown as Record<string, PdsEducationLevelRecord>;
              const edu = eduObj?.[level];
              if (!edu) return null;

              return (
                <div
                  key={level}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 capitalize text-slate-900 dark:text-slate-100">
                    {level}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label="School Name"
                      value={edu.schoolName}
                      fullWidth
                    />
                    <Field label="Degree/Course" value={edu.degreeCourse} />
                    <Field
                      label="Period From"
                      value={
                        edu.periodFrom
                          ? format(new Date(edu.periodFrom), 'yyyy')
                          : 'N/A'
                      }
                    />
                    <Field
                      label="Period To"
                      value={
                        edu.periodTo
                          ? format(new Date(edu.periodTo), 'yyyy')
                          : 'N/A'
                      }
                    />
                    <Field
                      label="Highest Level/Units Earned"
                      value={edu.highestLevelEarned}
                    />
                    <Field label="Year Graduated" value={edu.yearGraduated} />
                    <Field
                      label="Scholarship/Honors Received"
                      value={edu.honorsReceived}
                      fullWidth
                    />
                  </div>
                </div>
              );
            })
          ) : Array.isArray(pdsData.education) &&
            pdsData.education.length > 0 ? (
            pdsData.education.map((edu, index: number) => {
              const e = edu as Record<string, unknown>;
              return (
              <div
                key={index}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 capitalize text-slate-900 dark:text-slate-100">
                  {e.level as string}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="School Name" value={e.schoolName as string | null} fullWidth />
                  <Field label="Degree/Course" value={e.degreeCourse as string | null} />
                  <Field
                    label="Period From"
                    value={
                      e.periodFrom
                        ? format(new Date(e.periodFrom as string), 'yyyy')
                        : 'N/A'
                    }
                  />
                  <Field
                    label="Period To"
                    value={
                      e.periodTo
                        ? format(new Date(e.periodTo as string), 'yyyy')
                        : 'N/A'
                    }
                  />
                  <Field
                    label="Highest Level/Units Earned"
                    value={e.highestLevelEarned as string | null}
                  />
                  <Field label="Year Graduated" value={e.yearGraduated as string | number | null} />
                  <Field
                    label="Scholarship/Honors Received"
                    value={e.honorsReceived as string | null}
                    fullWidth
                  />
                </div>
              </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No educational background available
            </p>
          )}
        </div>
      </Section>

      {/* IV. CIVIL SERVICE ELIGIBILITY */}
      {((pdsData.eligibility && pdsData.eligibility.length > 0) ||
        (pdsData.civilService && pdsData.civilService.length > 0)) && (
        <Section title="IV. Civil Service Eligibility" icon={Award} delay={0.3}>
          <div className="space-y-3">
            {(pdsData.eligibility || pdsData.civilService || []).map(
              (elig: PdsEligibilityRecord, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label="Career Service/RA 1080/Board/Bar/Examination"
                      value={elig.eligibilityName}
                      fullWidth
                    />
                    <Field label="Rating" value={elig.rating} />
                    <Field
                      label="Date of Examination/Conferment"
                      value={
                        elig.dateOfExam
                          ? format(new Date(elig.dateOfExam), 'MMM d, yyyy')
                          : 'N/A'
                      }
                    />
                    <Field
                      label="Place of Examination/Conferment"
                      value={elig.placeOfExam}
                      fullWidth
                    />
                    <Field label="License No." value={elig.licenseNo} />
                    <Field
                      label="License Validity Date"
                      value={
                        elig.licenseValidityDate
                          ? format(
                              new Date(elig.licenseValidityDate),
                              'MMM d, yyyy'
                            )
                          : 'N/A'
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </Section>
      )}

      {/* V. WORK EXPERIENCE */}
      {pdsData.workExperience && pdsData.workExperience.length > 0 && (
        <Section title="V. Work Experience" icon={Briefcase} delay={0.35}>
          <div className="space-y-3">
            {pdsData.workExperience.map((work, index: number) => (
              <div
                key={index}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Position Title"
                    value={work.positionTitle}
                    fullWidth
                  />
                  <Field
                    label="Department/Agency/Office/Company"
                    value={work.departmentAgency}
                    fullWidth
                  />
                  <Field
                    label="From"
                    value={
                      work.dateFrom
                        ? format(new Date(work.dateFrom), 'MMM yyyy')
                        : 'N/A'
                    }
                  />
                  <Field
                    label="To"
                    value={
                      work.dateTo
                        ? format(new Date(work.dateTo), 'MMM yyyy')
                        : 'Present'
                    }
                  />
                  <Field
                    label="Monthly Salary"
                    value={
                      work.monthlySalary
                        ? `₱${work.monthlySalary.toLocaleString()}`
                        : 'N/A'
                    }
                  />
                  <Field label="Salary Grade" value={work.salaryGrade} />
                  <Field
                    label="Status of Appointment"
                    value={work.statusOfAppointment}
                  />
                  <Field label="Government Service" value={work.isGovernment} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* VI. VOLUNTARY WORK */}
      {pdsData.voluntaryWork && pdsData.voluntaryWork.length > 0 && (
        <Section title="VI. Voluntary Work" icon={Heart} delay={0.4}>
          <div className="space-y-3">
            {pdsData.voluntaryWork.map((vol, index: number) => (
              <div
                key={index}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Name & Address of Organization"
                    value={`${vol.organizationName || ''}${
                      vol.organizationAddress
                        ? ` - ${vol.organizationAddress}`
                        : ''
                    }`}
                    fullWidth
                  />
                  <Field
                    label="From"
                    value={
                      vol.dateFrom
                        ? format(new Date(vol.dateFrom), 'MMM yyyy')
                        : 'N/A'
                    }
                  />
                  <Field
                    label="To"
                    value={
                      vol.dateTo
                        ? format(new Date(vol.dateTo), 'MMM yyyy')
                        : 'Present'
                    }
                  />
                  <Field label="Number of Hours" value={vol.numberOfHours} />
                  <Field
                    label="Position/Nature of Work"
                    value={vol.positionNature}
                    fullWidth
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* VII. LEARNING & DEVELOPMENT */}
      {((pdsData.learningDevelopment &&
        pdsData.learningDevelopment.length > 0) ||
        (pdsData.training && pdsData.training.length > 0)) && (
        <Section
          title="VII. Learning and Development Interventions"
          icon={BookOpen}
          delay={0.45}>
          <div className="space-y-3">
            {(pdsData.learningDevelopment || pdsData.training || []).map(
              (training, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label="Title of Learning and Development Interventions"
                      value={training.title}
                      fullWidth
                    />
                    <Field
                      label="From"
                      value={
                        training.dateFrom
                          ? format(new Date(training.dateFrom), 'MMM d, yyyy')
                          : 'N/A'
                      }
                    />
                    <Field
                      label="To"
                      value={
                        training.dateTo
                          ? format(new Date(training.dateTo), 'MMM d, yyyy')
                          : 'N/A'
                      }
                    />
                    <Field label="Number of Hours" value={training.hours} />
                    <Field label="Type of LD" value={training.typeOfLd} />
                    <Field
                      label="Conducted/Sponsored By"
                      value={training.conductedBy}
                      fullWidth
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </Section>
      )}

      {/* VIII. OTHER INFORMATION */}
      <Section title="VIII. Other Information" icon={Star} delay={0.5}>
        <div className="space-y-4">
          {/* Special Skills */}
          {pdsData.otherInfo?.skills && (pdsData.otherInfo.skills as string[]).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                Special Skills and Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {(pdsData.otherInfo.skills as string[]).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recognitions */}
          {pdsData.otherInfo?.recognitions &&
            pdsData.otherInfo.recognitions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Non-Academic Distinctions/Recognition
                </h3>
                <div className="space-y-2">
                  {pdsData.otherInfo.recognitions.map(
                    (rec: PdsRecognitionRecord, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Field label="Title" value={rec.title} />
                          <Field label="Year" value={rec.year} />
                          <Field
                            label="Organization"
                            value={rec.organization}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Associations */}
          {pdsData.otherInfo?.associations &&
            pdsData.otherInfo.associations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Membership in Association/Organization
                </h3>
                <div className="space-y-2">
                  {pdsData.otherInfo.associations.map(
                    (assoc: PdsAssociationRecord, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Field label="Name" value={assoc.name} />
                          <Field label="Position" value={assoc.position} />
                          <Field label="Year Joined" value={assoc.yearJoined} />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Questions */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Supplementary Questions
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="34. Are you related by consanguinity or affinity to the appointing or recommending authority?"
                  value={pdsData.otherInfo?.questions?.Q34_related_to_authority ?? pdsData.otherInfo?.questions?.Q34_criminal_charged}
                />
                {(pdsData.otherInfo?.questions?.Q34_related_to_authority ?? pdsData.otherInfo?.questions?.Q34_criminal_charged) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q34_related_to_authority_details ?? pdsData.otherInfo?.questions?.Q34_criminal_charged_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="35a. Have you ever been found guilty of any administrative offense?"
                  value={pdsData.otherInfo?.questions?.Q35a_admin_offense ?? pdsData.otherInfo?.questions?.Q35_criminal_convicted}
                />
                {(pdsData.otherInfo?.questions?.Q35a_admin_offense ?? pdsData.otherInfo?.questions?.Q35_criminal_convicted) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q35a_admin_offense_details ?? pdsData.otherInfo?.questions?.Q35_criminal_convicted_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="35b. Have you ever been criminally charged before any court?"
                  value={pdsData.otherInfo?.questions?.Q35b_criminal_charged}
                />
                {pdsData.otherInfo?.questions?.Q35b_criminal_charged && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q35b_criminal_charged_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="36. Have you ever been convicted of any crime or violation?"
                  value={pdsData.otherInfo?.questions?.Q36_convicted_of_crime}
                />
                {pdsData.otherInfo?.questions?.Q36_convicted_of_crime && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q36_convicted_of_crime_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="37. Have you ever been separated from the service?"
                  value={
                    pdsData.otherInfo?.questions?.Q37_separated_from_service ?? pdsData.otherInfo?.questions?.Q36_separated_from_service
                  }
                />
                {(pdsData.otherInfo?.questions?.Q37_separated_from_service ?? pdsData.otherInfo?.questions?.Q36_separated_from_service) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q37_separated_from_service_details ?? pdsData.otherInfo?.questions?.Q36_separated_from_service_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="38a. Have you ever been a candidate in a national or local election?"
                  value={
                    pdsData.otherInfo?.questions?.Q38a_candidate_for_election ?? pdsData.otherInfo?.questions?.Q37_candidate_for_election
                  }
                />
                {(pdsData.otherInfo?.questions?.Q38a_candidate_for_election ?? pdsData.otherInfo?.questions?.Q37_candidate_for_election) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q38a_candidate_for_election_details ?? pdsData.otherInfo?.questions?.Q37_candidate_for_election_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="38b. Have you resigned from government service to campaign?"
                  value={
                    pdsData.otherInfo?.questions?.Q38b_resigned_to_campaign ?? pdsData.otherInfo?.questions?.Q38_resigned_from_government
                  }
                />
                {(pdsData.otherInfo?.questions?.Q38b_resigned_to_campaign ?? pdsData.otherInfo?.questions?.Q38_resigned_from_government) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q38b_resigned_to_campaign_details ?? pdsData.otherInfo?.questions?.Q38_resigned_from_government_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="39. Have you acquired immigrant or permanent resident status?"
                  value={
                    pdsData.otherInfo?.questions?.Q39_immigrant_status ?? pdsData.otherInfo?.questions?.Q39_immigrant_or_acquired_residence
                  }
                />
                {(pdsData.otherInfo?.questions?.Q39_immigrant_status ?? pdsData.otherInfo?.questions?.Q39_immigrant_or_acquired_residence) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q39_immigrant_status_details ?? pdsData.otherInfo?.questions?.Q39_immigrant_or_acquired_residence_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="40a. Are you a member of any indigenous group?"
                  value={pdsData.otherInfo?.questions?.Q40a_indigenous_group ?? pdsData.otherInfo?.questions?.Q40_indigenous_group}
                />
                {(pdsData.otherInfo?.questions?.Q40a_indigenous_group ?? pdsData.otherInfo?.questions?.Q40_indigenous_group) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q40a_indigenous_group_details ?? pdsData.otherInfo?.questions?.Q40_indigenous_group_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="40b. Are you a person with disability?"
                  value={pdsData.otherInfo?.questions?.Q40b_disabled ?? pdsData.otherInfo?.questions?.Q41_disabled}
                />
                {(pdsData.otherInfo?.questions?.Q40b_disabled ?? pdsData.otherInfo?.questions?.Q41_disabled) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q40b_disabled_details ?? pdsData.otherInfo?.questions?.Q41_disabled_details
                    }
                    fullWidth
                  />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field
                  label="40c. Are you a solo parent?"
                  value={pdsData.otherInfo?.questions?.Q40c_solo_parent ?? pdsData.otherInfo?.questions?.Q42_solo_parent}
                />
                {(pdsData.otherInfo?.questions?.Q40c_solo_parent ?? pdsData.otherInfo?.questions?.Q42_solo_parent) && (
                  <Field
                    label="Details"
                    value={
                      pdsData.otherInfo?.questions?.Q40c_solo_parent_details ?? pdsData.otherInfo?.questions?.Q42_solo_parent_details
                    }
                    fullWidth
                  />
                )}
              </div>
            </div>
          </div>

          {/* References */}
          {pdsData.otherInfo?.references &&
            pdsData.otherInfo.references.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  Character References
                </h3>
                <div className="space-y-2">
                  {pdsData.otherInfo.references.map(
                    (ref: PdsReferenceRecord, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Field label="Name" value={ref.name} />
                          <Field label="Address" value={ref.address} />
                          <Field
                            label="Telephone No."
                            value={ref.telephoneNo}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </Section>
    </div>
  );
}
