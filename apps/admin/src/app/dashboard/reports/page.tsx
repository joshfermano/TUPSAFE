'use client';

import React, { memo, useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Landmark,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDistanceToNow, subMonths, format } from 'date-fns';

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

/**
 * Mock Data Generators
 */

// Generate 6-month submission trend data
const generateSubmissionTrend = () => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    months.push({
      month: format(date, 'MMM yyyy'),
      pds: Math.floor(Math.random() * 50) + 80, // 80-130 submissions
      saln: Math.floor(Math.random() * 40) + 60, // 60-100 submissions
    });
  }
  return months;
};

// Generate department compliance data
const generateDepartmentCompliance = () => {
  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Industrial Engineering',
    'Electronics Engineering',
  ];

  return departments.map((dept) => ({
    department: dept,
    compliance: Math.floor(Math.random() * 20) + 80, // 80-100%
  })).sort((a, b) => b.compliance - a.compliance);
};

// Generate status distribution data
const generateStatusDistribution = () => [
  { name: 'Approved', value: 456, color: '#10b981' },
  { name: 'Pending', value: 123, color: '#f59e0b' },
  { name: 'In Review', value: 87, color: '#3b82f6' },
  { name: 'Rejected', value: 34, color: '#ef4444' },
];

// Generate recent activity data
const generateRecentActivity = () => {
  const activities = [
    {
      type: 'approval',
      title: 'PDS Approved',
      description: 'Dr. Maria Santos - Computer Science',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    },
    {
      type: 'submission',
      title: 'SALN Submitted',
      description: 'Prof. Juan Dela Cruz - Electrical Engineering',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
    {
      type: 'review',
      title: 'Review Started',
      description: 'PDS - Engr. Ana Reyes - Mechanical Engineering',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
    {
      type: 'approval',
      title: 'SALN Approved',
      description: 'Dr. Pedro Garcia - Civil Engineering',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
    },
  ];
  return activities;
};

/**
 * Compliance Overview Card Component
 */
const ComplianceOverviewCard = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const currentRate = 92.5;
  const previousRate = 89.2;
  const trend = currentRate - previousRate;
  const isPositive = trend > 0;

  // 7-day mini trend data
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    rate: Math.random() * 5 + 88,
  }));

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
            <span className="text-4xl font-bold">{currentRate}%</span>
            <div
              className={`flex items-center gap-1 text-sm ${
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">vs previous period</p>

          {/* Mini area chart */}
          <div className="h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
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
                  stroke="#8B1538"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#miniTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
});

ComplianceOverviewCard.displayName = 'ComplianceOverviewCard';

/**
 * Submission Statistics Card Component
 */
const SubmissionStatsCard = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const stats = {
    pds: { current: 523, previous: 487, change: 7.4 },
    saln: { current: 401, previous: 378, change: 6.1 },
  };

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
                <p className="text-2xl font-bold">{stats.pds.current}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 dark:text-green-400">
              +{stats.pds.change}%
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
                <p className="text-2xl font-bold">{stats.saln.current}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 dark:text-green-400">
              +{stats.saln.change}%
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
      transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
});

SubmissionStatsCard.displayName = 'SubmissionStatsCard';

/**
 * Department Performance Card Component
 */
const DepartmentPerformanceCard = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [departmentData] = useState(generateDepartmentCompliance);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Department Performance
        </CardTitle>
        <CardDescription>Compliance by department</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData.slice(0, 4)} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="department"
                width={120}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Compliance']}
              />
              <Bar dataKey="compliance" radius={[0, 4, 4, 0]}>
                {departmentData.slice(0, 4).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.compliance >= 95
                        ? '#10b981'
                        : entry.compliance >= 85
                          ? '#f59e0b'
                          : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  if (prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
});

DepartmentPerformanceCard.displayName = 'DepartmentPerformanceCard';

/**
 * Recent Activity Summary Card Component
 */
const RecentActivityCard = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activities] = useState(generateRecentActivity);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'text-green-600 dark:text-green-400';
      case 'submission':
        return 'text-blue-600 dark:text-blue-400';
      case 'review':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Recent Activity
        </CardTitle>
        <CardDescription>Latest important activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex gap-3">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${getActivityColor(activity.type).replace('text-', 'bg-')}`} />
              <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
});

RecentActivityCard.displayName = 'RecentActivityCard';

/**
 * Main Reports Page Component
 */
export default function ReportsPage() {
  const [submissionTrendData] = useState(generateSubmissionTrend);
  const [departmentData] = useState(generateDepartmentCompliance);
  const [statusData] = useState(generateStatusDistribution);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const handleExport = (format: 'csv' | 'pdf') => {
    // Mock export functionality
    console.log(`Exporting report as ${format.toUpperCase()}...`);
    // In production, this would trigger actual export logic
  };

  const ChartCard = ({
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
        transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      >
        {content}
      </motion.div>
    );
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
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => handleExport('pdf')}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ComplianceOverviewCard />
          <SubmissionStatsCard />
          <DepartmentPerformanceCard />
          <RecentActivityCard />
        </div>

        {/* Interactive Charts Section */}
        <div className="space-y-6">
          {/* Submission Rate Trend - Line Chart */}
          <ChartCard
            title="Submission Rate Trend"
            description="PDS and SALN submissions over the last 6 months"
            delay={0.4}
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={submissionTrendData}>
                  <defs>
                    <linearGradient id="pdsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B1538" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="salnFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="pds"
                    stroke="#8B1538"
                    strokeWidth={2}
                    name="PDS Submissions"
                    dot={{ fill: '#8B1538', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saln"
                    stroke="#4A90E2"
                    strokeWidth={2}
                    name="SALN Submissions"
                    dot={{ fill: '#4A90E2', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Two-column layout for Bar and Pie charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Department Compliance Comparison - Bar Chart */}
            <ChartCard
              title="Department Compliance Comparison"
              description="All departments ranked by compliance rate"
              delay={0.5}
            >
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Compliance Rate']}
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
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Status Distribution - Donut Chart */}
            <ChartCard
              title="Status Distribution"
              description="Breakdown of all submission statuses"
              delay={0.6}
            >
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={(entry: any) =>
                        `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [value, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
