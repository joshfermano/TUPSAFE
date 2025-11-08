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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// PDS Submission Row Component (memoized)
const PdsSubmissionRow = memo(
  ({ submission }: { submission: PdsSubmissionWithDetails }) => {
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
        <TableRow>
          <TableCell>
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
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {submission.department?.name || 'N/A'}
          </TableCell>
          <TableCell>
            <StatusBadge status={submission.submission.status} />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            {formatDistanceToNow(new Date(submission.submission.createdAt), {
              addSuffix: true,
            })}
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            {submission.submission.updatedAt
              ? format(new Date(submission.submission.updatedAt), 'MMM d, yyyy')
              : 'N/A'}
          </TableCell>
          <TableCell>
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
          </TableCell>
        </TableRow>

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PDS Submissions</h1>
        <p className="text-muted-foreground">
          Review and manage Personal Data Sheet submissions
        </p>
      </div>

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

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Department
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Submitted
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Reviewed
                      </TableHead>
                      <TableHead className="w-[50px]">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <PdsSubmissionRow
                        key={submission.submission.id}
                        submission={submission}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
