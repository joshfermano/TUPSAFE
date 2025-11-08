'use client';

import React, { memo, useEffect, useState } from 'react';
import {
  Users,
  Clock,
  FileText,
  Landmark,
  CheckCircle2,
  Activity,
  Eye,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import {
  useDashboardQuery,
  type DashboardStats,
} from '@/hooks/useDashboardQuery';
import {
  StatCard,
  LoadingCardGrid,
  ErrorAlert,
  StatusBadge,
} from '@/components/admin';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageTransition } from '@/components/PageTransition';
import {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableBody,
  EnhancedTableHead,
  EnhancedTableRow,
  EnhancedTableCell,
} from '@/components/admin/EnhancedTable';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Recent Activity Item Component (memoized with animation)
const ActivityItem = memo(
  ({
    log,
    index,
  }: {
    log: {
      id: string;
      timestamp: string;
      user: string;
      action: string;
      resource: string;
      details: string | null;
    };
    index: number;
  }) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Parse action to get type for color coding
    const actionType = log.action.toLowerCase();
    let actionColor = 'text-muted-foreground';

    if (actionType.includes('create') || actionType.includes('submit')) {
      actionColor = 'text-blue-600 dark:text-blue-400';
    } else if (actionType.includes('approve')) {
      actionColor = 'text-green-600 dark:text-green-400';
    } else if (actionType.includes('update') || actionType.includes('edit')) {
      actionColor = 'text-yellow-600 dark:text-yellow-400';
    } else if (actionType.includes('reject') || actionType.includes('delete')) {
      actionColor = 'text-red-600 dark:text-red-400';
    }

    const content = (
      <div className="flex items-start gap-3 py-3">
        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
        <div className="flex-1 space-y-1">
          <p className="text-sm">
            <span className="font-medium">{log.user}</span>{' '}
            <span className={actionColor}>{log.action}</span>{' '}
            <span className="font-medium">{log.resource}</span>
          </p>
          {log.details && (
            <p className="text-xs text-muted-foreground">{log.details}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    );

    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      return content;
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.2,
          delay: index * 0.05, // Stagger 50ms
          ease: [0.4, 0, 0.2, 1],
        }}>
        {content}
      </motion.div>
    );
  }
);

ActivityItem.displayName = 'ActivityItem';

// Generate compliance trend data (last 6 months)
const generateComplianceData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const baseRate = 85;

  return months.map((month, index) => ({
    month,
    rate: Math.min(
      100,
      Math.max(70, baseRate + (Math.random() * 10 - 5) + index * 0.5)
    ),
  }));
};

// Compliance Chart Component (memoized)
const ComplianceChart = memo(() => {
  const [chartData] = useState(generateComplianceData);

  const chartConfig = {
    rate: {
      label: 'Compliance Rate',
      color: '#8B1538',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compliance Trend</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B1538" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRate)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

ComplianceChart.displayName = 'ComplianceChart';

// Main Dashboard Page Component
export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardQuery();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Wrapper component for StatCard with animation
  const AnimatedStatCard = ({
    index,
    ...props
  }: {
    index: number;
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
      direction: 'up' | 'down';
      percentage: number;
      isPositive: boolean;
    };
    description?: string;
  }) => {
    if (prefersReducedMotion) {
      return <StatCard {...props} />;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.1, // Stagger 100ms
          ease: [0.4, 0, 0.2, 1],
        }}>
        <StatCard {...props} />
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
          </p>
        </div>
        <LoadingCardGrid count={6} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
          </p>
        </div>
        <ErrorAlert
          error={error || 'Failed to load dashboard data'}
          title="Failed to load dashboard data"
        />
      </div>
    );
  }

  const stats = data as DashboardStats;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatedStatCard
            index={0}
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            trend={{
              direction: stats.trends.users >= 0 ? 'up' : 'down',
              percentage: Math.abs(stats.trends.users),
              isPositive: stats.trends.users >= 0,
            }}
            description="vs last month"
          />
          <AnimatedStatCard
            index={1}
            title="Pending Approvals"
            value={stats.totalPendingApprovals}
            icon={Clock}
          />
          <AnimatedStatCard
            index={2}
            title="PDS Submissions"
            value={stats.pdsSubmissions}
            icon={FileText}
            trend={{
              direction: stats.trends.pds >= 0 ? 'up' : 'down',
              percentage: Math.abs(stats.trends.pds),
              isPositive: stats.trends.pds >= 0,
            }}
            description="vs last month"
          />
          <AnimatedStatCard
            index={3}
            title="SALN Submissions"
            value={stats.salnSubmissions}
            icon={Landmark}
            trend={{
              direction: stats.trends.saln >= 0 ? 'up' : 'down',
              percentage: Math.abs(stats.trends.saln),
              isPositive: stats.trends.saln >= 0,
            }}
            description="vs last month"
          />
          <AnimatedStatCard
            index={4}
            title="Compliance Rate"
            value={`${stats.complianceRate}%`}
            icon={CheckCircle2}
          />
          <AnimatedStatCard
            index={5}
            title="System Health"
            value={stats.systemHealth}
            icon={Activity}
          />
        </div>

        {/* Compliance Trend Chart and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Compliance Chart */}
          <ComplianceChart />

          {/* Recent Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {stats.recentActivity.map((log, index) => (
                    <ActivityItem key={log.id} log={log} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>Submissions awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  No pending submissions
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <EnhancedTable>
                  <EnhancedTableHeader>
                    <EnhancedTableRow animate={false}>
                      <EnhancedTableHead>Type</EnhancedTableHead>
                      <EnhancedTableHead>Employee</EnhancedTableHead>
                      <EnhancedTableHead className="hidden md:table-cell">
                        Department
                      </EnhancedTableHead>
                      <EnhancedTableHead className="hidden lg:table-cell">
                        Submitted
                      </EnhancedTableHead>
                      <EnhancedTableHead>Status</EnhancedTableHead>
                      <EnhancedTableHead className="w-[50px]">
                        <span className="sr-only">Actions</span>
                      </EnhancedTableHead>
                    </EnhancedTableRow>
                  </EnhancedTableHeader>
                  <EnhancedTableBody>
                    {stats.pendingSubmissions.map((submission, index) => (
                      <EnhancedTableRow key={submission.id} index={index}>
                        <EnhancedTableCell>
                          <div className="flex items-center gap-2">
                            {submission.type === 'PDS' ? (
                              <FileText className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Landmark className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="font-medium">
                              {submission.type}
                            </span>
                          </div>
                        </EnhancedTableCell>
                        <EnhancedTableCell>
                          {submission.employee}
                        </EnhancedTableCell>
                        <EnhancedTableCell className="hidden md:table-cell">
                          {submission.department}
                        </EnhancedTableCell>
                        <EnhancedTableCell className="hidden lg:table-cell">
                          {formatDistanceToNow(
                            new Date(submission.submittedAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </EnhancedTableCell>
                        <EnhancedTableCell>
                          <StatusBadge
                            status={
                              submission.status as
                                | 'draft'
                                | 'submitted'
                                | 'reviewing'
                                | 'approved'
                                | 'rejected'
                            }
                          />
                        </EnhancedTableCell>
                        <EnhancedTableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-dropdown">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Quick Review
                              </DropdownMenuItem>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </EnhancedTableCell>
                      </EnhancedTableRow>
                    ))}
                  </EnhancedTableBody>
                </EnhancedTable>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
