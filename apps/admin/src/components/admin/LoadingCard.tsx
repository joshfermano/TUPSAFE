import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted-foreground) / 0.1) 20%,
    hsl(var(--muted)) 40%,
    hsl(var(--muted))
  );
  background-size: 1000px 100%;
}
`;

// Inject shimmer animation styles
if (typeof document !== 'undefined') {
  const styleId = 'loading-card-shimmer-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerKeyframes;
    document.head.appendChild(style);
  }
}

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
            'border-border/50 bg-gradient-to-br from-card to-card/80',
            className,
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <Skeleton className="h-4 w-24 shimmer" />
            <Skeleton className="h-8 w-8 rounded-lg shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-9 w-20 shimmer" />

              {showTrend && (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12 shimmer" />
                  <Skeleton className="h-3 w-16 shimmer" />
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
        'animate-pulse',
        className,
      )}
    >
      <LoadingCard count={count} showTrend={showTrend} />
    </div>
  );
});

LoadingCardGrid.displayName = 'LoadingCardGrid';
