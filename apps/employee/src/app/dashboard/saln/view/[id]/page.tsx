'use client';

/**
 * SALN View Detail Page
 * CSC Form SALN 2019 Revised - Read-Only View
 *
 * Design: Clean, minimalistic, modern, premium
 * Layout: Collapsible sections with compact two-column grid
 * Theme: TUP red accent - oklch(0.55_0.22_15)
 */

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../providers/AuthProvider';
import { useSALNSubmission } from '../../../../../hooks/useSALN';
import { useSALNPdf } from '../../../../../hooks/useSALNPdf';
import type { SALNData } from '../../../../../components/saln/pdf';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmployeeOnlyGuard } from '../../../../../components/guards/EmployeeOnlyGuard';
import {
  Download,
  Printer,
  Edit,
  ChevronRight,
  ChevronDown,
  User,
  DollarSign,
  Home,
  Package,
  CreditCard,
  Briefcase,
  Users,
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
import { formatCurrency } from '../../../../../lib/utils/currency';

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

// Local interfaces for useSALNSubmission response (different field names than list endpoint)
interface ViewRealProperty {
  description: string;
  kind: string;
  exactLocation: string;
  assessedValue: number | string;
  currentFairMarketValue: number | string;
  acquisitionYear: number;
  acquisitionMode: string;
}

interface ViewPersonalProperty {
  description: string;
  yearAcquired: number;
  acquisitionCost: number | string;
}

interface ViewLiability {
  nature: string;
  creditorName: string;
  outstandingBalance: number | string;
}

interface ViewBusinessInterest {
  businessName?: string;
  entityName?: string;
  businessAddress: string;
  nature?: string;
  natureOfBusiness?: string;
  dateAcquired?: string;
  dateOfAcquisition?: string;
  owner?: string;
}

interface ViewRelativeInGov {
  name: string;
  relationship: string;
  position: string;
  agency?: string;
  agencyAddress?: string;
}

interface ProfileData {
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
}

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
  isCurrency?: boolean;
}

const Field = React.memo(
  ({ label, value, fullWidth = false, isCurrency = false }: FieldProps) => {
    let displayValue =
      value === null || value === undefined || value === ''
        ? 'N/A'
        : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : String(value);

    if (isCurrency && typeof value === 'number') {
      displayValue = formatCurrency(value);
    }

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
  }
);

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
      Loading SALN details...
    </p>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SALNViewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: salnId } = use(params);
  const router = useRouter();
  const { profile } = useAuth();

  // Use new React Query hook
  const { data: salnData, isLoading } = useSALNSubmission(salnId);
  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();
  const loading = isLoading;

  // Extract submission metadata from salnData
  // salnData has shape: { submission: {...}, realProperties: [...], ... }
  // submission contains Part I declarant info: year, filingType, spouseName, position, agency, officeAddress
  const submission = salnData?.submission;

  const canEdit =
    submission?.status === 'draft' || submission?.status === 'rejected';

  // Parse spouse name safely
  const parseSpouseName = (spouseName: string | null | undefined) => {
    if (!spouseName || typeof spouseName !== 'string') {
      return { surname: '', firstName: '', middleInitial: null };
    }

    const nameParts = spouseName.trim().split(/\s+/);

    if (nameParts.length === 0) {
      return { surname: '', firstName: '', middleInitial: null };
    } else if (nameParts.length === 1) {
      // Only one name part - use as surname
      return { surname: nameParts[0], firstName: '', middleInitial: null };
    } else if (nameParts.length === 2) {
      // Two parts: firstName lastName
      return {
        surname: nameParts[1],
        firstName: nameParts[0],
        middleInitial: null
      };
    } else {
      // Three or more parts: firstName middleName(s) lastName
      return {
        surname: nameParts[nameParts.length - 1],
        firstName: nameParts[0],
        middleInitial: nameParts[1].charAt(0) || null,
      };
    }
  };

  // Transform SALN data to SALNData format for PDF
  // salnData: { submission: {...}, realProperties: [...], ... }
  // profile: user profile for declarant name
  const transformSALNToData = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- useSALNSubmission returns untyped data; sub-types don't match SALNData PDF types
    salnDataInput: any,
    profileInput: ProfileData
  ): SALNData => {
    // Validate required fields exist
    if (!salnDataInput) {
      throw new Error('SALN data is missing');
    }

    // salnData has nested structure: { submission: {...}, realProperties: [...], ... }
    const submissionMeta = salnDataInput.submission || salnDataInput;

    if (!profileInput) {
      throw new Error('Profile data is missing');
    }

    const spouseParsedName = parseSpouseName(submissionMeta.spouseName);

    return {
      id: submissionMeta.id || '',
      year: submissionMeta.year || new Date().getFullYear(),
      filingType: submissionMeta.filingType || 'not_applicable',
      declarantInfo: {
        surname: profileInput?.lastName || '',
        firstName: profileInput?.firstName || '',
        middleInitial: profileInput?.middleName || null,
        position: submissionMeta.position || '',
        agency:
          submissionMeta.agency ||
          'Technological University of the Philippines - Manila',
        officeAddress: submissionMeta.officeAddress || '',
      },
      spouseInfo:
        submissionMeta.filingType === 'joint' && submissionMeta.spouseName
          ? {
              surname: spouseParsedName.surname,
              firstName: spouseParsedName.firstName,
              middleInitial: spouseParsedName.middleInitial,
              position: '',
              agency: '',
              officeAddress: '',
            }
          : undefined,
      children: [],
      // Arrays are at the root of salnData, not inside submission
      realProperties: salnDataInput.realProperties || [],
      personalProperties: salnDataInput.personalProperties || [],
      liabilities: salnDataInput.liabilities || [],
      businessInterests:
        salnDataInput.businessInterests?.map((bi: ViewBusinessInterest) => ({
          entityName: bi.businessName || bi.entityName || '',
          businessAddress: bi.businessAddress || '',
          natureOfBusiness: bi.nature || bi.natureOfBusiness || '',
          dateOfAcquisition: bi.dateAcquired || bi.dateOfAcquisition || '',
        })) || [],
      relativesInGov:
        salnDataInput.relativesInGov?.map((rel: ViewRelativeInGov) => ({
          name: rel.name || '',
          relationship: rel.relationship || '',
          position: rel.position || '',
          agencyAddress: rel.agency || rel.agencyAddress || '',
        })) || [],
      // Calculate totals from arrays
      totalAssets: 0, // Will be recalculated
      totalLiabilities: 0, // Will be recalculated
      netWorth: 0, // Will be recalculated
    };
  };

  if (loading || !submission || !salnData) {
    return <LoadingState />;
  }

  const submissionYear = submission.year;
  const statusConfig =
    STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;

  const handleEdit = () => router.push(`/dashboard/saln/edit/${salnId}`);

  const handleDownload = async () => {
    try {
      // Validate data exists before transformation
      if (!salnData) {
        toast.error('SALN data is not available');
        return;
      }

      if (!profile) {
        toast.error('Profile information is not available');
        return;
      }

      // Validate required fields for declarant
      if (!profile.lastName || !profile.firstName) {
        toast.error('Profile name information is incomplete. Please update your profile.');
        return;
      }

      // Transform data with error handling - pass full salnData, not just submission
      const salnPdfData = transformSALNToData(salnData, profile);

      // Download PDF (validation happens in useSALNPdf hook)
      await downloadPDF(salnPdfData);
      toast.success('SALN PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);

      // User-friendly error messages
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to generate PDF';

      toast.error(errorMessage, {
        description: 'Please check that all required information is complete and try again.',
        duration: 5000,
      });
    }
  };

  const handlePrint = async () => {
    try {
      // Validate data exists before transformation
      if (!salnData) {
        toast.error('SALN data is not available');
        return;
      }

      if (!profile) {
        toast.error('Profile information is not available');
        return;
      }

      // Validate required fields for declarant
      if (!profile.lastName || !profile.firstName) {
        toast.error('Profile name information is incomplete. Please update your profile.');
        return;
      }

      // Transform data with error handling - pass full salnData, not just submission
      const salnPdfData = transformSALNToData(salnData, profile);

      // Open PDF in new tab (validation happens in useSALNPdf hook)
      await openPDFInNewTab(salnPdfData);
    } catch (error) {
      console.error('PDF preview error:', error);

      // User-friendly error messages
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to open PDF preview';

      toast.error(errorMessage, {
        description: 'Please check that all required information is complete and try again.',
        duration: 5000,
      });
    }
  };

  // Calculate totals
  const totalRealProperty =
    salnData.realProperties?.reduce(
      (sum: number, prop: ViewRealProperty) => sum + (Number(prop.currentFairMarketValue) || 0),
      0
    ) || 0;
  const totalPersonalProperty =
    salnData.personalProperties?.reduce(
      (sum: number, prop: ViewPersonalProperty) => sum + (Number(prop.acquisitionCost) || 0),
      0
    ) || 0;
  const totalAssets = totalRealProperty + totalPersonalProperty;
  const totalLiabilities =
    salnData.liabilities?.reduce(
      (sum: number, liability: ViewLiability) => sum + (Number(liability.outstandingBalance) || 0),
      0
    ) || 0;
  const netWorth = totalAssets - totalLiabilities;

  return (
    <EmployeeOnlyGuard>
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
            href="/dashboard/saln/view"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            SALN
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
              Statement of Assets, Liabilities, and Net Worth
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              As of December 31, {submissionYear}
              {(submission.submittedAt || submission.createdAt) && (
                <>
                  {' • Submitted '}
                  {format(
                    new Date(submission.submittedAt || submission.createdAt),
                    'MMM d, yyyy'
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('px-2 py-0.5', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownload}
              disabled={isGenerating}>
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Export PDF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handlePrint}
              disabled={isGenerating}>
              <Printer className="h-4 w-4" />
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
        </div>
      </BlurFade>

      {/* I. DECLARANT & SPOUSE INFORMATION */}
      <Section
        title="I. Declarant & Spouse Information"
        icon={User}
        defaultOpen
        delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Filing Type"
            value={
              submission.filingType === 'joint'
                ? 'Joint Filing'
                : submission.filingType === 'separate'
                ? 'Separate Filing'
                : 'Not Applicable'
            }
          />
          <Field label="Year" value={submissionYear} />
          {submission.filingType === 'joint' && (
            <Field
              label="Spouse Name"
              value={submission.spouseName}
              fullWidth
            />
          )}
          <Field label="Position" value={submission.position} />
          <Field label="Agency/Office" value={submission.agency} />
          <Field
            label="Office Address"
            value={submission.officeAddress}
            fullWidth
          />
        </div>
      </Section>

      {/* II. FINANCIAL SUMMARY */}
      <Section
        title="II. Financial Summary"
        icon={DollarSign}
        defaultOpen
        delay={0.2}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                Total Assets
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAssets)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real: {formatCurrency(totalRealProperty)} • Personal:{' '}
                {formatCurrency(totalPersonalProperty)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                Total Liabilities
              </p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalLiabilities)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-[oklch(0.55_0.22_15)] to-[oklch(0.45_0.22_15)] text-white rounded-lg">
              <p className="text-xs opacity-90 font-medium mb-1">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
              <p className="text-xs opacity-75 mt-1">
                Assets minus Liabilities
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* III. REAL PROPERTIES */}
      <Section title="III. Real Properties" icon={Home} delay={0.25}>
        {salnData.realProperties && salnData.realProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Description
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kind
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Location
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Assessed Value
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Market Value
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Acquisition
                  </th>
                </tr>
              </thead>
              <tbody>
                {salnData.realProperties.map((prop: ViewRealProperty, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {prop.description}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300 capitalize">
                      {prop.kind}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {prop.exactLocation}
                    </td>
                    <td className="p-2 text-right text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(prop.assessedValue))}
                    </td>
                    <td className="p-2 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(prop.currentFairMarketValue))}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {prop.acquisitionYear} • {prop.acquisitionMode}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-900/50 font-semibold">
                  <td
                    colSpan={4}
                    className="p-2 text-right text-slate-900 dark:text-slate-100">
                    Total Real Properties:
                  </td>
                  <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalRealProperty)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No real properties declared
          </p>
        )}
      </Section>

      {/* IV. PERSONAL PROPERTIES */}
      <Section title="IV. Personal Properties" icon={Package} delay={0.3}>
        {salnData.personalProperties &&
        salnData.personalProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Description
                  </th>
                  <th className="text-center p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Year Acquired
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {salnData.personalProperties.map((prop: ViewPersonalProperty, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {prop.description}
                    </td>
                    <td className="p-2 text-center text-slate-700 dark:text-slate-300">
                      {prop.yearAcquired}
                    </td>
                    <td className="p-2 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(prop.acquisitionCost))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-900/50 font-semibold">
                  <td
                    colSpan={2}
                    className="p-2 text-right text-slate-900 dark:text-slate-100">
                    Total Personal Properties:
                  </td>
                  <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalPersonalProperty)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No personal properties declared
          </p>
        )}
      </Section>

      {/* V. LIABILITIES */}
      <Section title="V. Liabilities" icon={CreditCard} delay={0.35}>
        {salnData.liabilities && salnData.liabilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nature
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Creditors
                  </th>
                  <th className="text-right p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Outstanding Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {salnData.liabilities.map((liability: ViewLiability, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {liability.nature}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {liability.creditorName}
                    </td>
                    <td className="p-2 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(liability.outstandingBalance))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-900/50 font-semibold">
                  <td
                    colSpan={2}
                    className="p-2 text-right text-slate-900 dark:text-slate-100">
                    Total Liabilities:
                  </td>
                  <td className="p-2 text-right text-rose-600 dark:text-rose-400">
                    {formatCurrency(totalLiabilities)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No liabilities declared
          </p>
        )}
      </Section>

      {/* VI. BUSINESS INTERESTS */}
      {salnData.businessInterests && salnData.businessInterests.length > 0 && (
        <Section title="VI. Business Interests" icon={Briefcase} delay={0.4}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Entity Name
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Address
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nature
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {salnData.businessInterests.map((business: ViewBusinessInterest, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {business.entityName}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {business.businessAddress}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {business.natureOfBusiness}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {business.dateOfAcquisition
                        ? format(new Date(business.dateOfAcquisition), 'MMM d, yyyy')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* VII. RELATIVES IN GOVERNMENT */}
      {salnData.relativesInGov && salnData.relativesInGov.length > 0 && (
        <Section title="VII. Relatives in Government" icon={Users} delay={0.45}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Name
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Relationship
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Position
                  </th>
                  <th className="text-left p-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {salnData.relativesInGov.map((relative: ViewRelativeInGov, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {relative.name}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {relative.relationship}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {relative.position}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">
                      {relative.agencyAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
    </EmployeeOnlyGuard>
  );
}
