import React from 'react';

interface CardSkeletonProps {
  /**
   * Number of content rows to display
   * @default 3
   */
  rows?: number;
  /**
   * Whether to show an image/icon placeholder at the top
   * @default false
   */
  hasImage?: boolean;
  /**
   * Whether to show footer section
   * @default false
   */
  hasFooter?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Number of cards to render
   * @default 1
   */
  count?: number;
}

export function CardSkeleton({
  rows = 3,
  hasImage = false,
  hasFooter = false,
  className = '',
  count = 1,
}: CardSkeletonProps) {
  const cards = Array.from({ length: count });

  if (count === 1) {
    return <SingleCard rows={rows} hasImage={hasImage} hasFooter={hasFooter} className={className} />;
  }

  return (
    <>
      {cards.map((_, index) => (
        <SingleCard
          key={index}
          rows={rows}
          hasImage={hasImage}
          hasFooter={hasFooter}
          className={className}
        />
      ))}
    </>
  );
}

function SingleCard({
  rows,
  hasImage,
  hasFooter,
  className,
}: Omit<CardSkeletonProps, 'count'>) {
  return (
    <div
      className={`relative rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-6 overflow-hidden ${className}`}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

      {/* Image/Icon section */}
      {hasImage && (
        <div className="mb-4">
          <div className="h-40 w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3 mb-4">
        <div className="h-6 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
      </div>

      {/* Content rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows || 3 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-gray-100 dark:bg-gray-900 animate-pulse"
            style={{
              width: i === (rows || 3) - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>

      {/* Footer */}
      {hasFooter && (
        <>
          <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
            <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Grid variant for displaying multiple cards
 */
export function CardSkeletonGrid({
  count = 3,
  columns = 3,
  rows = 3,
  hasImage = false,
  hasFooter = false,
}: CardSkeletonProps & { columns?: number }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6`}>
      <CardSkeleton
        count={count}
        rows={rows}
        hasImage={hasImage}
        hasFooter={hasFooter}
      />
    </div>
  );
}

/**
 * List variant for card skeletons
 */
export function CardSkeletonList({
  count = 5,
  rows = 2,
  hasImage = false,
  hasFooter = false,
}: CardSkeletonProps) {
  return (
    <div className="space-y-4">
      <CardSkeleton
        count={count}
        rows={rows}
        hasImage={hasImage}
        hasFooter={hasFooter}
      />
    </div>
  );
}
