import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Profile data structure from API
 */
interface ProfileData {
  id: string;
  email: string;
  userType: 'employee' | 'applicant';
  employmentCategory: string | null;
  applicantId: string | null;
  employeeId: string | null;
  hireDate: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phoneNumber: string | null;
  role: string;
  academicRank: string | null;
  tenureStatus: string | null;
  employmentType: string | null;
  campusAssignment: string | null;
  accountStatus: string;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenureYears: number | null;
  department: {
    id: string;
    name: string;
    code: string;
    officeType: string;
  } | null;
  college: {
    id: string;
    name: string;
    code: string;
    officeType: string;
  } | null;
  position: {
    id: string;
    title: string;
    gradeLevel: number;
  } | null;
  submissions: {
    pds: {
      total: number;
      latest: {
        id: string;
        status: string;
        submittedAt: string;
        version: number;
      } | null;
    };
    saln: {
      total: number;
      latest: {
        id: string;
        status: string;
        submittedAt: string;
        year: number;
      } | null;
    };
  };
}

interface ProfileResponse {
  success: boolean;
  profile: ProfileData;
}

interface ProfileUpdateData {
  phoneNumber?: string | null;
  middleName?: string | null;
  departmentId?: string | null;
}

interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  profile: {
    id: string;
    phoneNumber: string | null;
    middleName: string | null;
    departmentId: string | null;
    updatedAt: string;
  };
}

/**
 * Fetch user profile from API
 */
async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch('/api/profile', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch profile');
  }

  const data: ProfileResponse = await response.json();
  return data.profile;
}

/**
 * Update user profile
 */
async function updateProfile(updates: ProfileUpdateData): Promise<ProfileUpdateResponse> {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

/**
 * Hook to fetch user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<ProfileData>(['profile']);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<ProfileData>(['profile'], {
          ...previousProfile,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }

      // Return context with the previous value
      return { previousProfile };
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }

      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Profile updated successfully', {
        description: 'Your profile information has been updated.',
      });
    },
  });
}

/**
 * Export types for use in components
 */
export type { ProfileData, ProfileUpdateData };
