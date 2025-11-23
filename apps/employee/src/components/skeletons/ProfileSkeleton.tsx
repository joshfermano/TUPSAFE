import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Profile Header */}
      <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-8 overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
            {/* Status indicator */}
            <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800 border-4 border-white dark:border-gray-950 animate-pulse" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 w-full">
            {/* Name */}
            <div className="h-8 w-64 max-w-full rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />

            {/* Details row */}
            <div className="flex flex-wrap gap-4">
              <div className="h-5 w-32 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-5 w-36 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
            </div>

            {/* Bio */}
            <div className="space-y-2 max-w-2xl">
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
            </div>
          </div>

          {/* Action button */}
          <div className="h-10 w-32 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {Array.from({ length: sectionIndex % 2 === 0 ? 4 : 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  {/* Label */}
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                  {/* Value */}
                  <div
                    className="h-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"
                    style={{ width: `${60 + (i * 10)}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Divider */}
            {sectionIndex < 3 && (
              <div className="h-px bg-gray-200 dark:bg-gray-800 mt-6" />
            )}
          </div>
        ))}
      </div>

      {/* Timeline/History Section */}
      <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

        {/* Header */}
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-6" />

        {/* Timeline items */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                {i < 2 && (
                  <div className="w-px h-16 bg-gray-200 dark:bg-gray-800 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2 pb-4">
                <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-900 animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
