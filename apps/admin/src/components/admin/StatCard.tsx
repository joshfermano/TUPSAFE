import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendData {
  /** Trend direction */
  direction: 'up' | 'down';
  /** Trend percentage value */
  percentage: number;
  /** Whether the trend is positive (green) or negative (red) */
  isPositive?: boolean;
}

interface StatCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Optional trend data */
  trend?: TrendData;
  /** Optional description text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatCard Component
 *
 * Professional dashboard statistics card with icon, value, and optional trend indicator.
 * Features subtle gradient hover effect and clean minimalistic design.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Submissions"
 *   value={1234}
 *   icon={FileText}
 *   trend={{ direction: 'up', percentage: 12.5, isPositive: true }}
 *   description="This month"
 * />
 * ```
 */
export const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
        'border-border/50 hover:border-tup-primary/20',
        'bg-gradient-to-br from-card to-card/80',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 rounded-lg bg-tup-primary/10">
          <Icon className="h-4 w-4 text-tup-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {(trend || description) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1 font-medium',
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {trend.direction === 'up' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span>{trend.percentage}%</span>
                </div>
              )}

              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
