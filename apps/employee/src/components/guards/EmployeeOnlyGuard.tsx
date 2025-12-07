'use client';

/**
 * Employee-Only Route Guard
 *
 * Protects routes that should only be accessible to employees (not applicants).
 * Use this for SALN pages and other employee-specific functionality.
 *
 * Usage:
 * ```tsx
 * export default function SALNPage() {
 *   return (
 *     <EmployeeOnlyGuard>
 *       <SALNContent />
 *     </EmployeeOnlyGuard>
 *   );
 * }
 * ```
 */

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../../providers/AuthProvider';
import { Loader2 } from 'lucide-react';

interface EmployeeOnlyGuardProps {
  children: ReactNode;
  /** Custom redirect path (default: /dashboard) */
  redirectTo?: string;
  /** Custom error message */
  errorMessage?: string;
}

export function EmployeeOnlyGuard({
  children,
  redirectTo = '/dashboard',
  errorMessage = 'This feature is only available to employees.',
}: EmployeeOnlyGuardProps) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for profile to load
    if (loading) return;

    // Check if user is applicant
    if (profile && profile.userType === 'applicant') {
      toast.error('Access Denied', {
        description: errorMessage,
        duration: 5000,
      });
      router.replace(redirectTo);
    }
  }, [profile, loading, router, redirectTo, errorMessage]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  // Don't render if user is applicant
  if (!profile || profile.userType === 'applicant') {
    return null;
  }

  // User is employee, render children
  return <>{children}</>;
}
