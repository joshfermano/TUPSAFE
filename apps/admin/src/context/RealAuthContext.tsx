'use client';

/**
 * Real Authentication Context for Admin Portal
 *
 * This replaces the mock authentication system with real Supabase Auth integration.
 * Provides session management, user profile data, and admin-specific authentication methods.
 *
 * Security Features:
 * - Supabase authentication integration
 * - Admin role verification
 * - Device fingerprinting and trust management
 * - OTP verification flow for untrusted devices
 * - Automatic session refresh
 * - Audit logging
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@tupsafe/auth/client';

/**
 * User interface matching Supabase Auth structure
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Admin user profile with department and position details
 */
export interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: 'admin' | 'co_admin' | 'super_admin' | 'hr';
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
  accountStatus: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OTP verification state
 */
export interface OTPVerificationState {
  required: boolean;
  userId?: string;
  deviceFingerprint?: string;
}

/**
 * AuthContext interface
 */
interface AuthContextType {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    requiresOTP?: boolean;
    otpState?: OTPVerificationState;
    error?: string;
  }>;
  verifyOTP: (code: string, otpState: OTPVerificationState) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Manages authentication state and provides auth methods
 */
export function RealAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Fetch user profile from the server
   */
  const fetchProfile = useCallback(async (userId: string): Promise<AdminProfile | null> => {
    try {
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        // Don't throw error - user might not be fully authenticated yet
        console.warn('Profile fetch returned', response.status, '- user may need to login');
        return null;
      }
      const data = await response.json();
      return data.profile as AdminProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  /**
   * Initialize auth state from Supabase session
   * Runs once on mount to restore session
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setLoading(false);
          return;
        }

        const currentUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
        };

        setUser(currentUser);

        // Fetch profile
        const userProfile = await fetchProfile(session.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session) {
          const currentUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          };
          setUser(currentUser);

          // Fetch profile
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Auto-refresh session every 5 minutes
   * Prevents unexpected session expiration during active use
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          // Session is still valid, refresh it
          const { data: { session: newSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError && newSession) {
            console.log('[RealAuthContext] Session refreshed successfully');
          }
        }
      } catch (error) {
        console.error('[RealAuthContext] Session refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  /**
   * Sign in with email and password
   * Handles device trust and OTP challenges
   */
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    requiresOTP?: boolean;
    otpState?: OTPVerificationState;
    error?: string;
  }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Login failed',
        };
      }

      // Check if OTP is required
      if (data.requiresOTP) {
        return {
          success: false,
          requiresOTP: true,
          otpState: {
            required: true,
            userId: data.data.userId,
            deviceFingerprint: data.data.deviceFingerprint,
          },
        };
      }

      // Login successful - establish Supabase session in the browser
      if (data.session) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          console.error('Error setting session:', sessionError);
          return {
            success: false,
            error: 'Failed to establish session',
          };
        }

        // Session is now established, auth state listener will update the user state
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login',
      };
    }
  }, []);

  /**
   * Verify OTP for device trust
   */
  const verifyOTP = useCallback(async (
    code: string,
    otpState: OTPVerificationState
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      if (!otpState.userId || !otpState.deviceFingerprint) {
        return {
          success: false,
          error: 'Invalid OTP state',
        };
      }

      const response = await fetch('/api/auth/verify-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: otpState.userId,
          code,
          deviceFingerprint: otpState.deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Verification failed',
        };
      }

      // Verification successful - user state will be updated by auth state listener
      return { success: true };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during verification',
      };
    }
  }, []);

  /**
   * Sign out and clear session
   * Calls logout API and redirects to login
   */
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      setProfile(null);

      // Redirect to login
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect to login even if API call fails
      setUser(null);
      setProfile(null);
      router.push('/auth/login');
    }
  }, [router]);

  /**
   * Refresh user profile
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  const isAuthenticated = !!user && !!profile;

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    verifyOTP,
    signOut,
    isAuthenticated,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Access auth context in components
 *
 * @throws Error if used outside AuthProvider
 */
export function useRealAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useRealAuth must be used within a RealAuthProvider');
  }
  return context;
}

/**
 * Export for testing and migration
 */
export { AuthContext };
export default AuthContext;
