import React from 'react';

interface TableSkeletonProps {
  /**
   * Number of columns to display
   * @default 5
   */
  columns?: number;
  /**
   * Number of rows to display
   * @default 5
   */
  rows?: number;
  /**
   * Whether to show action buttons column
   * @default false
   */
  hasActions?: boolean;
  /**
   * Whether to show checkboxes column
   * @default false
   */
  hasCheckboxes?: boolean;
  /**
   * Whether to show pagination
   * @default true
   */
  hasPagination?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  hasActions = false,
  hasCheckboxes = false,
  hasPagination = true,
  className = '',
}: TableSkeletonProps) {
  const totalColumns = columns + (hasCheckboxes ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table container */}
      <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent pointer-events-none z-10" />

        {/* Table header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}>
            {/* Checkbox column header */}
            {hasCheckboxes && (
              <div className="flex items-center">
                <div className="h-4 w-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
              </div>
            )}

            {/* Regular column headers */}
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className="h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              </div>
            ))}

            {/* Actions column header */}
            {hasActions && (
              <div className="flex items-center justify-end">
                <div className="h-4 w-16 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Table body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
            >
              {/* Checkbox column */}
              {hasCheckboxes && (
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
              )}

              {/* Data columns */}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex items-center">
                  {colIndex === 0 ? (
                    // First column - could be name/title, make it prominent
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse flex-shrink-0" />
                      <div
                        className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"
                        style={{ width: `${70 + (rowIndex % 3) * 10}%` }}
                      />
                    </div>
                  ) : (
                    // Other columns - regular data
                    <div
                      className="h-4 rounded bg-gray-100 dark:bg-gray-900 animate-pulse"
                      style={{ width: `${50 + ((rowIndex + colIndex) % 4) * 15}%` }}
                    />
                  )}
                </div>
              ))}

              {/* Actions column */}
              {hasActions && (
                <div className="flex items-center justify-end gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {hasPagination && (
        <div className="flex items-center justify-between px-2">
          {/* Results text */}
          <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse"
                />
              ))}
            </div>
            <div className="h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple list skeleton for mobile/compact views
 */
export function ListSkeleton({
  rows = 5,
  className = '',
}: Pick<TableSkeletonProps, 'rows' | 'className'>) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

          <div className="flex items-start gap-3">
            {/* Icon/Avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
            </div>

            {/* Action */}
            <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Data table with filters skeleton
 */
export function DataTableSkeleton({
  columns = 5,
  rows = 8,
  hasActions = true,
}: Pick<TableSkeletonProps, 'columns' | 'rows' | 'hasActions'>) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="h-10 w-full sm:w-80 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 flex-1 sm:flex-none sm:w-32 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
          <div className="h-10 flex-1 sm:flex-none sm:w-32 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton
        columns={columns}
        rows={rows}
        hasActions={hasActions}
        hasCheckboxes
        hasPagination
      />
    </div>
  );
}
