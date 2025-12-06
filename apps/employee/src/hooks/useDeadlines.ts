'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Urgency level for deadline display
 * - critical: < 7 days remaining (red, pulsing)
 * - warning: 7-30 days remaining (amber)
 * - normal: > 30 days remaining (blue/green)
 */
export type UrgencyLevel = 'critical' | 'warning' | 'normal';

/**
 * Deadline item returned from API with computed fields
 */
export interface Deadline {
  id: string;
  formType: 'pds' | 'saln';
  year: number;
  deadlineDate: string;
  reminderDaysBefore: number[];
  daysRemaining: number;
  urgencyLevel: UrgencyLevel;
  isOverdue: boolean;
}

/**
 * Summary statistics for deadlines
 */
export interface DeadlinesSummary {
  total: number;
  critical: number;
  warning: number;
  normal: number;
  overdue: number;
}

/**
 * API response structure
 */
interface DeadlinesResponse {
  success: boolean;
  deadlines: Deadline[];
  summary: DeadlinesSummary;
}

/**
 * Query key factory for deadlines
 */
export const deadlinesKeys = {
  all: ['deadlines'] as const,
  list: () => [...deadlinesKeys.all, 'list'] as const,
  byFormType: (formType: 'pds' | 'saln') =>
    [...deadlinesKeys.all, 'list', formType] as const,
};

/**
 * Fetch deadlines from API
 */
async function fetchDeadlines(formType?: 'pds' | 'saln'): Promise<DeadlinesResponse> {
  const url = formType
    ? `/api/deadlines?formType=${formType}`
    : '/api/deadlines';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to fetch deadlines: ${response.status}`);
  }

  return response.json();
}

/**
 * Compute urgency level client-side for real-time updates
 * This recalculates based on current time in case cached data is stale
 */
function computeUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'normal';
}

/**
 * Hook to fetch upcoming deadlines with urgency levels
 *
 * Features:
 * - Optional filtering by form type ('pds' | 'saln')
 * - 5-minute stale time for balanced freshness
 * - Auto-refetch on window focus
 * - Computed urgency levels:
 *   - critical: < 7 days remaining
 *   - warning: 7-30 days remaining
 *   - normal: > 30 days remaining
 *
 * @param formType - Optional filter: 'pds' or 'saln'
 * @returns Query result with deadlines and helper functions
 *
 * @example
 * ```tsx
 * // Get all deadlines
 * const { deadlines, isLoading } = useUpcomingDeadlines();
 *
 * // Get only PDS deadlines
 * const { deadlines: pdsDeadlines } = useUpcomingDeadlines('pds');
 *
 * // Get only SALN deadlines
 * const { deadlines: salnDeadlines } = useUpcomingDeadlines('saln');
 *
 * // Check for critical deadlines
 * const { getCriticalDeadlines } = useUpcomingDeadlines();
 * const urgent = getCriticalDeadlines();
 * ```
 */
export function useUpcomingDeadlines(formType?: 'pds' | 'saln') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: formType ? deadlinesKeys.byFormType(formType) : deadlinesKeys.list(),
    queryFn: () => fetchDeadlines(formType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: true, // Auto-refetch when user returns to tab
    refetchInterval: false, // Don't auto-refetch on interval (deadlines don't change frequently)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  /**
   * Get deadlines with fresh urgency calculations
   * Recalculates urgency based on current time
   */
  const deadlines: Deadline[] = (query.data?.deadlines ?? []).map((deadline) => {
    // Recalculate days remaining based on current time for accuracy
    // IMPORTANT: Parse date in local timezone to avoid UTC offset issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse deadline date in local timezone (not UTC)
    // Database returns "2025-12-19" format
    const [year, month, day] = deadline.deadlineDate.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const currentDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Debug logging
    console.log(`[useUpcomingDeadlines] Calculating for ${deadline.formType}:`, {
      deadlineDate: deadline.deadlineDate,
      today: today.toISOString(),
      deadlineDateParsed: deadlineDate.toISOString(),
      diffTime,
      currentDaysRemaining,
      serverDaysRemaining: deadline.daysRemaining,
    });

    return {
      ...deadline,
      daysRemaining: currentDaysRemaining,
      urgencyLevel: computeUrgencyLevel(currentDaysRemaining),
      isOverdue: currentDaysRemaining < 0,
    };
  });

  /**
   * Get the single deadline for a specific form type
   * Returns the most upcoming deadline, or most recent overdue if none upcoming
   */
  const getDeadlineForForm = (type: 'pds' | 'saln'): Deadline | null => {
    // First try to get non-overdue deadlines (sorted by soonest)
    const upcoming = deadlines
      .filter((d) => d.formType === type && !d.isOverdue)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    if (upcoming.length > 0) return upcoming[0];

    // If no upcoming deadlines, return the most recent overdue one
    const overdue = deadlines
      .filter((d) => d.formType === type && d.isOverdue)
      .sort((a, b) => b.daysRemaining - a.daysRemaining); // Most recent overdue first

    return overdue[0] || null;
  };

  /**
   * Get all critical deadlines (< 7 days)
   */
  const getCriticalDeadlines = (): Deadline[] => {
    return deadlines.filter((d) => d.urgencyLevel === 'critical' && !d.isOverdue);
  };

  /**
   * Get all warning deadlines (7-30 days)
   */
  const getWarningDeadlines = (): Deadline[] => {
    return deadlines.filter((d) => d.urgencyLevel === 'warning');
  };

  /**
   * Get all overdue deadlines
   */
  const getOverdueDeadlines = (): Deadline[] => {
    return deadlines.filter((d) => d.isOverdue);
  };

  /**
   * Check if there are any urgent deadlines (critical or overdue)
   */
  const hasUrgentDeadlines = (): boolean => {
    return deadlines.some((d) => d.urgencyLevel === 'critical' || d.isOverdue);
  };

  /**
   * Invalidate and refetch deadlines
   */
  const invalidateDeadlines = () => {
    queryClient.invalidateQueries({ queryKey: deadlinesKeys.all });
  };

  return {
    // Query state
    ...query,
    // Data
    deadlines,
    summary: query.data?.summary ?? null,
    // Helper functions
    getDeadlineForForm,
    getCriticalDeadlines,
    getWarningDeadlines,
    getOverdueDeadlines,
    hasUrgentDeadlines,
    invalidateDeadlines,
  };
}

/**
 * Hook to get a single deadline for a specific form type
 * Convenience wrapper around useUpcomingDeadlines
 *
 * @param formType - 'pds' or 'saln'
 * @returns The most upcoming deadline for that form type
 *
 * @example
 * ```tsx
 * const { deadline, isLoading, urgencyLevel } = useDeadlineForForm('pds');
 *
 * if (deadline) {
 *   console.log(`PDS due in ${deadline.daysRemaining} days`);
 * }
 * ```
 */
export function useDeadlineForForm(formType: 'pds' | 'saln') {
  const { deadlines, isLoading, isError, error, getDeadlineForForm } =
    useUpcomingDeadlines(formType);

  const deadline = getDeadlineForForm(formType);

  return {
    deadline,
    deadlines,
    isLoading,
    isError,
    error,
    // Convenience accessors
    daysRemaining: deadline?.daysRemaining ?? null,
    urgencyLevel: deadline?.urgencyLevel ?? null,
    isOverdue: deadline?.isOverdue ?? false,
    deadlineDate: deadline?.deadlineDate ?? null,
  };
}

/**
 * Hook to invalidate deadline cache
 * Use this after deadline changes (e.g., form submission)
 */
export function useInvalidateDeadlines() {
  const queryClient = useQueryClient();

  return (formType?: 'pds' | 'saln') => {
    if (formType) {
      queryClient.invalidateQueries({ queryKey: deadlinesKeys.byFormType(formType) });
    } else {
      queryClient.invalidateQueries({ queryKey: deadlinesKeys.all });
    }
  };
}
