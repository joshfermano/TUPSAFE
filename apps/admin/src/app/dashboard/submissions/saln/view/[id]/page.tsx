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
  TrendingDown,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import { LoadingCard } from '@/components/admin/LoadingCard';
import { ErrorAlert } from '@/components/admin/ErrorAlert';
import { EmptyState } from '@/components/admin/EmptyState';

import { useSalnSubmissionsQuery } from '@/hooks/useSalnSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatting-helpers';
import { useSALNPdf } from '@/hooks/useSALNPdf';
import type { SALNData } from '@/components/saln/pdf/types';

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
 * - Responsive layout with financial card gradients
 * - Professional shadcn/ui styling with TUP Crimson accents
 */
export default function SalnSubmissionViewPage() {
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
  const salnData = completeSubmission?.salnData;

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

  // Calculate totals
  const totalRealProperties = React.useMemo(() => {
    return realProperties.reduce(
      (sum: number, prop: { acquisitionCost: string | null }) =>
        sum + (prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0),
      0
    );
  }, [realProperties]);

  const totalPersonalProperties = React.useMemo(() => {
    return personalProperties.reduce(
      (sum: number, prop: { acquisitionCost: string | null }) =>
        sum + (prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0),
      0
    );
  }, [personalProperties]);

  const totalAssets = React.useMemo(() => {
    // Use API-calculated total if available, otherwise calculate
    if (salnData?.totalAssets) {
      return parseFloat(salnData.totalAssets);
    }
    return totalRealProperties + totalPersonalProperties;
  }, [salnData?.totalAssets, totalRealProperties, totalPersonalProperties]);

  const totalLiabilities = React.useMemo(() => {
    // Use API-calculated total if available, otherwise calculate
    if (salnData?.totalLiabilities) {
      return parseFloat(salnData.totalLiabilities);
    }
    return liabilities.reduce(
      (sum: number, liability: { outstandingBalance: string | null }) =>
        sum +
        (liability.outstandingBalance
          ? parseFloat(liability.outstandingBalance)
          : 0),
      0
    );
  }, [salnData?.totalLiabilities, liabilities]);

  const netWorth = React.useMemo(() => {
    // Use API-calculated net worth if available, otherwise calculate
    if (salnData?.netWorth) {
      return parseFloat(salnData.netWorth);
    }
    return totalAssets - totalLiabilities;
  }, [salnData?.netWorth, totalAssets, totalLiabilities]);

  // Extract data from the correct API response structure
  const submission = completeSubmission?.submission;
  const employee = completeSubmission?.employee;

  // Transform SALN submission data to PDF format
  const transformSALNToData = React.useCallback((): SALNData | null => {
    if (!completeSubmission || !submission || !employee) {
      console.error('Missing required data for PDF generation:', {
        hasCompleteSubmission: !!completeSubmission,
        hasSubmission: !!submission,
        hasEmployee: !!employee,
      });
      return null;
    }

    // Parse spouse name if filing type is joint
    let spouseInfo = undefined;
    if (submission.filingType === 'joint' && salnData?.spouseName) {
      const nameParts = salnData.spouseName.split(' ');
      spouseInfo = {
        surname: nameParts[nameParts.length - 1] || '',
        firstName: nameParts[0] || '',
        middleInitial: nameParts.length > 2 ? nameParts[1]?.charAt(0) : null,
        position: submission.position || '',
        agency: submission.agency || 'Technological University of the Philippines - Manila',
        officeAddress: submission.officeAddress || employee.officeAddress || '',
      };
    }

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
      children: [], // Children data not currently stored in DB
      realProperties: (salnData?.realProperties || []).map((prop: any) => ({
        description: prop.description || '',
        kind: prop.kind || 'residential',
        exactLocation: prop.exactLocation || '',
        assessedValue: parseFloat(prop.assessedValue || '0'),
        currentFairMarketValue: parseFloat(prop.currentFairMarketValue || '0'),
        acquisitionYear: prop.acquisitionYear || new Date().getFullYear(),
        acquisitionMode: prop.acquisitionMode || 'Purchase',
        acquisitionCost: parseFloat(prop.acquisitionCost || '0'),
      })),
      personalProperties: (salnData?.personalProperties || []).map((prop: any) => ({
        description: prop.description || '',
        yearAcquired: prop.yearAcquired || new Date().getFullYear(),
        acquisitionCost: parseFloat(prop.acquisitionCost || '0'),
      })),
      liabilities: (salnData?.liabilities || []).map((liability: any) => ({
        nature: liability.nature || '',
        creditorName: liability.creditorName || '',
        outstandingBalance: parseFloat(liability.outstandingBalance || '0'),
      })),
      businessInterests: (salnData?.businessInterests || []).map((business: any) => ({
        entityName: business.entityName || '',
        businessAddress: business.businessAddress || '',
        natureOfBusiness: business.natureOfBusiness || '',
        dateOfAcquisition: business.dateOfAcquisition || new Date().toISOString(),
      })),
      relativesInGov: (salnData?.relativesInGov || []).map((relative: any) => ({
        name: relative.name || '',
        relationship: relative.relationship || '',
        position: relative.position || '',
        agencyAddress: relative.agencyAddress || '',
      })),
      totalAssets,
      totalLiabilities,
      netWorth,
      submittedAt: submission.submittedAt,
    };

    console.log('PDF data transformed successfully:', {
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

  // Handle PDF download
  const handleExportPdf = React.useCallback(async () => {
    const salnData = transformSALNToData();

    if (!salnData) {
      toast.error('Cannot generate PDF', {
        description: 'SALN data is not available',
      });
      return;
    }

    try {
      await downloadPDF(salnData);
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
              {canReview && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={isGenerating}
                    className="gap-2">
                    <Download className="h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Export PDF'}
                  </Button>
                  <Button
                    onClick={() => setIsReviewDialogOpen(true)}
                    className="gap-2 bg-tup-primary hover:bg-tup-primary/90">
                    Review Submission
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="gradient-emerald-card border-emerald-200 dark:border-emerald-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Total Assets
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalAssets)}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Real & Personal Properties
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-amber-card border-amber-200 dark:border-amber-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Total Liabilities
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatCurrency(totalLiabilities)}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Outstanding Debts
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-blue-card border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Net Worth
                </CardTitle>
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(netWorth)}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Assets - Liabilities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Layout - Two Column Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Collapsible Sections for All SALN Data */}
            <Accordion
              type="multiple"
              defaultValue={[
                'assets-real',
                'assets-personal',
                'liabilities',
                'net-worth',
              ]}
              className="space-y-4">
              {/* Real Properties Section */}
              <AccordionItem
                value="assets-real"
                className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-tup-primary" />
                    <span className="text-lg font-semibold">
                      Assets - Real Properties
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {realProperties.length} item
                      {realProperties.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {realProperties.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Kind</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">
                              Assessed Value
                            </TableHead>
                            <TableHead className="text-right">
                              Market Value
                            </TableHead>
                            <TableHead className="text-right">
                              Acquisition Cost
                            </TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Mode</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {realProperties.map(
                            (
                              property: {
                                description: string;
                                kind: string;
                                exactLocation: string;
                                assessedValue: string | null;
                                currentFairMarketValue: string | null;
                                acquisitionCost: string | null;
                                acquisitionYear: number;
                                acquisitionMode: string;
                              },
                              index: number
                            ) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {property.description}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {property.kind}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {property.exactLocation}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(property.assessedValue)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    property.currentFairMarketValue
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(property.acquisitionCost)}
                                </TableCell>
                                <TableCell>{property.acquisitionYear}</TableCell>
                                <TableCell className="capitalize">
                                  {property.acquisitionMode}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-right font-semibold">
                              Total Real Properties:
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(totalRealProperties)}
                            </TableCell>
                            <TableCell colSpan={2} />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground italic">
                        No real properties declared
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Personal Properties Section */}
              <AccordionItem
                value="assets-personal"
                className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-tup-primary" />
                    <span className="text-lg font-semibold">
                      Assets - Personal Properties
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {personalProperties.length} item
                      {personalProperties.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {personalProperties.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Year Acquired</TableHead>
                            <TableHead className="text-right">
                              Acquisition Cost
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {personalProperties.map(
                            (
                              property: {
                                description: string;
                                yearAcquired: number;
                                acquisitionCost: string | null;
                              },
                              index: number
                            ) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {property.description}
                                </TableCell>
                                <TableCell>{property.yearAcquired}</TableCell>
                                <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                  {formatCurrency(property.acquisitionCost)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell className="text-right font-semibold">
                              Total Personal Properties:
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(totalPersonalProperties)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground italic">
                        No personal properties declared
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Assets Summary Section */}
              <AccordionItem
                value="assets-summary"
                className="border rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                      Total Assets Summary
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Real Properties
                      </span>
                      <span className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                        {formatCurrency(totalRealProperties)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Personal Properties
                      </span>
                      <span className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                        {formatCurrency(totalPersonalProperties)}
                      </span>
                    </div>
                    <Separator className="bg-emerald-300 dark:bg-emerald-700" />
                    <div className="flex justify-between items-center p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                      <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        Total Assets
                      </span>
                      <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                        {formatCurrency(totalAssets)}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Liabilities Section */}
              <AccordionItem
                value="liabilities"
                className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-tup-primary" />
                    <span className="text-lg font-semibold">Liabilities</span>
                    <Badge variant="secondary" className="ml-2">
                      {liabilities.length} item{liabilities.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {liabilities.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nature of Liability</TableHead>
                            <TableHead>Name of Creditors</TableHead>
                            <TableHead className="text-right">
                              Outstanding Balance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {liabilities.map(
                            (
                              liability: {
                                nature: string;
                                creditorName: string;
                                outstandingBalance: string | null;
                              },
                              index: number
                            ) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {liability.nature}
                                </TableCell>
                                <TableCell>{liability.creditorName}</TableCell>
                                <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">
                                  {formatCurrency(liability.outstandingBalance)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-right font-semibold">
                              Total Liabilities:
                            </TableCell>
                            <TableCell className="text-right font-bold text-amber-700 dark:text-amber-400">
                              {formatCurrency(totalLiabilities)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground italic">
                        No liabilities declared
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Net Worth Calculation Section */}
              <AccordionItem
                value="net-worth"
                className="border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      Net Worth Calculation
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <span className="text-base font-medium text-blue-700 dark:text-blue-300">
                        Total Assets
                      </span>
                      <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {formatCurrency(totalAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <span className="text-base font-medium text-blue-700 dark:text-blue-300">
                        Less: Total Liabilities
                      </span>
                      <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        ({formatCurrency(totalLiabilities)})
                      </span>
                    </div>
                    <Separator className="bg-blue-300 dark:bg-blue-700" />
                    <div className="flex justify-between items-center p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                        Net Worth
                      </span>
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(netWorth)}
                      </span>
                    </div>
                    {previousYear && (
                      <>
                        <Separator className="bg-blue-200 dark:bg-blue-800" />
                        <div className="space-y-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Year-over-Year Comparison
                          </p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {previousYear.fiscalYear} Net Worth:
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(
                                parseFloat(previousYear.netWorth)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Change:</span>
                            <span
                              className={`font-semibold ${
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
                </AccordionContent>
              </AccordionItem>

              {/* Business Interests Section */}
              <AccordionItem
                value="business-interests"
                className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-tup-primary" />
                    <span className="text-lg font-semibold">
                      Business Interests & Financial Connections
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {businessInterests.length} item
                      {businessInterests.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {businessInterests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity Name</TableHead>
                            <TableHead>Business Address</TableHead>
                            <TableHead>Nature of Business</TableHead>
                            <TableHead>Date Acquired</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {businessInterests.map(
                            (
                              business: {
                                entityName: string;
                                businessAddress: string;
                                natureOfBusiness: string;
                                dateOfAcquisition: string | null;
                              },
                              index: number
                            ) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {business.entityName}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {business.businessAddress}
                                </TableCell>
                                <TableCell>{business.natureOfBusiness}</TableCell>
                                <TableCell>
                                  {business.dateOfAcquisition
                                    ? format(
                                        new Date(business.dateOfAcquisition),
                                        'MMM d, yyyy'
                                      )
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground italic">
                        No business interests declared
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Relatives in Government Section */}
              <AccordionItem
                value="relatives-in-gov"
                className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-tup-primary" />
                    <span className="text-lg font-semibold">
                      Relatives in Government Service
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {relativesInGov.length} relative
                      {relativesInGov.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {relativesInGov.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Relationship</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Agency/Office Address</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relativesInGov.map(
                            (
                              relative: {
                                name: string;
                                relationship: string;
                                position: string;
                                agencyAddress: string;
                              },
                              index: number
                            ) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {relative.name}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {relative.relationship}
                                </TableCell>
                                <TableCell>{relative.position}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {relative.agencyAddress}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground italic">
                        No relatives in government service declared
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                  {employee && (
                    <UserAvatar
                      user={{
                        firstName: employee.firstName,
                        lastName: employee.lastName,
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
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(totalAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liabilities</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {formatCurrency(totalLiabilities)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Net Worth</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(netWorth)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {canReview && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Button
                        onClick={() => setIsReviewDialogOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Review Submission
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExportPdf}
                        disabled={isGenerating}
                        className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Export PDF'}
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
      {submission && employee && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          submissionId={submissionId}
          submissionType="saln"
          currentStatus={submission.status}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          onApprove={handleApprove}
          onReject={handleReject}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
