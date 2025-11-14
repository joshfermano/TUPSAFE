/**
 * Compliance by Department Chart
 *
 * Horizontal bar chart showing compliance rates by department
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDepartmentAnalytics } from '@/hooks/useDashboard';
import { Building2 } from 'lucide-react';

/**
 * Get color based on compliance rate
 */
function getComplianceColor(rate: number): string {
  if (rate >= 90) return 'hsl(142, 76%, 36%)'; // Green
  if (rate >= 70) return 'hsl(38, 92%, 50%)'; // Yellow
  return 'hsl(0, 84%, 60%)'; // Red
}

/**
 * Get badge variant based on compliance rate
 */
function getComplianceBadgeVariant(rate: number): 'default' | 'secondary' | 'destructive' {
  if (rate >= 90) return 'default';
  if (rate >= 70) return 'secondary';
  return 'destructive';
}

export function ComplianceByDeptChart() {
  const { data, isLoading, isError } = useDepartmentAnalytics();

  if (isLoading) {
    return <ComplianceByDeptChartSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance by Department</CardTitle>
          <CardDescription>Failed to load department data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Unable to load department compliance data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average compliance rate for each department
  const chartData = data.departments
    .map(( dept: any) => ({
      name: dept.code || dept.name.substring(0, 20),
      fullName: dept.name,
      compliance: Math.round((dept.submissions.pdsCompliance + dept.submissions.salnCompliance) / 2),
      pds: dept.submissions.pdsCompliance,
      saln: dept.submissions.salnCompliance,
    }))
    .sort((a: any, b: any) => b.compliance - a.compliance)
    .slice(0, 10); // Top 10 departments

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-medium">{data.fullName}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Overall:</span>
            <span className="font-medium">{data.compliance}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">PDS:</span>
            <span className="font-medium">{Math.round(data.pds)}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">SALN:</span>
            <span className="font-medium">{Math.round(data.saln)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom label showing percentage on bars
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text
        x={x + width + 5}
        y={y + height / 2}
        fill="hsl(var(--foreground))"
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={500}>
        {value}%
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compliance by Department</CardTitle>
            <CardDescription>
              Top {chartData.length} departments by overall compliance rate
            </CardDescription>
          </div>
          <Badge variant="outline">
            Avg: {Math.round(data.summary.averageCompliance)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No department data available</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
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
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="compliance" radius={[0, 4, 4, 0]} label={<CustomLabel />}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getComplianceColor(entry.compliance)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Best and Worst Performers */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                  Best Performing
                </p>
                <p className="text-sm font-medium">{data.summary.bestPerforming.name}</p>
                <Badge variant="default" className="mt-1">
                  {Math.round(data.summary.bestPerforming.compliance)}%
                </Badge>
              </div>
              {data.summary.needsAttention.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                    Needs Attention
                  </p>
                  <div className="space-y-1">
                    {data.summary.needsAttention.slice(0, 2).map((dept: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <p className="text-sm">{dept.name}</p>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(dept.compliance)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for chart
 */
export function ComplianceByDeptChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
