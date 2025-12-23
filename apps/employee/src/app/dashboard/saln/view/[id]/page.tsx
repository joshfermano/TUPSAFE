'use client';

/**
 * SALN View Detail Page
 * CSC Form SALN 2019 Revised - Read-Only View
 *
 * Design: Clean, minimalistic, modern, premium
 * Layout: Collapsible sections with compact two-column grid
 * Theme: TUP red accent - oklch(0.55_0.22_15)
 */

import React, { useMemo, use } from 'react';
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
import type { CompleteSalnData } from '../../../../../lib/validations/saln-schema';

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
  const { user, profile } = useAuth();

  // Use new React Query hook
  const { data: salnData, isLoading } = useSALNSubmission(salnId);
  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();
  const loading = isLoading;

  // Extract submission data from salnData
  const submission = salnData;

  const canEdit =
    submission?.status === 'draft' || submission?.status === 'rejected';

  // Transform submission data to SALNData format for PDF
  const transformSALNToData = (
    submission: any,
    profile: any
  ): SALNData => {
    return {
      id: submission.id,
      year: submission.year,
      filingType: submission.filingType || 'not_applicable',
      declarantInfo: {
        surname: profile?.lastName || '',
        firstName: profile?.firstName || '',
        middleInitial: profile?.middleName || null,
        position: submission.position || '',
        agency:
          submission.agency ||
          'Technological University of the Philippines - Manila',
        officeAddress: submission.officeAddress || '',
      },
      spouseInfo:
        submission.filingType === 'joint' && submission.spouseName
          ? {
              surname: submission.spouseName?.split(' ').pop() || '',
              firstName: submission.spouseName?.split(' ')[0] || '',
              middleInitial: submission.spouseName?.split(' ')[1]?.charAt(0) || null,
              position: '',
              agency: '',
              officeAddress: '',
            }
          : undefined,
      children: [],
      realProperties: submission.realProperties || [],
      personalProperties: submission.personalProperties || [],
      liabilities: submission.liabilities || [],
      businessInterests:
        submission.businessInterests?.map((bi: any) => ({
          entityName: bi.businessName || bi.entityName || '',
          businessAddress: bi.businessAddress || '',
          natureOfBusiness: bi.nature || bi.natureOfBusiness || '',
          dateOfAcquisition: bi.dateAcquired || bi.dateOfAcquisition || '',
        })) || [],
      relativesInGov:
        submission.relativesInGov?.map((rel: any) => ({
          name: rel.name || '',
          relationship: rel.relationship || '',
          position: rel.position || '',
          agencyAddress: rel.agency || rel.agencyAddress || '',
        })) || [],
      totalAssets: parseFloat(submission.totalAssets || '0'),
      totalLiabilities: parseFloat(submission.totalLiabilities || '0'),
      netWorth: parseFloat(submission.netWorth || '0'),
    };
  };

  if (loading || !submission || !salnData) {
    return <LoadingState />;
  }

  const submissionYear = submission.year;
  const statusConfig =
    STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG];

  const handleEdit = () => router.push(`/dashboard/saln/edit/${salnId}`);

  const handleDownload = async () => {
    try {
      const salnPdfData = transformSALNToData(submission, profile);
      await downloadPDF(salnPdfData);
      toast.success('SALN PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const handlePrint = async () => {
    try {
      const salnPdfData = transformSALNToData(submission, profile);
      await openPDFInNewTab(salnPdfData);
    } catch (error) {
      toast.error('Failed to open PDF');
      console.error('PDF preview error:', error);
    }
  };

  // Calculate totals
  const totalRealProperty =
    salnData.realProperties?.reduce(
      (sum: number, prop: any) => sum + (Number(prop.currentFairMarketValue) || 0),
      0
    ) || 0;
  const totalPersonalProperty =
    salnData.personalProperties?.reduce(
      (sum: number, prop: any) => sum + (Number(prop.acquisitionCost) || 0),
      0
    ) || 0;
  const totalAssets = totalRealProperty + totalPersonalProperty;
  const totalLiabilities =
    salnData.liabilities?.reduce(
      (sum: number, liability: any) => sum + (Number(liability.outstandingBalance) || 0),
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
              As of December 31, {submissionYear} • Submitted{' '}
              {format(
                new Date(submission.submittedAt || submission.createdAt),
                'MMM d, yyyy'
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
              salnData.submission?.filingType === 'joint'
                ? 'Joint Filing'
                : salnData.submission?.filingType === 'separate'
                ? 'Separate Filing'
                : 'Not Applicable'
            }
          />
          <Field label="Year" value={submissionYear} />
          {salnData.submission?.filingType === 'joint' && (
            <Field
              label="Spouse Name"
              value={salnData.submission?.spouseName}
              fullWidth
            />
          )}
          <Field label="Position" value={salnData.submission?.position} />
          <Field label="Agency/Office" value={salnData.submission?.agency} />
          <Field
            label="Office Address"
            value={salnData.submission?.officeAddress}
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
                {salnData.realProperties.map((prop: any, index: number) => (
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
                {salnData.personalProperties.map((prop: any, index: number) => (
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
                {salnData.liabilities.map((liability: any, index: number) => (
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
                {salnData.businessInterests.map((business: any, index: number) => (
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
                      {format(
                        new Date(business.dateOfAcquisition),
                        'MMM d, yyyy'
                      )}
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
                {salnData.relativesInGov.map((relative: any, index: number) => (
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
