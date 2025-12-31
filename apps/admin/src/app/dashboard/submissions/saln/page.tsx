'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Filter,
  Eye,
  Download,
  MoreVertical,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import {
  useSalnSubmissionsQuery,
  type SalnSubmissionsFilters,
} from '@/hooks/useSalnSubmissionsQuery';
import { useSalnStatsQuery } from '@/hooks/useSalnStatsQuery';
import { useDepartmentsQuery } from '@/hooks/useDepartmentsQuery';
import { useAuth } from '@/context/AuthContext';
import { useSALNPdf } from '@/hooks/useSALNPdf';
import { usePagination } from '@/hooks/usePagination';
import type { SALNData } from '@/components/saln/pdf/types';
import { DeadlineManagementCard } from '@/components/deadlines';
import { ReviewDialog } from '@/components/admin/ReviewDialog';
import type { SalnSubmissionListItem } from '@tupsafe/types';
import {
  EmptyState,
  ErrorAlert,
  StatusBadge,
  UserAvatar,
} from '@/components/admin';
import { PageTransition } from '@/components/PageTransition';
import {
  EnhancedTable,
  EnhancedTableBody,
  EnhancedTableCell,
  EnhancedTableHead,
  EnhancedTableHeader,
  EnhancedTableRow,
} from '@/components/admin/EnhancedTable';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DataTablePagination } from '@/components/ui/data-table-pagination';


// Generate year options (current year and previous 5 years)
const YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [{ value: 'all', label: 'All Years' }];
  for (let i = 0; i < 6; i++) {
    const year = currentYear - i;
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
})();

// Status types
type StatusType = 'all' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Custom hook for number counting animation
const useCountingAnimation = (end: number, duration: number = 1500) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
};

// SALN Submission Row Component (memoized)
interface SalnSubmissionRowProps {
  submission: SalnSubmissionListItem;
  index: number;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  isSubmitting: boolean;
  onDownload: (submissionId: string) => Promise<void>;
  isDownloading: boolean;
  downloadingId: string | null;
}

const SalnSubmissionRow = memo(
  ({ submission, index, onApprove, onReject, isSubmitting, onDownload, isDownloading, downloadingId }: SalnSubmissionRowProps) => {
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [approveRejectDialogOpen, setApproveRejectDialogOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

    const isThisRowDownloading = isDownloading && downloadingId === submission.id;

    const handleAction = useCallback(async (action: string) => {
      if (action === 'approve') {
        setReviewAction('approve');
        setApproveRejectDialogOpen(true);
      } else if (action === 'reject') {
        setReviewAction('reject');
        setApproveRejectDialogOpen(true);
      } else if (action === 'download') {
        await onDownload(submission.id);
      }
    }, [submission.id, onDownload]);

    const employeeName = `${submission.employee.firstName} ${submission.employee.lastName}`;

    const netWorth = parseFloat(submission.netWorth || '0');

    return (
      <>
        <EnhancedTableRow index={index}>
          <EnhancedTableCell>
            <div className="flex items-center gap-3">
              <UserAvatar
                user={{
                  firstName: submission.employee.firstName,
                  lastName: submission.employee.lastName,
                  avatarUrl: submission.employee.avatarUrl,
                }}
                size="sm"
              />
              <div>
                <p className="font-medium">{employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {submission.employee.employeeId || 'N/A'}
                </p>
              </div>
            </div>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden md:table-cell">
            <Badge variant="outline">{submission.year}</Badge>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden lg:table-cell">
            <span className="font-medium">
              {formatCurrency(netWorth)}
            </span>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden xl:table-cell">
            {submission.employee.department?.name || 'N/A'}
          </EnhancedTableCell>
          <EnhancedTableCell>
            <StatusBadge status={submission.status} />
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden 2xl:table-cell">
            {formatDistanceToNow(new Date(submission.createdAt), {
              addSuffix: true,
            })}
          </EnhancedTableCell>
          <EnhancedTableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-dropdown">
                <DropdownMenuItem onClick={() => setReviewDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Quick Review
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/submissions/saln/view/${submission.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction('download')}
                  disabled={isThisRowDownloading}
                >
                  {isThisRowDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isThisRowDownloading ? 'Downloading...' : 'Download PDF'}
                </DropdownMenuItem>
                {submission.status === 'submitted' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAction('approve')}
                      className="text-green-600 focus:text-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleAction('reject')}
                      className="text-red-600 focus:text-red-600"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </EnhancedTableCell>
        </EnhancedTableRow>

        {/* Quick Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quick Review - SALN Submission</DialogTitle>
              <DialogDescription>
                {employeeName} - {submission.year}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Net Worth</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(netWorth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(submission.createdAt), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.employee.department?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                {submission.reviewer && (
                  <div>
                    <p className="text-sm font-medium">Reviewed By</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.reviewer.firstName} {submission.reviewer.lastName}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/submissions/saln/view/${submission.id}`}>
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approve/Reject Review Dialog */}
        <ReviewDialog
          open={approveRejectDialogOpen}
          onOpenChange={setApproveRejectDialogOpen}
          submissionId={submission.id}
          submissionType="saln"
          currentStatus={submission.status}
          employeeName={employeeName}
          defaultAction={reviewAction}
          onApprove={async (notes) => await onApprove(submission.id, notes)}
          onReject={async (notes) => await onReject(submission.id, notes)}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }
);

SalnSubmissionRow.displayName = 'SalnSubmissionRow';

// Loading Skeleton
const LoadingTable = memo(() => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
    ))}
  </div>
));

LoadingTable.displayName = 'LoadingTable';

// Main SALN Submissions Page Component
export default function SalnSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Get authenticated user
  const { user } = useAuth();

  // PDF hook
  const { downloadPDF, isGenerating } = useSALNPdf();

  // Pagination hook
  const { page, pageSize, paginationParams, setPage, setPageSize } = usePagination(20);

  // Build filters object
  const filters = useMemo<SalnSubmissionsFilters>(
    () => ({
      page: paginationParams.page,
      limit: paginationParams.limit,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      year: yearFilter !== 'all' ? parseInt(yearFilter) : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      search: searchQuery,
    }),
    [paginationParams.page, paginationParams.limit, statusFilter, yearFilter, departmentFilter, searchQuery]
  );

  // Fetch submissions with filters and mutations
  const {
    submissions,
    pagination,
    isLoading,
    isError,
    error,
    approveSubmissionAsync,
    rejectSubmissionAsync,
    isApproving,
    isRejecting,
    useCompleteSubmission,
  } = useSalnSubmissionsQuery(filters);

  const isSubmitting = isApproving || isRejecting;

  // Approve handler
  const handleApprove = useCallback(
    async (id: string, notes?: string) => {
      if (!user?.id) return;
      await approveSubmissionAsync({
        submissionId: id,
        reviewNotes: notes,
        reviewedBy: user.id,
      });
    },
    [user?.id, approveSubmissionAsync]
  );

  // Reject handler
  const handleReject = useCallback(
    async (id: string, notes: string) => {
      if (!user?.id) return;
      await rejectSubmissionAsync({
        submissionId: id,
        reviewNotes: notes,
        reviewedBy: user.id,
      });
    },
    [user?.id, rejectSubmissionAsync]
  );

  // Download handler
  const handleDownload = useCallback(
    async (submissionId: string) => {
      setDownloadingId(submissionId);
      const loadingToast = toast.loading('Preparing PDF download...');

      try {
        // Fetch complete submission data
        const response = await fetch(`/api/submissions/saln/${submissionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch submission data');
        }

        const completeSubmission = await response.json();

        // Extract data from the API response structure
        const submission = completeSubmission?.submission;
        const employee = completeSubmission?.employee;
        const salnData = completeSubmission?.salnData;

        if (!submission || !employee || !salnData) {
          throw new Error('Incomplete submission data');
        }

        // Calculate totals
        const totalRealProperties = (salnData.realProperties || []).reduce(
          (sum: number, prop: { acquisitionCost: string | null }) =>
            sum + (prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0),
          0
        );

        const totalPersonalProperties = (salnData.personalProperties || []).reduce(
          (sum: number, prop: { acquisitionCost: string | null }) =>
            sum + (prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0),
          0
        );

        const totalAssets = salnData.totalAssets
          ? parseFloat(salnData.totalAssets)
          : totalRealProperties + totalPersonalProperties;

        const totalLiabilities = salnData.totalLiabilities
          ? parseFloat(salnData.totalLiabilities)
          : (salnData.liabilities || []).reduce(
              (sum: number, liability: { outstandingBalance: string | null }) =>
                sum +
                (liability.outstandingBalance
                  ? parseFloat(liability.outstandingBalance)
                  : 0),
              0
            );

        const netWorth = salnData.netWorth
          ? parseFloat(salnData.netWorth)
          : totalAssets - totalLiabilities;

        // Parse spouse info if filing type is joint
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

        // Transform to SALNData format
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

        // Download PDF
        await downloadPDF(pdfData);

        toast.success('PDF downloaded successfully', { id: loadingToast });
      } catch (error) {
        console.error('PDF download error:', error);
        toast.error('Failed to download PDF', {
          id: loadingToast,
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadPDF]
  );

  // Fetch SALN statistics for analytics
  const { data: salnStats, isLoading: statsLoading } = useSalnStatsQuery();

  // Fetch departments for filter dropdown
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartmentsQuery();

  // Format net worth trend data from yearly comparison
  const netWorthTrendData = useMemo(() => {
    if (!salnStats?.yearlyComparison) return [];
    return salnStats.yearlyComparison.map((item) => ({
      year: item.year.toString(),
      avgNetWorth: parseFloat(item.avgNetWorth),
    }));
  }, [salnStats]);

  // Format departments for dropdown
  const departments = useMemo(() => {
    if (!departmentsData) return [{ value: 'all', label: 'All Departments' }];
    return [
      { value: 'all', label: 'All Departments' },
      ...departmentsData.map((dept) => ({
        value: dept.id,
        label: dept.name,
      })),
    ];
  }, [departmentsData]);

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setStatusFilter('all');
    setYearFilter('all');
    setDepartmentFilter('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    yearFilter !== 'all' ||
    departmentFilter !== 'all' ||
    searchQuery;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SALN Submissions</h1>
        <p className="text-muted-foreground">
          Review and manage Statement of Assets, Liabilities, and Net Worth
          submissions
        </p>
      </div>

      {/* Deadline Management Section */}
      <DeadlineManagementCard formType="saln" />

      {/* Net Worth Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Average Net Worth Trend</CardTitle>
          </div>
          <CardDescription>Year-over-year average net worth progression</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-3 w-full">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ) : netWorthTrendData.length > 0 ? (
            <ChartContainer
              config={{
                avgNetWorth: {
                  label: 'Avg. Net Worth',
                  color: '#8B1538',
                },
              }}
              className="h-[300px]"
            >
              <AreaChart data={netWorthTrendData}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B1538" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B1538" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₱${(value / 1000000).toFixed(1)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="avgNetWorth"
                stroke="var(--color-avgNetWorth)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusType)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Card - Fixed theme adaptivity */}
      <Card className="border-muted/50 bg-card shadow-sm">
        <CardHeader className="border-b border-subtle bg-muted/30">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter submissions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search Input with animated icon */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: searchFocused ? 1.1 : 1,
                    rotate: searchFocused ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                <Input
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Year Filter with smooth transition */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {YEARS.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
                disabled={departmentsLoading}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {departmentsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading departments...
                    </SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-subtle">
                <p className="text-sm text-muted-foreground">
                  {submissions.length} submission(s) found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {submissions.length} total submission(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && <LoadingTable />}

          {/* Error State */}
          {isError && (
            <ErrorAlert
              error={error || 'Failed to load submissions'}
              title="Failed to load submissions"
            />
          )}

          {/* Empty State */}
          {!isLoading && !isError && submissions.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? Search : Landmark}
              title={
                hasActiveFilters
                  ? 'No submissions found'
                  : 'No SALN submissions available'
              }
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'SALN submissions will appear here once employees submit them'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear Filters',
                      onClick: handleResetFilters,
                      variant: 'outline' as const,
                    }
                  : undefined
              }
            />
          )}

          {/* Submissions Table */}
          {!isLoading && !isError && submissions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <EnhancedTable>
                    <EnhancedTableHeader>
                      <EnhancedTableRow animate={false}>
                        <EnhancedTableHead>Employee</EnhancedTableHead>
                        <EnhancedTableHead className="hidden md:table-cell">
                          Year
                        </EnhancedTableHead>
                        <EnhancedTableHead className="hidden lg:table-cell">
                          Net Worth
                        </EnhancedTableHead>
                        <EnhancedTableHead className="hidden xl:table-cell">
                          Department
                        </EnhancedTableHead>
                        <EnhancedTableHead>Status</EnhancedTableHead>
                        <EnhancedTableHead className="hidden 2xl:table-cell">
                          Submitted
                        </EnhancedTableHead>
                        <EnhancedTableHead className="w-[50px]">
                          <span className="sr-only">Actions</span>
                        </EnhancedTableHead>
                      </EnhancedTableRow>
                    </EnhancedTableHeader>
                    <EnhancedTableBody>
                      {submissions.map((submission, index) => (
                        <SalnSubmissionRow
                          key={submission.id}
                          submission={submission}
                          index={index}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          isSubmitting={isSubmitting}
                          onDownload={handleDownload}
                          isDownloading={!!downloadingId}
                          downloadingId={downloadingId}
                        />
                      ))}
                    </EnhancedTableBody>
                  </EnhancedTable>
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="mt-4">
                    <DataTablePagination
                      currentPage={page}
                      totalPages={pagination.totalPages}
                      pageSize={pageSize}
                      total={pagination.total}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                      itemName="submissions"
                    />
                  </div>
                )}
              </>
            )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
