'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  FileSearch,
  Filter,
  Download,
  Search,
  Activity,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import {
  PersonIcon,
  BarChartIcon,
  ComponentInstanceIcon,
  GlobeIcon,
  CalendarIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';

import {
  useAuditLogsQuery,
  type AuditLogsFilters,
} from '@/hooks/useAuditLogsQuery';
import { useAuditLogsAnalytics } from '@/hooks/useAuditLogsAnalytics';
import { usePagination } from '@/hooks/usePagination';
import { EmptyState, ErrorAlert } from '@/components/admin';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

// Action types for filtering
const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'submit', label: 'Submit' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

// Resource types for filtering
const RESOURCES = [
  { value: 'all', label: 'All Resources' },
  { value: 'user', label: 'User' },
  { value: 'pds', label: 'PDS' },
  { value: 'saln', label: 'SALN' },
  { value: 'profile', label: 'Profile' },
  { value: 'settings', label: 'Settings' },
];

// Colors for charts (TUP Crimson shades)
const CHART_COLORS = [
  '#8B1538',
  '#DC143C',
  '#FF6B6B',
  '#FFA07A',
  '#FFB6C1',
  '#FFC0CB',
];

// Get badge variant based on action
const getActionBadgeVariant = (
  action: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('submit')) {
    return 'default';
  }
  if (actionLower.includes('approve')) {
    return 'secondary';
  }
  if (actionLower.includes('delete') || actionLower.includes('reject')) {
    return 'destructive';
  }
  return 'outline';
};

// Audit Log Row Component (memoized)
const AuditLogRow = memo(
  ({
    log,
    index,
    onClick,
  }: {
    log: {
      id: string;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        employeeId: string | null;
      };
      action: string;
      entityType: string;
      entityId?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      changes: Record<string, unknown> | null;
    };
    index: number;
    onClick: () => void;
  }) => {
    const userName = `${log.user.firstName} ${log.user.lastName}`;
    const userEmail = log.user.employeeId || log.user.id.substring(0, 8);
    const changesSummary = log.changes ? JSON.stringify(log.changes).substring(0, 100) : null;

    return (
      <EnhancedTableRow
        index={index}
        onClick={onClick}
        className="cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <EnhancedTableCell className="hidden lg:table-cell">
          <div className="flex flex-col gap-1">
            <span className="text-sm">
              {format(new Date(log.createdAt), 'MMM d, yyyy')}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.createdAt), 'h:mm a')}
            </span>
          </div>
        </EnhancedTableCell>
        <EnhancedTableCell>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {userEmail}
            </span>
          </div>
        </EnhancedTableCell>
        <EnhancedTableCell>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.02 }}>
            <Badge variant={getActionBadgeVariant(log.action)}>
              {log.action}
            </Badge>
          </motion.div>
        </EnhancedTableCell>
        <EnhancedTableCell>
          <div className="flex flex-col gap-1">
            <span className="capitalize">{log.entityType}</span>
            {log.entityId && (
              <span className="text-xs text-muted-foreground">
                ID: {log.entityId.substring(0, 8)}...
              </span>
            )}
          </div>
        </EnhancedTableCell>
        <EnhancedTableCell className="hidden xl:table-cell">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {log.ipAddress || 'N/A'}
          </code>
        </EnhancedTableCell>
        <EnhancedTableCell className="max-w-[200px] truncate">
          {changesSummary || 'N/A'}
        </EnhancedTableCell>
      </EnhancedTableRow>
    );
  }
);

AuditLogRow.displayName = 'AuditLogRow';

// Loading Skeleton
const LoadingTable = memo(() => (
  <div className="space-y-3">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[80px]" />
      </div>
    ))}
  </div>
));

LoadingTable.displayName = 'LoadingTable';

// Type definition for the selected log
type SelectedLog = {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string | null;
  };
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  changes: Record<string, unknown> | null;
};

// Main Audit Logs Page Component
export default function AuditLogsPage() {
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SelectedLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initialize pagination hook
  const { page, pageSize, paginationParams, setPage, setPageSize } = usePagination(20);

  // Build filters object
  const filters = useMemo<AuditLogsFilters>(
    () => ({
      ...paginationParams,
      user: userFilter !== 'all' ? userFilter : undefined,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      resource: resourceFilter !== 'all' ? resourceFilter : undefined,
      search: searchQuery,
    }),
    [paginationParams, userFilter, actionFilter, resourceFilter, searchQuery]
  );

  // Fetch audit logs with filters
  const { logs, stats, pagination, isLoading, isError, error, exportAuditLogsToCSV } = useAuditLogsQuery(filters);

  // Fetch analytics data for charts
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
  } = useAuditLogsAnalytics();

  // Use real data from analytics API
  const activityTimelineData = analyticsData?.timeline || [];
  const actionDistributionData = analyticsData?.distribution || [];

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setUserFilter('all');
    setActionFilter('all');
    setResourceFilter('all');
    setSearchQuery('');
  }, []);

  const handleExportCSV = useCallback(async () => {
    try {
      await exportAuditLogsToCSV();
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  }, [exportAuditLogsToCSV]);

  const handleLogClick = useCallback((log: SelectedLog) => {
    setSelectedLog(log);
    setSheetOpen(true);
  }, []);

  const hasActiveFilters =
    userFilter !== 'all' ||
    actionFilter !== 'all' ||
    resourceFilter !== 'all' ||
    searchQuery;

  // Extract unique users from logs for filter
  const availableUsers = useMemo(() => {
    if (!logs || logs.length === 0) return [{ value: 'all', label: 'All Users' }];

    const uniqueUsers = Array.from(
      new Set(logs.map((log) => `${log.user.firstName} ${log.user.lastName}`))
    ).map((userName) => ({
      value: userName,
      label: userName,
    }));

    return [{ value: 'all', label: 'All Users' }, ...uniqueUsers];
  }, [logs]);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">All audit entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Active in period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <p className="text-xs text-muted-foreground">System activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resources Affected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.resourcesAffected}
              </div>
              <p className="text-xs text-muted-foreground">Modified entities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts - Activity Timeline and Action Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Timeline Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Activity Timeline</CardTitle>
            </div>
            <CardDescription>
              Log activity over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : isAnalyticsError ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Failed to load timeline data
                </p>
              </div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: 'Activity Count',
                    color: '#8B1538',
                  },
                }}
                className="h-[300px]">
                <LineChart data={activityTimelineData}>
                  <XAxis
                    dataKey="date"
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
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-count)', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Action Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <CardTitle>Action Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of actions by type</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : isAnalyticsError ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Failed to load distribution data
                </p>
              </div>
            ) : (
              <ChartContainer
                config={{
                  value: {
                    label: 'Count',
                    color: '#8B1538',
                  },
                }}
                className="h-[300px]">
                <PieChart>
                  <Pie
                    data={actionDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="var(--color-value)"
                    dataKey="value">
                    {actionDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search Input with animated icon */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: searchFocused ? 1.1 : 1,
                    rotate: searchFocused ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-9"
                />
              </div>

              {/* User Filter */}
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="">
                  {availableUsers.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="">
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Resource Filter */}
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent className="">
                  {RESOURCES.map((resource) => (
                    <SelectItem key={resource.value} value={resource.value}>
                      {resource.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {logs?.length || 0} log(s) found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {logs?.length || 0} log(s) on this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && <LoadingTable />}

          {/* Error State */}
          {isError && (
            <ErrorAlert
              error={error || 'Failed to load audit logs'}
              title="Failed to load audit logs"
            />
          )}

          {/* Empty State */}
          {!isLoading && !isError && logs?.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? Search : FileSearch}
              title={
                hasActiveFilters ? 'No logs found' : 'No audit logs available'
              }
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Audit logs will appear here as activities occur in the system'
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

          {/* Audit Logs Table */}
          {!isLoading && !isError && logs && logs.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <EnhancedTable>
                  <EnhancedTableHeader>
                    <EnhancedTableRow animate={false}>
                      <EnhancedTableHead className="hidden lg:table-cell">
                        Timestamp
                      </EnhancedTableHead>
                      <EnhancedTableHead>User</EnhancedTableHead>
                      <EnhancedTableHead>Action</EnhancedTableHead>
                      <EnhancedTableHead>Resource</EnhancedTableHead>
                      <EnhancedTableHead className="hidden xl:table-cell">
                        IP Address
                      </EnhancedTableHead>
                      <EnhancedTableHead>Details</EnhancedTableHead>
                    </EnhancedTableRow>
                  </EnhancedTableHeader>
                  <EnhancedTableBody>
                    {logs.map((log, index) => (
                      <AuditLogRow
                        key={log.id}
                        log={log}
                        index={index}
                        onClick={() => handleLogClick(log)}
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
                    itemName="logs"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl">Audit Log Details</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedLog.createdAt), 'MMMM d, yyyy \'at\' h:mm:ss a')}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* User Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PersonIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">User Information</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-3 pl-7">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Name:
                      </span>
                      <span className="col-span-2 text-sm">
                        {selectedLog.user.firstName} {selectedLog.user.lastName}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        User ID:
                      </span>
                      <span className="col-span-2 text-sm font-mono">
                        {selectedLog.user.id}
                      </span>
                    </div>
                    {selectedLog.user.employeeId && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Employee ID:
                        </span>
                        <span className="col-span-2 text-sm font-mono">
                          {selectedLog.user.employeeId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Action Details</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-3 pl-7">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Action:
                      </span>
                      <span className="col-span-2 text-sm">
                        <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                          {selectedLog.action}
                        </Badge>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Log ID:
                      </span>
                      <span className="col-span-2 text-sm font-mono break-all">
                        {selectedLog.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resource Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ComponentInstanceIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Resource Information</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-3 pl-7">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Entity Type:
                      </span>
                      <span className="col-span-2 text-sm capitalize">
                        {selectedLog.entityType}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Entity ID:
                      </span>
                      <span className="col-span-2 text-sm font-mono break-all">
                        {selectedLog.entityId || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Changes Section */}
                {selectedLog.changes && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ReaderIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Changes</h3>
                    </div>
                    <Separator />
                    <div className="pl-7">
                      <div className="rounded-md bg-muted p-4">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap wrap-break-word">
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Metadata</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-3 pl-7">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        IP Address:
                      </span>
                      <span className="col-span-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {selectedLog.ipAddress || 'N/A'}
                        </code>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        User Agent:
                      </span>
                      <span className="col-span-2 text-xs break-all">
                        {selectedLog.userAgent || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Timestamp</h3>
                  </div>
                  <Separator />
                  <div className="grid gap-3 pl-7">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Date:
                      </span>
                      <span className="col-span-2 text-sm">
                        {format(new Date(selectedLog.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Time:
                      </span>
                      <span className="col-span-2 text-sm">
                        {format(new Date(selectedLog.createdAt), 'h:mm:ss a')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        ISO 8601:
                      </span>
                      <span className="col-span-2 text-xs font-mono break-all">
                        {new Date(selectedLog.createdAt).toISOString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
