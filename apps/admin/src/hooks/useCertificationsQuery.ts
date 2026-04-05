'use client';

/**
 * Admin Certifications React Query Hook
 *
 * Provides data fetching and mutation hooks for managing
 * employee certifications from the admin portal.
 *
 * - useUserCertifications: Fetch certifications for a specific user
 * - useVerifyCertification: Verify or reject a certification
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProfileCertificationData,
  VerifyCertificationRequest,
} from '@tupsafe/types';

export const certificationKeys = {
  all: ['admin-certifications'] as const,
  user: (userId: string) => [...certificationKeys.all, userId] as const,
};

/**
 * Fetch all certifications for a specific user.
 * Used in the admin user view page to display certification records.
 */
export function useUserCertifications(userId: string) {
  return useQuery<ProfileCertificationData[]>({
    queryKey: certificationKeys.user(userId),
    queryFn: async () => {
      const res = await fetch(`/api/certifications?userId=${userId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error || 'Failed to fetch certifications'
        );
      }
      const data = await res.json();
      return data.certifications;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Verify or reject a certification.
 * Invalidates the certifications query cache on success.
 */
export function useVerifyCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: VerifyCertificationRequest;
    }) => {
      const res = await fetch(`/api/certifications/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error || 'Failed to verify certification'
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
    },
  });
}
