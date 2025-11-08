import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom hook for animating number counting
 * @param end - The target number to count to
 * @param duration - Duration of the animation in milliseconds (default: 1000ms)
 */
function useCountAnimation(end: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (shouldReduceMotion) {
      setCount(end);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const updateCount = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (easeOutExpo)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutExpo);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [end, duration, shouldReduceMotion]);

  return count;
}

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
  const shouldReduceMotion = useReducedMotion();
  const numericValue = typeof value === 'number' ? value : 0;
  const animatedValue = useCountAnimation(numericValue, 1000);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' as const }}
    >
      <Card
        className={cn(
          'transition-all duration-200',
          'border-subtle',
          'gradient-card-subtle',
          'hover:shadow-2xl hover:-translate-y-0.5 hover:border-primary-subtle',
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
              {typeof value === 'number'
                ? animatedValue.toLocaleString()
                : value}
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
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';
