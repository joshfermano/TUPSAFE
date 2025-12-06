'use client';

import { useState, useEffect, useCallback } from 'react';
import { MockDatabase, type PdsSubmission } from '../../data';
import type { CompletePdsData } from '@tupsafe/database';
import { storage } from '../../utils/storage';

export interface UsePdsReturn {
  submissions: PdsSubmission[];
  latest: PdsSubmission | null;
  loading: boolean;
  error: string | null;
  getCompleteSubmission: (id: string) => CompletePdsData | null;
  createDraft: () => Promise<PdsSubmission>;
  updateSubmission: (
    id: string,
    data: Partial<CompletePdsData>
  ) => Promise<boolean>;
  submitForReview: (id: string) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Mock PDS submissions hook
 * Manages PDS (Personal Data Sheet) submissions with CRUD operations
 */
export function usePds(userId: string): UsePdsReturn {
  const [submissions, setSubmissions] = useState<PdsSubmission[]>([]);
  const [latest, setLatest] = useState<PdsSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      setTimeout(() => {
        let userSubmissions = MockDatabase.getPdsByUser(userId);

        // DEVELOPMENT FALLBACK: If no submissions found for this user,
        // return the first mock user's data to ensure developers see data
        if (userSubmissions.length === 0 && userId) {
          console.info(
            `[Mock Data] No PDS submissions found for user ${userId}. Returning first mock user's data for development.`
          );
          // Get the first mock user's submissions as fallback
          const firstMockUserId = '01927d4e-8b45-7f52-b123-456789abcdef';
          userSubmissions = MockDatabase.getPdsByUser(firstMockUserId);
        }

        setSubmissions(userSubmissions);

        const latestSubmission =
          userSubmissions
            .filter((pds) => pds.isLatest)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] || null;

        setLatest(latestSubmission);
        setLoading(false);
      }, 300);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch PDS submissions'
      );
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchSubmissions();
    }
  }, [userId, fetchSubmissions]);

  const getCompleteSubmission = useCallback(
    (id: string): CompletePdsData | null => {
      const result = MockDatabase.getCompletePds(id);
      return result as CompletePdsData | null;
    },
    []
  );

  const createDraft = useCallback(async (): Promise<PdsSubmission> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newSubmission: PdsSubmission = {
      id: `pds-${Date.now()}`,
      userId,
      year: new Date().getFullYear(), // Default to current year
      version: 1,
      status: 'draft',
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      reviewNotes: null,
      pdfFilePath: null,
      isLatest: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in localStorage
    const key = `pds_draft_${newSubmission.id}`;
    storage.set(key, newSubmission);

    fetchSubmissions();
    return newSubmission;
  }, [userId, fetchSubmissions]);

  const updateSubmission = useCallback(
    async (id: string, data: Partial<CompletePdsData>): Promise<boolean> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const key = `pds_draft_${id}`;
      const existing = storage.get<Partial<CompletePdsData>>(key) || {};
      storage.set(key, { ...existing, ...data });

      fetchSubmissions();
      return true;
    },
    [fetchSubmissions]
  );

  const submitForReview = useCallback(
    async (id: string): Promise<boolean> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const submission = submissions.find((s) => s.id === id);
      if (!submission) return false;

      const updated = {
        ...submission,
        status: 'submitted' as const,
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      const key = `pds_draft_${id}`;
      storage.set(key, updated);

      fetchSubmissions();
      return true;
    },
    [submissions, fetchSubmissions]
  );

  return {
    submissions,
    latest,
    loading,
    error,
    getCompleteSubmission,
    createDraft,
    updateSubmission,
    submitForReview,
    refetch: fetchSubmissions,
  };
}
