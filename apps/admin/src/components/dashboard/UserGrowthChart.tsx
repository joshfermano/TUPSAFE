/**
 * User Growth Chart
 *
 * Area chart showing user growth over time with period selector
 */

'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardTrends } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import type { TrendsQueryParams } from '@tupsafe/types';

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
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Unable to load chart data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart (with breakdown if available)
  const chartData = data.data.map((point: any) => ({
    date: typeof point.date === 'string' ? point.date : format(new Date(point.date), 'MMM dd'),
    total: point.value,
    employees: point.breakdown?.employees || 0,
    applicants: point.breakdown?.applicants || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{payload[0].value.toLocaleString()}</span>
          </div>
          {payload.length > 1 && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Employees:</span>
                <span className="font-medium">{payload[1].value.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Applicants:</span>
                <span className="font-medium">{payload[2].value.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              {data.summary.trend === 'up' ? '↑' : data.summary.trend === 'down' ? '↓' : '→'}{' '}
              {Math.abs(data.summary.percentageChange).toFixed(1)}% vs previous period
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
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Users"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="employees"
              name="Employees"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEmployees)"
            />
            <Area
              type="monotone"
              dataKey="applicants"
              name="Applicants"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorApplicants)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{data.summary.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-xl font-bold">{Math.round(data.summary.average).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peak</p>
            <p className="text-xl font-bold">{data.summary.peak.value.toLocaleString()}</p>
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
        <Skeleton className="h-[300px] w-full" />
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
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
