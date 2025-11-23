import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingCardProps {
  /** Number of cards to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show trend skeleton */
  showTrend?: boolean;
}

/**
 * LoadingCard Component
 *
 * Loading skeleton that matches StatCard layout.
 * Provides visual feedback while data is being fetched.
 *
 * @example
 * ```tsx
 * <LoadingCard count={4} showTrend />
 * ```
 */
export const LoadingCard = memo(function LoadingCard({
  count = 1,
  className,
  showTrend = false,
}: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className={cn(
            'border-input bg-card',
            className,
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-9 w-20" />

              {showTrend && (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
});

LoadingCard.displayName = 'LoadingCard';

interface LoadingCardGridProps {
  /** Number of cards in the grid */
  count?: number;
  /** Whether to show trend skeleton */
  showTrend?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingCardGrid Component
 *
 * Grid container for loading cards with responsive layout.
 *
 * @example
 * ```tsx
 * <LoadingCardGrid count={4} showTrend />
 * ```
 */
export const LoadingCardGrid = memo(function LoadingCardGrid({
  count = 4,
  showTrend = false,
  className,
}: LoadingCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      <LoadingCard count={count} showTrend={showTrend} />
    </div>
  );
});

LoadingCardGrid.displayName = 'LoadingCardGrid';
