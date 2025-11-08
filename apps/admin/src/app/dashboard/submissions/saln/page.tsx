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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import {
  useSalnSubmissionsQuery,
  type SalnSubmissionsFilters,
  type SalnSubmissionWithDetails,
} from '@/hooks/useSalnSubmissionsQuery';
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

// Available departments for filtering
const DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'science', label: 'Science' },
  { value: 'liberal_arts', label: 'Liberal Arts' },
  { value: 'industrial_technology', label: 'Industrial Technology' },
];

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

// Mock data for net worth trend chart (average net worth over years)
const getNetWorthTrendData = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 5; i >= 0; i--) {
    years.push({
      year: (currentYear - i).toString(),
      avgNetWorth: 800000 + i * 150000 + Math.floor(Math.random() * 100000),
    });
  }
  return years;
};

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
const SalnSubmissionRow = memo(
  ({ submission, index }: { submission: SalnSubmissionWithDetails; index: number }) => {
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    const handleAction = useCallback((action: string) => {
      console.log(`Action: ${action} for submission:`, submission.submission.id);
      // TODO: Implement actions
    }, [submission.submission.id]);

    const employeeName = submission.user
      ? `${submission.user.firstName} ${submission.user.lastName}`
      : 'Unknown';

    const netWorth = parseFloat(submission.submission.netWorth || '0');

    return (
      <>
        <EnhancedTableRow index={index}>
          <EnhancedTableCell>
            <div className="flex items-center gap-3">
              <UserAvatar
                user={{
                  firstName: submission.user?.firstName || 'Unknown',
                  lastName: submission.user?.lastName || 'User',
                  avatarUrl: null,
                }}
                size="sm"
              />
              <div>
                <p className="font-medium">{employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {submission.user?.employeeId || 'N/A'}
                </p>
              </div>
            </div>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden md:table-cell">
            <Badge variant="outline">{submission.submission.year}</Badge>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden lg:table-cell">
            <span className="font-medium">
              {formatCurrency(netWorth)}
            </span>
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden xl:table-cell">
            {submission.department?.name || 'N/A'}
          </EnhancedTableCell>
          <EnhancedTableCell>
            <StatusBadge status={submission.submission.status} />
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden 2xl:table-cell">
            {formatDistanceToNow(new Date(submission.submission.createdAt), {
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
                  <Link href={`/dashboard/submissions/saln/view/${submission.submission.id}`}>
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction('download')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                {submission.submission.status === 'submitted' && (
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
                {employeeName} - {submission.submission.year}
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
                    <StatusBadge status={submission.submission.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(submission.submission.createdAt), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.department?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                {submission.submission.approvedBy && (
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.submission.approvedBy}
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
                  <Link href={`/dashboard/submissions/saln/view/${submission.submission.id}`}>
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

  // Build filters object
  const filters = useMemo<SalnSubmissionsFilters>(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      year: yearFilter !== 'all' ? parseInt(yearFilter) : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      search: searchQuery,
    }),
    [statusFilter, yearFilter, departmentFilter, searchQuery]
  );

  // Fetch submissions with filters
  const {
    data: submissions,
    isLoading,
    isError,
    error,
  } = useSalnSubmissionsQuery(filters);

  // Mock net worth trend data
  const netWorthTrendData = useMemo(() => getNetWorthTrendData(), []);

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
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-subtle">
                <p className="text-sm text-muted-foreground">
                  {submissions?.length || 0} submission(s) found
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
            {submissions?.length || 0} total submission(s)
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
          {!isLoading && !isError && submissions?.length === 0 && (
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
          {!isLoading &&
            !isError &&
            submissions &&
            submissions.length > 0 && (
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
                        key={submission.submission.id}
                        submission={submission}
                        index={index}
                      />
                    ))}
                  </EnhancedTableBody>
                </EnhancedTable>
              </div>
            )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
