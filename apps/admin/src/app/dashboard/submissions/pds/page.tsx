'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Filter,
  Eye,
  Download,
  MoreVertical,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

import {
  usePdsSubmissionsQuery,
  type PdsSubmissionsFilters,
  type PdsSubmissionWithDetails,
} from '@/hooks/usePdsSubmissionsQuery';
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

// Available departments for filtering
const DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'science', label: 'Science' },
  { value: 'liberal_arts', label: 'Liberal Arts' },
  { value: 'industrial_technology', label: 'Industrial Technology' },
];

// Status types
type StatusType = 'all' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

// Mock data for submission timeline chart (monthly counts by status)
const getSubmissionTimelineData = () => {
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  return months.map((month) => ({
    month,
    submitted: Math.floor(Math.random() * 15) + 10,
    approved: Math.floor(Math.random() * 12) + 5,
    rejected: Math.floor(Math.random() * 5) + 1,
  }));
};

// PDS Submission Row Component (memoized)
const PdsSubmissionRow = memo(
  ({ submission, index }: { submission: PdsSubmissionWithDetails; index: number }) => {
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    const handleAction = useCallback((action: string) => {
      console.log(`Action: ${action} for submission:`, submission.submission.id);
      // TODO: Implement actions
    }, [submission.submission.id]);

    const employeeName = submission.user
      ? `${submission.user.firstName} ${submission.user.lastName}`
      : 'Unknown';

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
            {submission.department?.name || 'N/A'}
          </EnhancedTableCell>
          <EnhancedTableCell>
            <StatusBadge status={submission.submission.status} />
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden lg:table-cell">
            {formatDistanceToNow(new Date(submission.submission.createdAt), {
              addSuffix: true,
            })}
          </EnhancedTableCell>
          <EnhancedTableCell className="hidden xl:table-cell">
            {submission.submission.updatedAt
              ? format(new Date(submission.submission.updatedAt), 'MMM d, yyyy')
              : 'N/A'}
          </EnhancedTableCell>
          <EnhancedTableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReviewDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Quick Review
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/submissions/pds/${submission.submission.id}`}>
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
              <DialogTitle>Quick Review - PDS Submission</DialogTitle>
              <DialogDescription>
                {employeeName} - {submission.department?.name || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <StatusBadge status={submission.submission.status} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(submission.submission.createdAt), 'PPP')}
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
                  <Link href={`/dashboard/submissions/pds/${submission.submission.id}`}>
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

PdsSubmissionRow.displayName = 'PdsSubmissionRow';

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

// Main PDS Submissions Page Component
export default function PdsSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Build filters object
  const filters = useMemo<PdsSubmissionsFilters>(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      search: searchQuery,
    }),
    [statusFilter, departmentFilter, searchQuery]
  );

  // Fetch submissions with filters
  const {
    data: submissions,
    isLoading,
    isError,
    error,
  } = usePdsSubmissionsQuery(filters);

  // Mock submission timeline data
  const timelineData = useMemo(() => getSubmissionTimelineData(), []);

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setStatusFilter('all');
    setDepartmentFilter('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters =
    statusFilter !== 'all' || departmentFilter !== 'all' || searchQuery;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PDS Submissions</h1>
        <p className="text-muted-foreground">
          Review and manage Personal Data Sheet submissions
        </p>
      </div>

      {/* Submission Timeline Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Submission Timeline</CardTitle>
          </div>
          <CardDescription>Monthly submission counts by status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData}>
              <XAxis
                dataKey="month"
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey="submitted" fill="#8B1538" name="Submitted" />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Tabs with animated indicator */}
      <div className="relative">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusType)}
        >
          <TabsList className="relative">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                  className="pl-9"
                />
              </div>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
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
              <div className="flex items-center justify-between">
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
              icon={hasActiveFilters ? Search : FileText}
              title={
                hasActiveFilters
                  ? 'No submissions found'
                  : 'No PDS submissions available'
              }
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'PDS submissions will appear here once employees submit them'
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
                        Department
                      </EnhancedTableHead>
                      <EnhancedTableHead>Status</EnhancedTableHead>
                      <EnhancedTableHead className="hidden lg:table-cell">
                        Submitted
                      </EnhancedTableHead>
                      <EnhancedTableHead className="hidden xl:table-cell">
                        Reviewed
                      </EnhancedTableHead>
                      <EnhancedTableHead className="w-[50px]">
                        <span className="sr-only">Actions</span>
                      </EnhancedTableHead>
                    </EnhancedTableRow>
                  </EnhancedTableHeader>
                  <EnhancedTableBody>
                    {submissions.map((submission, index) => (
                      <PdsSubmissionRow
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
