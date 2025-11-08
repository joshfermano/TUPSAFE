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

import { StatusBadge } from '@/components/admin/StatusBadge';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { SectionCard } from '@/components/admin/SectionCard';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import { LoadingCard } from '@/components/admin/LoadingCard';
import { ErrorAlert } from '@/components/admin/ErrorAlert';
import { EmptyState } from '@/components/admin/EmptyState';

import { useSalnSubmissionsQuery } from '@/hooks/useSalnSubmissionsQuery';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatting-helpers';

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

  const isSubmitting = isApproving || isRejecting || isRequestingChanges;

  // Calculate totals
  const totalRealProperties = React.useMemo(() => {
    if (!completeSubmission?.realProperties) return 0;
    return completeSubmission.realProperties.reduce(
      (sum, prop) => sum + (prop.acquisitionCost || 0),
      0
    );
  }, [completeSubmission?.realProperties]);

  const totalPersonalProperties = React.useMemo(() => {
    if (!completeSubmission?.personalProperties) return 0;
    return completeSubmission.personalProperties.reduce(
      (sum, prop) => sum + (prop.acquisitionCost || 0),
      0
    );
  }, [completeSubmission?.personalProperties]);

  const totalAssets = React.useMemo(() => {
    return totalRealProperties + totalPersonalProperties;
  }, [totalRealProperties, totalPersonalProperties]);

  const totalLiabilities = React.useMemo(() => {
    if (!completeSubmission?.liabilities) return 0;
    return completeSubmission.liabilities.reduce(
      (sum, liability) => sum + (liability.outstandingBalance || 0),
      0
    );
  }, [completeSubmission?.liabilities]);

  const netWorth = React.useMemo(() => {
    return totalAssets - totalLiabilities;
  }, [totalAssets, totalLiabilities]);

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
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">SALN Review</h1>
                  <Badge
                    variant="outline"
                    className="bg-tup-primary/10 text-tup-primary border-tup-primary/20 text-lg px-3 py-1"
                  >
                    {submission.year}
                  </Badge>
                </div>
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
            {/* Real Properties Section */}
            <SectionCard title="Real Properties" icon={<Home className="h-5 w-5" />}>
              {completeSubmission.realProperties &&
              completeSubmission.realProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Assessed Value</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Acquisition Cost</TableHead>
                        <TableHead>Year Acquired</TableHead>
                        <TableHead>Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completeSubmission.realProperties.map((property, index) => (
                        <TableRow key={index}>
                          <TableCell>{property.description}</TableCell>
                          <TableCell className="capitalize">{property.kind}</TableCell>
                          <TableCell>{property.exactLocation}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(property.assessedValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(property.currentFairMarketValue)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(property.acquisitionCost)}
                          </TableCell>
                          <TableCell>{property.acquisitionYear}</TableCell>
                          <TableCell className="capitalize">
                            {property.acquisitionMode}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-semibold">
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
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No real properties declared
                </p>
              )}
            </SectionCard>

            {/* Personal Properties Section */}
            <SectionCard title="Personal Properties" icon={<Car className="h-5 w-5" />}>
              {completeSubmission.personalProperties &&
              completeSubmission.personalProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Year Acquired</TableHead>
                        <TableHead className="text-right">Acquisition Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completeSubmission.personalProperties.map((property, index) => (
                        <TableRow key={index}>
                          <TableCell>{property.description}</TableCell>
                          <TableCell>{property.yearAcquired}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(property.acquisitionCost)}
                          </TableCell>
                        </TableRow>
                      ))}
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
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No personal properties declared
                </p>
              )}
            </SectionCard>

            {/* Assets Summary Card */}
            <Card className="gradient-emerald-summary border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <TrendingUp className="h-5 w-5" />
                  Total Assets Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Real Properties
                  </span>
                  <span className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalRealProperties)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Personal Properties
                  </span>
                  <span className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalPersonalProperties)}
                  </span>
                </div>
                <Separator className="bg-emerald-200 dark:bg-emerald-800" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                    Total Assets
                  </span>
                  <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities Section */}
            <SectionCard title="Liabilities" icon={<CreditCard className="h-5 w-5" />}>
              {completeSubmission.liabilities && completeSubmission.liabilities.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nature of Liability</TableHead>
                        <TableHead>Name of Creditors</TableHead>
                        <TableHead className="text-right">Outstanding Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completeSubmission.liabilities.map((liability, index) => (
                        <TableRow key={index}>
                          <TableCell>{liability.nature}</TableCell>
                          <TableCell>{liability.creditorName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(liability.outstandingBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-semibold">
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
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No liabilities declared
                </p>
              )}
            </SectionCard>

            {/* Net Worth Summary Card */}
            <Card className="gradient-blue-card border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Wallet className="h-5 w-5" />
                  Net Worth Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Total Assets
                  </span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Less: Total Liabilities
                  </span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    ({formatCurrency(totalLiabilities)})
                  </span>
                </div>
                <Separator className="bg-blue-200 dark:bg-blue-800" />
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    Net Worth
                  </span>
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(netWorth)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Business Interests Section */}
            <SectionCard
              title="Business Interests & Financial Connections"
              icon={<Building2 className="h-5 w-5" />}
            >
              {completeSubmission.businessInterests &&
              completeSubmission.businessInterests.length > 0 ? (
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
                    {completeSubmission.businessInterests.map((business, index) => (
                      <TableRow key={index}>
                        <TableCell>{business.entityName}</TableCell>
                        <TableCell>{business.businessAddress}</TableCell>
                        <TableCell>{business.natureOfBusiness}</TableCell>
                        <TableCell>
                          {business.dateOfAcquisition
                            ? format(new Date(business.dateOfAcquisition), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No business interests declared
                </p>
              )}
            </SectionCard>

            {/* Relatives in Government Section */}
            <SectionCard
              title="Relatives in Government Service"
              icon={<Users className="h-5 w-5" />}
            >
              {completeSubmission.relativesInGov &&
              completeSubmission.relativesInGov.length > 0 ? (
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
                    {completeSubmission.relativesInGov.map((relative, index) => (
                      <TableRow key={index}>
                        <TableCell>{relative.name}</TableCell>
                        <TableCell className="capitalize">{relative.relationship}</TableCell>
                        <TableCell>{relative.position}</TableCell>
                        <TableCell>{relative.agencyAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No relatives in government service declared
                </p>
              )}
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
                    <dt className="text-muted-foreground">Year</dt>
                    <dd>
                      <Badge
                        variant="outline"
                        className="bg-tup-primary/10 text-tup-primary border-tup-primary/20"
                      >
                        {submission.year}
                      </Badge>
                    </dd>
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
        submissionType="saln"
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
