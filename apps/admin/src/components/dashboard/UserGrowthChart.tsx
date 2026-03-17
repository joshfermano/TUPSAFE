/**
 * User Growth Chart
 *
 * Area chart showing user growth over time with period selector
 */

'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardTrends } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import type { TrendsQueryParams } from '@tupsafe/types';

const chartConfig = {
  total: {
    label: 'Total Users',
    color: 'hsl(var(--primary))',
  },
  employees: {
    label: 'Employees',
    color: 'hsl(var(--chart-2))',
  },
  applicants: {
    label: 'Applicants',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function UserGrowthChart() {
  const [period, setPeriod] = useState<TrendsQueryParams['period']>('month');
  const [groupBy, setGroupBy] = useState<TrendsQueryParams['groupBy']>('day');

  const { data, isLoading, isError } = useDashboardTrends({
    period,
    metric: 'users',
    groupBy,
  });

  // Adjust groupBy based on period
  const handlePeriodChange = (newPeriod: TrendsQueryParams['period']) => {
    setPeriod(newPeriod);

    // Auto-adjust groupBy for optimal data points
    if (newPeriod === 'week') {
      setGroupBy('day');
    } else if (newPeriod === 'month') {
      setGroupBy('day');
    } else if (newPeriod === 'quarter') {
      setGroupBy('week');
    } else if (newPeriod === 'year') {
      setGroupBy('month');
    }
  };

  if (isLoading) {
    return <UserGrowthChartSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Failed to load chart data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] sm:h-[250px] md:h-[300px] items-center justify-center text-sm text-muted-foreground">
            Unable to load chart data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart (with breakdown if available)
  const chartData = data.data.map((point) => ({
    date:
      typeof point.date === 'string'
        ? point.date
        : format(new Date(point.date), 'MMM dd'),
    total: point.value,
    employees: point.breakdown?.employees || 0,
    applicants: point.breakdown?.applicants || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              {data.summary.trend === 'up'
                ? '↑'
                : data.summary.trend === 'down'
                ? '↓'
                : '→'}{' '}
              {Math.abs(data.summary.percentageChange).toFixed(1)}% vs previous
              period
            </CardDescription>
          </div>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillEmployees" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-employees)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-employees)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillApplicants" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-applicants)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-applicants)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              fill="url(#fillTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="employees"
              stroke="var(--color-employees)"
              fill="url(#fillEmployees)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="applicants"
              stroke="var(--color-applicants)"
              fill="url(#fillApplicants)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">
              {data.summary.total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-xl font-bold">
              {Math.round(data.summary.average).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peak</p>
            <p className="text-xl font-bold">
              {data.summary.peak.value.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for chart
 */
export function UserGrowthChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-[120px]" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px] w-full" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-1 h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
