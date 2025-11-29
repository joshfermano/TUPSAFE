'use client';

import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  FileText,
  Landmark,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';

import { PageTransition } from '@/components/PageTransition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useReportsOverview, useExportReport } from '@/hooks/useReports';

/**
 * Compliance Overview Card Component
 */
interface ComplianceOverviewCardProps {
  overallRate: number;
  trendPercentage: number;
}

const ComplianceOverviewCard = memo(
  ({ overallRate, trendPercentage }: ComplianceOverviewCardProps) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }, []);

    const isPositive = trendPercentage > 0;

    // 7-day mini trend data - visual representation only
    const trendData = useMemo(() => {
      const baseRate = overallRate;
      return Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        rate: baseRate + (Math.random() * 3 - 1.5),
      }));
    }, [overallRate]);

    const chartConfig = {
      rate: {
        label: 'Compliance Rate',
        color: '#8B1538',
      },
    };

    const content = (
      <Card className="bg-gradient-to-br from-[#8B1538]/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Compliance Overview
          </CardTitle>
          <CardDescription>Overall compliance rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {overallRate.toFixed(1)}%
              </span>
              <div
                className={`flex items-center gap-1 text-sm ${
                  isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              7-day trend vs previous period
            </p>

            {/* Mini area chart */}
            <ChartContainer config={chartConfig} className="h-[60px]">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="miniTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1538" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--color-rate)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#miniTrend)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    );

    if (prefersReducedMotion) return content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
        {content}
      </motion.div>
    );
  }
);

ComplianceOverviewCard.displayName = 'ComplianceOverviewCard';

/**
 * Submission Statistics Card Component
 */
interface SubmissionStatsCardProps {
  pdsTotal: number;
  salnTotal: number;
  pdsRecent: number;
  salnRecent: number;
}

const SubmissionStatsCard = memo(
  ({
    pdsTotal,
    salnTotal,
    pdsRecent,
    salnRecent,
  }: SubmissionStatsCardProps) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }, []);

    const content = (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Submission Statistics
          </CardTitle>
          <CardDescription>Total submissions this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PDS Submissions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">PDS Submissions</p>
                  <p className="text-2xl font-bold">{pdsTotal}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-blue-600 dark:text-blue-400">
                {pdsRecent} recent
              </Badge>
            </div>

            <Separator />

            {/* SALN Submissions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                  <Landmark className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">SALN Submissions</p>
                  <p className="text-2xl font-bold">{salnTotal}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-purple-600 dark:text-purple-400">
                {salnRecent} recent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (prefersReducedMotion) return content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}>
        {content}
      </motion.div>
    );
  }
);

SubmissionStatsCard.displayName = 'SubmissionStatsCard';

/**
 * Department Performance Card Component
 */
interface DepartmentPerformanceCardProps {
  departments: Array<{ name: string; rate: number }>;
}

const DepartmentPerformanceCard = memo(
  ({ departments }: DepartmentPerformanceCardProps) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }, []);

    // Take top 4 departments for the card
    const topDepartments = useMemo(
      () => departments.slice(0, 4),
      [departments]
    );

    const chartConfig = {
      compliance: {
        label: 'Compliance',
        color: '#8B1538',
      },
    };

    const content = (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Department Performance
          </CardTitle>
          <CardDescription>Compliance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[180px]">
            <BarChart data={topDepartments} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${Number(value)}%`}
                  />
                }
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {topDepartments.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.rate >= 95
                        ? '#10b981'
                        : entry.rate >= 85
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );

    if (prefersReducedMotion) return content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}>
        {content}
      </motion.div>
    );
  }
);

DepartmentPerformanceCard.displayName = 'DepartmentPerformanceCard';

/**
 * Recent Activity Summary Card Component
 */
interface RecentActivityCardProps {
  activities: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: Date;
    type: 'pds' | 'saln' | 'user' | 'system';
  }>;
}

const RecentActivityCard = memo(({ activities }: RecentActivityCardProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const getActivityColor = (type: 'pds' | 'saln' | 'user' | 'system') => {
    switch (type) {
      case 'pds':
        return 'text-blue-600 dark:text-blue-400';
      case 'saln':
        return 'text-purple-600 dark:text-purple-400';
      case 'user':
        return 'text-green-600 dark:text-green-400';
      case 'system':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <CardDescription>Latest important activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${getActivityColor(
                    activity.type
                  ).replace('text-', 'bg-')}`}
                />
                <div className="flex-1 space-y-1">
                  <p
                    className={`text-sm font-medium ${getActivityColor(
                      activity.type
                    )}`}>
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}>
      {content}
    </motion.div>
  );
});

RecentActivityCard.displayName = 'RecentActivityCard';

/**
 * Loading skeleton component
 */
function ReportsPageSkeleton() {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

/**
 * Error state component
 */
function ReportsErrorState({ error }: { error: Error }) {
  return (
    <PageTransition>
      <div className="p-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                Failed to Load Reports
              </CardTitle>
            </div>
            <CardDescription>
              {error.message ||
                'An error occurred while loading the reports data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

/**
 * Main Reports Page Component
 */
export default function ReportsPage() {
  const { data: reports, isLoading, isError, error } = useReportsOverview();
  const exportMutation = useExportReport();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  // Handle export actions - defined before early returns
  const handleExportCSV = useCallback(() => {
    exportMutation.mutate({ format: 'csv', reportType: 'compliance' });
  }, [exportMutation]);

  const handleExportPDF = useCallback(() => {
    exportMutation.mutate({ format: 'pdf', reportType: 'compliance' });
  }, [exportMutation]);

  // Transform data - with null checks for TypeScript
  const submissionTrendData = useMemo(
    () =>
      reports?.submissionTrends.map((item) => ({
        month: format(new Date(item.month + '-01'), 'MMM yyyy'),
        pds: item.pdsCount,
        saln: item.salnCount,
      })) ?? [],
    [reports]
  );

  const departmentData = useMemo(
    () =>
      reports?.departmentCompliance.map((dept) => ({
        department: dept.name,
        compliance: dept.rate,
      })) ?? [],
    [reports]
  );

  const statusData = useMemo(
    () =>
      reports
        ? [
            {
              name: 'Approved',
              value: reports.statusDistribution.approved,
              color: '#10b981',
            },
            {
              name: 'Pending',
              value: reports.statusDistribution.pending,
              color: '#f59e0b',
            },
            {
              name: 'In Review',
              value: reports.statusDistribution.inReview,
              color: '#3b82f6',
            },
            {
              name: 'Rejected',
              value: reports.statusDistribution.rejected,
              color: '#ef4444',
            },
          ]
        : [],
    [reports]
  );

  // Memoize ChartCard for performance
  const ChartCard = useCallback(
    ({
      children,
      title,
      description,
      delay = 0,
    }: {
      children: React.ReactNode;
      title: string;
      description: string;
      delay?: number;
    }) => {
      const content = (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      );

      if (prefersReducedMotion) return content;

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}>
          {content}
        </motion.div>
      );
    },
    [prefersReducedMotion]
  );

  // Loading state
  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  // Error state
  if (isError) {
    return <ReportsErrorState error={error} />;
  }

  // No data
  if (!reports) {
    return null;
  }

  // Destructure data
  const {
    complianceOverview,
    submissionStats,
    departmentCompliance,
    recentActivity,
  } = reports;

  const dualLineChartConfig = {
    pds: {
      label: 'PDS Submissions',
      color: '#8B1538',
    },
    saln: {
      label: 'SALN Submissions',
      color: '#4A90E2',
    },
  };

  const departmentBarChartConfig = {
    compliance: {
      label: 'Compliance Rate',
      color: '#8B1538',
    },
  };

  const statusPieConfig = {
    value: {
      label: 'Count',
      color: '#8B1538',
    },
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with Export Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and compliance reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={exportMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exportMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ComplianceOverviewCard
            overallRate={complianceOverview.overallRate}
            trendPercentage={complianceOverview.trendPercentage}
          />
          <SubmissionStatsCard
            pdsTotal={submissionStats.pdsTotal}
            salnTotal={submissionStats.salnTotal}
            pdsRecent={submissionStats.pdsRecent}
            salnRecent={submissionStats.salnRecent}
          />
          <DepartmentPerformanceCard
            departments={departmentCompliance.map((d) => ({
              name: d.name,
              rate: d.rate,
            }))}
          />
          <RecentActivityCard activities={recentActivity} />
        </div>

        {/* Interactive Charts Section */}
        <div className="space-y-6">
          {/* Submission Rate Trend - Line Chart */}
          <ChartCard
            title="Submission Rate Trend"
            description="PDS and SALN submissions over the last 6 months"
            delay={0.4}>
            <ChartContainer config={dualLineChartConfig} className="h-[300px]">
              <LineChart data={submissionTrendData}>
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="pds"
                  stroke="var(--color-pds)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-pds)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="saln"
                  stroke="var(--color-saln)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-saln)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>

          {/* Two-column layout for Bar and Pie charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Department Compliance Comparison - Bar Chart */}
            <ChartCard
              title="Department Compliance Comparison"
              description="All departments ranked by compliance rate"
              delay={0.5}>
              <ChartContainer
                config={departmentBarChartConfig}
                className="h-[300px]">
                <BarChart data={departmentData} layout="vertical">
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={150}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Number(value)}%`}
                      />
                    }
                  />
                  <Bar dataKey="compliance" radius={[0, 4, 4, 0]}>
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.compliance >= 95
                            ? '#10b981'
                            : entry.compliance >= 90
                            ? '#8B1538'
                            : entry.compliance >= 85
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ChartCard>

            {/* Status Distribution - Donut Chart */}
            <ChartCard
              title="Status Distribution"
              description="Breakdown of all submission statuses"
              delay={0.6}>
              <ChartContainer config={statusPieConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => {
                      const data = entry as unknown as {
                        name: string;
                        percent: number;
                      };
                      return `${data.name} ${(data.percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [Number(value), 'Count']}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
