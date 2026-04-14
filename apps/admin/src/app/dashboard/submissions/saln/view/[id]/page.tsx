'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Home,
  Car,
  Wallet,
  CreditCard,
  Building2,
  Users,
  TrendingUp,
  Printer,
  Loader2,
  XCircle,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import { LoadingCard } from '@/components/admin/LoadingCard';
import { ErrorAlert } from '@/components/admin/ErrorAlert';
import { EmptyState } from '@/components/admin/EmptyState';

import { DataSection, PropertyCard, FinancialSummaryCards } from '@/components/saln';

import { useSalnSubmissionsQuery } from '@/hooks/useSalnSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatting-helpers';
import { useSALNPdf } from '@/hooks/useSALNPdf';
import type { SALNData } from '@/components/saln/pdf';

/**
 * SALN Submission View Page
 *
 * Comprehensive view page for reviewing SALN submissions in the admin portal.
 *
 * Features:
 * - Complete SALN financial data display with all sections
 * - Financial summary cards with year-over-year comparison
 * - Net worth calculation and display
 * - Employee information sidebar
 * - Review actions (Approve, Reject, Request Changes)
 * - Breadcrumb navigation
 * - PDF export capability
 * - Responsive layout with card-based sections
 * - Professional shadcn/ui styling with TUP Crimson accents
 */
export default function SalnSubmissionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = params.id as string;

  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);
  const [reviewAction, setReviewAction] = React.useState<'approve' | 'reject' | undefined>(undefined);

  const {
    useCompleteSubmission,
    approveSubmissionAsync,
    rejectSubmissionAsync,
    requestChangesAsync,
    isApproving,
    isRejecting,
    isRequestingChanges,
  } = useSalnSubmissionsQuery();

  const {
    data: completeSubmission,
    isLoading,
    error,
    refetch,
  } = useCompleteSubmission(submissionId);

  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();

  const isSubmitting = isApproving || isRejecting || isRequestingChanges;

  // Extract data from the API response structure
  // The API returns data conforming to SALNData shape
  const salnData = completeSubmission?.salnData as (SALNData & Record<string, unknown>) | undefined;

  // Memoize arrays to prevent hook dependency issues
  const realProperties = React.useMemo(
    () => salnData?.realProperties || [],
    [salnData?.realProperties]
  );
  const personalProperties = React.useMemo(
    () => salnData?.personalProperties || [],
    [salnData?.personalProperties]
  );
  const liabilities = React.useMemo(
    () => salnData?.liabilities || [],
    [salnData?.liabilities]
  );
  const businessInterests = React.useMemo(
    () => salnData?.businessInterests || [],
    [salnData?.businessInterests]
  );
  const relativesInGov = React.useMemo(
    () => salnData?.relativesInGov || [],
    [salnData?.relativesInGov]
  );

  // Calculate totals - API now returns numbers, use directly
  const totalRealProperties = React.useMemo(() => {
    return realProperties.reduce(
      (sum, prop) => sum + (prop.currentFairMarketValue || 0),
      0
    );
  }, [realProperties]);

  const totalPersonalProperties = React.useMemo(() => {
    return personalProperties.reduce(
      (sum, prop) => sum + (prop.acquisitionCost || 0),
      0
    );
  }, [personalProperties]);

  const totalAssets = React.useMemo(() => {
    // API returns number values; use directly
    if (typeof salnData?.totalAssets === 'number') {
      return salnData.totalAssets;
    }
    // Fallback: calculate from properties
    return totalRealProperties + totalPersonalProperties;
  }, [salnData?.totalAssets, totalRealProperties, totalPersonalProperties]);

  const totalLiabilities = React.useMemo(() => {
    // API returns number values; use directly
    if (typeof salnData?.totalLiabilities === 'number') {
      return salnData.totalLiabilities;
    }
    // Fallback: calculate from liabilities
    return liabilities.reduce(
      (sum, liability) => sum + (liability.outstandingBalance || 0),
      0
    );
  }, [salnData?.totalLiabilities, liabilities]);

  const netWorth = React.useMemo(() => {
    // API returns number values; use directly
    if (typeof salnData?.netWorth === 'number') {
      return salnData.netWorth;
    }
    return totalAssets - totalLiabilities;
  }, [salnData?.netWorth, totalAssets, totalLiabilities]);

  // Extract data from the correct API response structure
  const submission = completeSubmission?.submission;
  const employee = completeSubmission?.employee;

  // Transform SALN submission data to PDF format
  // API now returns canonical format with number values - simplified transformation
  const transformSALNToData = React.useCallback((): SALNData | null => {
    if (!completeSubmission || !submission || !employee) {
      console.error('Missing required data for PDF generation:', {
        hasCompleteSubmission: !!completeSubmission,
        hasSubmission: !!submission,
        hasEmployee: !!employee,
      });
      return null;
    }

    // Parse spouse info - always shown in 2025 format; prefer split fields, fall back to combined
    let spouseInfo = undefined;
    const spouseNameRaw = (salnData as Record<string, unknown>)?.spouseName as string | undefined;
    const spouseFamilyNameRaw = (salnData as Record<string, unknown>)?.spouseFamilyName as string | undefined;
    const spouseFirstNameRaw = (salnData as Record<string, unknown>)?.spouseFirstName as string | undefined;
    const spouseMiddleInitialRaw = (salnData as Record<string, unknown>)?.spouseMiddleInitial as string | undefined;
    if (spouseFamilyNameRaw || spouseFirstNameRaw || spouseNameRaw) {
      let fallbackSurname = '';
      let fallbackFirst = '';
      let fallbackMi: string | null = null;
      if (spouseNameRaw) {
        const nameParts = spouseNameRaw.trim().split(/\s+/);
        fallbackSurname = nameParts[nameParts.length - 1] || '';
        fallbackFirst = nameParts[0] || '';
        fallbackMi = nameParts.length > 2 ? nameParts[1]?.charAt(0) ?? null : null;
      }
      spouseInfo = {
        surname: spouseFamilyNameRaw || fallbackSurname,
        firstName: spouseFirstNameRaw || fallbackFirst,
        middleInitial: spouseMiddleInitialRaw || fallbackMi,
        position: salnData?.spousePosition || '',
        agency: salnData?.spouseAgency || '',
        officeAddress: salnData?.spouseOfficeAddress || employee.officeAddress || '',
      };
    }

    // API returns number values in canonical format; use directly
    const pdfData: SALNData = {
      id: submission.id,
      year: submission.fiscalYear,
      filingType: (submission.filingType || 'separate') as 'joint' | 'separate' | 'not_applicable',
      declarantInfo: {
        surname: employee.lastName,
        firstName: employee.firstName,
        middleInitial: employee.middleName?.charAt(0) || null,
        position: submission.position || employee.position?.title || '',
        agency: submission.agency || 'Technological University of the Philippines - Manila',
        officeAddress: submission.officeAddress || employee.officeAddress || '',
      },
      spouseInfo,
      children: [],
      realProperties: salnData?.realProperties || [],
      personalProperties: salnData?.personalProperties || [],
      liabilities: salnData?.liabilities || [],
      businessInterests: salnData?.businessInterests || [],
      relativesInGov: salnData?.relativesInGov || [],
      totalAssets,
      totalLiabilities,
      netWorth,
      submittedAt: submission.submittedAt,
      // 2025 SALN Format fields
      salnFormatVersion: salnData?.salnFormatVersion || 2025,
      complianceType: salnData?.complianceType,
      complianceDate: salnData?.complianceDate,
      hasMultipleMarriages: salnData?.hasMultipleMarriages,
      previousSpouseNames: salnData?.previousSpouseNames,
      spouseIsPublicOfficial: salnData?.spouseIsPublicOfficial,
      spousePosition: salnData?.spousePosition,
      spouseAgency: salnData?.spouseAgency,
      spouseOfficeAddress: salnData?.spouseOfficeAddress,
      unmarriedChildren: salnData?.unmarriedChildren,
      hasNoBusinessInterests: salnData?.hasNoBusinessInterests,
      hasNoRelativesInGov: salnData?.hasNoRelativesInGov,
      governmentIdType: salnData?.governmentIdType,
      governmentIdNumber: salnData?.governmentIdNumber,
      governmentIdDateIssued: salnData?.governmentIdDateIssued,
      governmentIdType2: salnData?.governmentIdType2,
      governmentIdNumber2: salnData?.governmentIdNumber2,
      governmentIdDateIssued2: salnData?.governmentIdDateIssued2,
      declarantTin: salnData?.declarantTin,
      spouseTin: salnData?.spouseTin,
      spouseDateOfBirth: salnData?.spouseDateOfBirth,
      declarationDate: (salnData as Record<string, unknown>)?.declarationDate as string | undefined,
    };

    console.log('[SALN PDF] Data transformed successfully:', {
      id: pdfData.id,
      year: pdfData.year,
      filingType: pdfData.filingType,
      declarantName: `${pdfData.declarantInfo.firstName} ${pdfData.declarantInfo.surname}`,
      realPropertiesCount: pdfData.realProperties.length,
      personalPropertiesCount: pdfData.personalProperties.length,
      liabilitiesCount: pdfData.liabilities.length,
    });

    return pdfData;
  }, [completeSubmission, submission, employee, salnData, totalAssets, totalLiabilities, netWorth]);

  // Handle approval
  const handleApprove = React.useCallback(
    async (notes?: string) => {
      if (!user?.id) return;

      await approveSubmissionAsync({
        submissionId,
        reviewNotes: notes,
        reviewedBy: user.id,
      });

      toast.success('SALN Approved', {
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

      toast.success('SALN Rejected', {
        description: 'The submission has been rejected',
      });
    },
    [submissionId, user?.id, rejectSubmissionAsync]
  );

  // Handle request changes
  const _handleRequestChanges = React.useCallback(
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

  // Handle PDF download with runtime assertions
  const handleExportPdf = React.useCallback(async () => {
    const salnPdfData = transformSALNToData();

    if (!salnPdfData) {
      toast.error('Cannot generate PDF', {
        description: 'SALN data is not available',
      });
      return;
    }

    // Runtime assertions: verify canonical data shape at PDF boundary
    console.log('[Admin SALN PDF] Asserting data shape:', {
      hasDeclarantInfo: !!salnPdfData.declarantInfo,
      declarantSurname: salnPdfData.declarantInfo?.surname,
      declarantFirstName: salnPdfData.declarantInfo?.firstName,
      year: salnPdfData.year,
      filingType: salnPdfData.filingType,
      realPropertiesCount: salnPdfData.realProperties?.length,
      personalPropertiesCount: salnPdfData.personalProperties?.length,
      liabilitiesCount: salnPdfData.liabilities?.length,
      totalAssets: salnPdfData.totalAssets,
      totalAssetsType: typeof salnPdfData.totalAssets,
      totalLiabilities: salnPdfData.totalLiabilities,
      netWorth: salnPdfData.netWorth,
    });

    try {
      await downloadPDF(salnPdfData);
      toast.success('SALN PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  }, [transformSALNToData, downloadPDF]);

  // Handle PDF preview (open in new tab)
  const handlePreviewPdf = React.useCallback(async () => {
    const salnData = transformSALNToData();

    if (!salnData) {
      toast.error('Cannot generate PDF', {
        description: 'SALN data is not available',
      });
      return;
    }

    try {
      await openPDFInNewTab(salnData);
    } catch (error) {
      console.error('PDF preview error:', error);
      toast.error('Failed to open PDF preview', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  }, [transformSALNToData, openPDFInNewTab]);

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
          icon={Wallet}
          title="Submission Not Found"
          description="The SALN submission you're looking for doesn't exist or has been removed."
          action={{
            label: 'Back to Submissions',
            onClick: () => router.push('/dashboard/submissions/saln'),
          }}
        />
      </div>
    );
  }

  const previousYear = completeSubmission?.previousYear;
  // Note: auditTrail is available in completeSubmission?.auditTrail if needed

  const canReview =
    submission?.status === 'submitted' || submission?.status === 'reviewing';

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
              <BreadcrumbLink href="/dashboard/submissions/saln">
                SALN Submissions
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
                  onClick={() => router.push('/dashboard/submissions/saln')}
                  className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    SALN Review
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-tup-primary/10 text-tup-primary border-tup-primary/20 text-lg px-3 py-1">
                    {submission?.fiscalYear}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                Submitted on{' '}
                {submission?.submittedAt
                  ? format(new Date(submission.submittedAt), 'MMMM d, yyyy')
                  : 'N/A'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={submission?.status || 'draft'} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={isGenerating}
                className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewPdf}
                disabled={isGenerating}
                className="gap-2">
                <Printer className="h-4 w-4" />
                Print PDF
              </Button>
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
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Financial Summary Cards */}
          <FinancialSummaryCards
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            netWorth={netWorth}
          />
        </div>

        {/* Main Layout - Two Column Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Real Properties Section */}
            <DataSection
              icon={Home}
              title="Assets - Real Properties"
              badge={realProperties.length}
              defaultOpen>
              {realProperties.length > 0 ? (
                <div className="space-y-3">
                  {realProperties.map((property, index) => (
                    <PropertyCard key={index} type="real" data={property as unknown as Record<string, unknown>}index={index} />
                  ))}
                  {/* Total Row */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Total Real Properties</span>
                    <span className="font-bold tabular-nums">{formatCurrency(totalRealProperties)}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Home}
                  title="No Real Properties"
                  description="No real properties declared"
                  className="py-8"
                />
              )}
            </DataSection>

            {/* Personal Properties Section */}
            <DataSection
              icon={Car}
              title="Assets - Personal Properties"
              badge={personalProperties.length}
              defaultOpen>
              {personalProperties.length > 0 ? (
                <div className="space-y-3">
                  {personalProperties.map((property, index) => (
                    <PropertyCard key={index} type="personal" data={property as unknown as Record<string, unknown>}index={index} />
                  ))}
                  {/* Total Row */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Total Personal Properties</span>
                    <span className="font-bold tabular-nums">{formatCurrency(totalPersonalProperties)}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Car}
                  title="No Personal Properties"
                  description="No personal properties declared"
                  className="py-8"
                />
              )}
            </DataSection>

            {/* Assets Summary Section */}
            <DataSection
              icon={TrendingUp}
              title="Total Assets Summary"
              defaultOpen={false}>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium text-foreground">
                    Real Properties
                  </span>
                  <span className="text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalRealProperties)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium text-foreground">
                    Personal Properties
                  </span>
                  <span className="text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalPersonalProperties)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-4 bg-card rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                  <span className="text-base font-bold text-foreground">
                    Total Assets
                  </span>
                  <span className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
              </div>
            </DataSection>

            {/* Liabilities Section */}
            <DataSection
              icon={CreditCard}
              title="Liabilities"
              badge={liabilities.length}
              defaultOpen>
              {liabilities.length > 0 ? (
                <div className="space-y-3">
                  {liabilities.map((liability, index) => (
                    <PropertyCard key={index} type="liability" data={liability as unknown as Record<string, unknown>}index={index} />
                  ))}
                  {/* Total Row */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Total Liabilities</span>
                    <span className="font-bold tabular-nums">{formatCurrency(totalLiabilities)}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No Liabilities"
                  description="No liabilities declared"
                  className="py-8"
                />
              )}
            </DataSection>

            {/* Net Worth Calculation Section */}
            <DataSection
              icon={Wallet}
              title="Net Worth Calculation"
              defaultOpen>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-base font-medium text-foreground">
                    Total Assets
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  <span className="text-base font-medium text-foreground">
                    Less: Total Liabilities
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                    ({formatCurrency(totalLiabilities)})
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-4 bg-card rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <span className="text-xl font-bold text-foreground">
                    Net Worth
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-400">
                    {formatCurrency(netWorth)}
                  </span>
                </div>
                {previousYear && (
                  <>
                    <Separator />
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                      <p className="text-sm font-medium text-foreground">
                        Year-over-Year Comparison
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {previousYear.fiscalYear} Net Worth:
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(
                            parseFloat(previousYear.netWorth)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change:</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            parseFloat(previousYear.netWorthChange) >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                          {parseFloat(previousYear.netWorthChange) >= 0
                            ? '+'
                            : ''}
                          {formatCurrency(
                            parseFloat(previousYear.netWorthChange)
                          )}{' '}
                          ({previousYear.netWorthChangePercent >= 0 ? '+' : ''}
                          {previousYear.netWorthChangePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DataSection>

            {/* Business Interests Section */}
            <DataSection
              icon={Building2}
              title="Business Interests & Financial Connections"
              badge={businessInterests.length}
              defaultOpen={false}>
              {businessInterests.length > 0 ? (
                <div className="space-y-3">
                  {businessInterests.map((business, index) => (
                    <PropertyCard key={index} type="business" data={business as unknown as Record<string, unknown>}index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No Business Interests"
                  description="No business interests declared"
                  className="py-8"
                />
              )}
            </DataSection>

            {/* Relatives in Government Section */}
            <DataSection
              icon={Users}
              title="Relatives in Government Service"
              badge={relativesInGov.length}
              defaultOpen={false}>
              {relativesInGov.length > 0 ? (
                <div className="space-y-3">
                  {relativesInGov.map((relative, index) => (
                    <PropertyCard key={index} type="relative" data={relative as unknown as Record<string, unknown>}index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No Relatives in Government"
                  description="No relatives in government service declared"
                  className="py-8"
                />
              )}
            </DataSection>
          </div>

          {/* Sidebar - Employee Info */}
          <div className="space-y-6">
            <Card className="sticky top-6 gradient-card-subtle border-primary-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center space-y-3">
                  {employee && (
                    <UserAvatar
                      user={{
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        avatarUrl: employee.avatarUrl,
                      }}
                      size="lg"
                      className="h-20 w-20"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {employee?.firstName} {employee?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {employee?.employeeId || 'N/A'}
                    </p>
                    {employee?.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {employee.email}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Department</dt>
                    <dd className="font-medium">
                      {employee?.department?.name || 'N/A'}
                    </dd>
                    {employee?.department?.code && (
                      <dd className="text-xs text-muted-foreground">
                        {employee.department.code}
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Position</dt>
                    <dd className="font-medium">
                      {employee?.position?.title || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Year</dt>
                    <dd>
                      <Badge
                        variant="outline"
                        className="bg-tup-primary/10 text-tup-primary border-tup-primary/20">
                        {submission?.fiscalYear}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <StatusBadge status={submission?.status || 'draft'} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd className="font-medium">
                      {submission?.submittedAt
                        ? format(
                            new Date(submission.submittedAt),
                            'MMM d, yyyy h:mm a'
                          )
                        : 'N/A'}
                    </dd>
                  </div>
                  {submission?.reviewedAt && submission?.reviewedBy && (
                    <div>
                      <dt className="text-muted-foreground">Reviewed By</dt>
                      <dd className="font-medium">
                        {submission.reviewedBy.firstName}{' '}
                        {submission.reviewedBy.lastName}
                      </dd>
                      <dd className="text-xs text-muted-foreground">
                        {format(
                          new Date(submission.reviewedAt),
                          'MMM d, yyyy h:mm a'
                        )}
                      </dd>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Financial Summary */}
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold text-base">Financial Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assets</span>
                      <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(totalAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liabilities</span>
                      <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                        {formatCurrency(totalLiabilities)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Net Worth</span>
                      <span className="font-bold tabular-nums text-blue-700 dark:text-blue-400">
                        {formatCurrency(netWorth)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="space-y-2">
                  {canReview && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          setReviewAction('approve');
                          setIsReviewDialogOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="w-full gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setReviewAction('reject');
                          setIsReviewDialogOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="w-full gap-2">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleExportPdf}
                    disabled={isGenerating}
                    className="w-full gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewPdf}
                    disabled={isGenerating}
                    className="w-full gap-2">
                    <Printer className="h-4 w-4" />
                    Print PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {submission && employee && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          submissionId={submissionId}
          submissionType="saln"
          currentStatus={submission.status}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          defaultAction={reviewAction}
          onApprove={handleApprove}
          onReject={handleReject}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
