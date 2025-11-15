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
  useAuditLogsQuery,
  type AuditLogsFilters,
} from '@/hooks/useAuditLogsQuery';
import { useAuditLogsAnalytics } from '@/hooks/useAuditLogsAnalytics';
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
  }: {
    log: {
      id: string;
      createdAt: Date;
      user: string;
      user_email: string;
      action: string;
      resource: string;
      resourceId?: string | null;
      ipAddress?: string;
      details: string | null;
    };
    index: number;
  }) => {
    return (
      <EnhancedTableRow index={index}>
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
            <span className="font-medium">{log.user}</span>
            <span className="text-xs text-muted-foreground">
              {log.user_email}
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
            <span className="capitalize">{log.resource}</span>
            {log.resourceId && (
              <span className="text-xs text-muted-foreground">
                ID: {log.resourceId.substring(0, 8)}...
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
          {log.details || 'N/A'}
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

// Main Audit Logs Page Component
export default function AuditLogsPage() {
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Build filters object
  const filters = useMemo<AuditLogsFilters>(
    () => ({
      user: userFilter !== 'all' ? userFilter : undefined,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      resource: resourceFilter !== 'all' ? resourceFilter : undefined,
      search: searchQuery,
    }),
    [userFilter, actionFilter, resourceFilter, searchQuery]
  );

  // Fetch audit logs with filters
  const { data, isLoading, isError, error } = useAuditLogsQuery(filters);

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

  const handleExportCSV = useCallback(() => {
    console.log('Export to CSV clicked');
    // TODO: Implement CSV export
  }, []);

  const hasActiveFilters =
    userFilter !== 'all' ||
    actionFilter !== 'all' ||
    resourceFilter !== 'all' ||
    searchQuery;

  // Extract unique users from logs for filter
  const availableUsers = useMemo(() => {
    if (!data?.logs) return [{ value: 'all', label: 'All Users' }];

    const uniqueUsers = Array.from(
      new Set(data.logs.map((log) => log.user))
    ).map((user) => ({
      value: user,
      label: user,
    }));

    return [{ value: 'all', label: 'All Users' }, ...uniqueUsers];
  }, [data?.logs]);

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
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total}</div>
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
              <div className="text-2xl font-bold">{data.unique_users}</div>
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
              <div className="text-2xl font-bold">{data.total_actions}</div>
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
                {data.resources_affected}
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
      <Card className="glass-card">
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
                <SelectContent className="glass-dropdown">
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
                <SelectContent className="glass-dropdown">
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
                <SelectContent className="glass-dropdown">
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
                  {data?.logs?.length || 0} log(s) found
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
            {data?.logs?.length || 0} total log(s)
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
          {!isLoading && !isError && data?.logs?.length === 0 && (
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
          {!isLoading && !isError && data?.logs && data.logs.length > 0 && (
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
                  {data.logs.map((log, index) => (
                    <AuditLogRow key={log.id} log={log} index={index} />
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
