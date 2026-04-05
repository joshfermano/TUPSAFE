'use client';

/**
 * Certification Wallet Hooks
 *
 * React Query hooks for managing employee profile certifications including
 * CRUD operations, file uploads, and optimistic cache updates.
 *
 * @module hooks/useCertifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ProfileCertificationData,
  CertificationFileData,
  CreateCertificationRequest,
  UpdateCertificationRequest,
} from '@tupsafe/types';

// ============================================================================
// Query Key Factory
// ============================================================================

export const certificationsKeys = {
  all: ['certifications'] as const,
  list: () => [...certificationsKeys.all, 'list'] as const,
  detail: (id: string) => [...certificationsKeys.all, 'detail', id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all certifications for the authenticated user
 */
async function fetchCertifications(): Promise<ProfileCertificationData[]> {
  const response = await fetch('/api/certifications', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to fetch certifications');
  }

  const data = await response.json();
  return data.certifications;
}

/**
 * Create a new certification record
 */
async function createCertification(
  body: CreateCertificationRequest
): Promise<ProfileCertificationData> {
  const response = await fetch('/api/certifications', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to create certification');
  }

  const data = await response.json();
  return data.certification;
}

/**
 * Update an existing certification record
 */
async function updateCertification({
  id,
  body,
}: {
  id: string;
  body: UpdateCertificationRequest;
}): Promise<ProfileCertificationData> {
  const response = await fetch(`/api/certifications/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to update certification');
  }

  const data = await response.json();
  return data.certification;
}

/**
 * Delete a certification record
 */
async function deleteCertification(id: string): Promise<void> {
  const response = await fetch(`/api/certifications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to delete certification');
  }
}

/**
 * Upload a file attachment to a certification
 */
async function uploadCertificationFile({
  certificationId,
  file,
}: {
  certificationId: string;
  file: File;
}): Promise<CertificationFileData> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/certifications/${certificationId}/files`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to upload file');
  }

  const data = await response.json();
  return data.file;
}

/**
 * Delete a file attachment from a certification
 */
async function deleteCertificationFile({
  certificationId,
  fileId,
}: {
  certificationId: string;
  fileId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/certifications/${certificationId}/files/${fileId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to delete file');
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all certifications for the authenticated user
 *
 * Returns the complete list of certifications with file attachments.
 * Cached for 5 minutes with a 10-minute garbage collection window.
 *
 * @returns Query result with certifications array
 *
 * @example
 * ```tsx
 * const { data: certifications, isLoading } = useCertifications();
 * ```
 */
export function useCertifications() {
  return useQuery({
    queryKey: certificationsKeys.list(),
    queryFn: fetchCertifications,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to create a new certification
 *
 * Invalidates the certifications list cache on success so the UI
 * reflects the newly added record immediately.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const createMutation = useCreateCertification();
 * createMutation.mutate({
 *   title: 'AWS Solutions Architect',
 *   dateFrom: '2024-01-15',
 *   dateTo: '2024-01-15',
 *   hours: 40,
 *   conductedBy: 'Amazon Web Services',
 * });
 * ```
 */
export function useCreateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationsKeys.all });

      toast.success('Certification added', {
        description: 'Your certification has been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to add certification', {
        description: error.message || 'An error occurred while saving your certification.',
      });
    },
  });
}

/**
 * Hook to update an existing certification
 *
 * Invalidates both the list and the specific detail cache on success.
 * Resets the verification status server-side when content is modified.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateCertification();
 * updateMutation.mutate({
 *   id: certificationId,
 *   body: { title: 'Updated Title', hours: 24 },
 * });
 * ```
 */
export function useUpdateCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCertification,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: certificationsKeys.all });
      queryClient.invalidateQueries({
        queryKey: certificationsKeys.detail(variables.id),
      });

      toast.success('Certification updated', {
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update certification', {
        description: error.message || 'An error occurred while updating your certification.',
      });
    },
  });
}

/**
 * Hook to delete a certification with optimistic cache removal
 *
 * Immediately removes the certification from the local cache for
 * instant UI feedback. Rolls back on error and shows a toast notification.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteCertification();
 * deleteMutation.mutate(certificationId);
 * ```
 */
export function useDeleteCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCertification,
    onMutate: async (id) => {
      // Cancel any in-flight refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: certificationsKeys.list() });

      // Snapshot the current cache for rollback
      const previous = queryClient.getQueryData<ProfileCertificationData[]>(
        certificationsKeys.list()
      );

      // Optimistically remove the certification from the list
      queryClient.setQueryData<ProfileCertificationData[]>(
        certificationsKeys.list(),
        (old) => old?.filter((c) => c.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _id, context) => {
      // Rollback to the previous cache state
      if (context?.previous) {
        queryClient.setQueryData(certificationsKeys.list(), context.previous);
      }

      toast.error('Failed to delete certification', {
        description: error.message || 'An error occurred while deleting your certification.',
      });
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure server state consistency
      queryClient.invalidateQueries({ queryKey: certificationsKeys.all });
    },
    onSuccess: () => {
      toast.success('Certification deleted', {
        description: 'The certification has been removed.',
      });
    },
  });
}

/**
 * Hook to upload a file attachment to a certification
 *
 * Accepts a File object and the parent certification ID.
 * Invalidates the certifications cache so the file list updates.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadCertificationFile();
 * uploadMutation.mutate({
 *   certificationId: cert.id,
 *   file: selectedFile,
 * });
 * ```
 */
export function useUploadCertificationFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadCertificationFile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: certificationsKeys.all });
      queryClient.invalidateQueries({
        queryKey: certificationsKeys.detail(variables.certificationId),
      });

      toast.success('File uploaded', {
        description: 'Your file has been attached to the certification.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to upload file', {
        description: error.message || 'An error occurred while uploading your file.',
      });
    },
  });
}

/**
 * Hook to delete a file attachment from a certification
 *
 * Removes the specified file from the certification record.
 * Invalidates the certifications cache to reflect the removal.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const deleteFileMutation = useDeleteCertificationFile();
 * deleteFileMutation.mutate({
 *   certificationId: cert.id,
 *   fileId: file.id,
 * });
 * ```
 */
export function useDeleteCertificationFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCertificationFile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: certificationsKeys.all });
      queryClient.invalidateQueries({
        queryKey: certificationsKeys.detail(variables.certificationId),
      });

      toast.success('File removed', {
        description: 'The file has been removed from the certification.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to remove file', {
        description: error.message || 'An error occurred while removing the file.',
      });
    },
  });
}
