/**
 * FormStepSkeleton Component
 *
 * Minimal, premium skeleton loader for multi-step form components.
 * Used as Suspense fallback during lazy loading of PDS and SALN step components.
 *
 * Features:
 * - Premium shimmer animation
 * - Matches typical form step layout
 * - Prevents layout shift (CLS optimization)
 * - Accessible loading state
 * - TUP Manila theme-aware
 *
 * @example
 * ```tsx
 * <Suspense fallback={<FormStepSkeleton />}>
 *   <PersonalBasic />
 * </Suspense>
 * ```
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface FormStepSkeletonProps {
  /** Number of form fields to show skeleton for (default: 6) */
  fieldCount?: number;
  /** Optional className for customization */
  className?: string;
}

/**
 * FormStepSkeleton Component
 *
 * Displays a skeleton loader that matches the typical structure of form step components.
 * Optimized to prevent Cumulative Layout Shift during lazy loading.
 */
export function FormStepSkeleton({ fieldCount = 6, className }: FormStepSkeletonProps) {
  return (
    <div
      className={cn('space-y-8 animate-in fade-in-50 duration-300', className)}
      role="status"
      aria-label="Loading form step"
    >
      {/* Section Header Skeleton */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Skeleton className="h-8 w-3/4 max-w-md" /> {/* Title */}
        <Skeleton className="h-4 w-full max-w-2xl" /> {/* Description */}
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            {/* Label */}
            <Skeleton className="h-4 w-32" />

            {/* Input field - varies between single and dual columns */}
            {index % 3 === 0 ? (
              // Full width field
              <Skeleton className="h-10 w-full" />
            ) : (
              // Two column layout
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {/* Optional helper text - only on some fields */}
            {index % 4 === 0 && <Skeleton className="h-3 w-48" />}
          </div>
        ))}
      </div>

      {/* Section Divider */}
      <div className="pt-4">
        <Skeleton className="h-px w-full" />
      </div>

      {/* Additional Info Section (appears on some steps) */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading form content...</span>
    </div>
  );
}

/**
 * Compact variant for smaller form steps
 */
export function FormStepSkeletonCompact({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6 animate-in fade-in-50 duration-300', className)}
      role="status"
      aria-label="Loading form step"
    >
      <div className="space-y-2 pb-4 border-b border-border">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-3 w-full max-w-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading form content...</span>
    </div>
  );
}
