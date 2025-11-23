import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative h-32 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-6 overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

            {/* Icon placeholder */}
            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />

            {/* Value placeholder */}
            <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />

            {/* Label placeholder */}
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 overflow-hidden relative">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-8 w-24 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
          </div>

          {/* Activity items */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                </div>

                {/* Time */}
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 overflow-hidden relative">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

          {/* Header */}
          <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />

          {/* Action buttons */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-pulse border border-gray-200 dark:border-gray-800"
              />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-800 my-6" />

          {/* Additional info */}
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Submissions */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 overflow-hidden relative">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

        {/* Header */}
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-4 space-y-3"
            >
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="flex justify-between mt-auto pt-4">
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
