'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { createClient } from '@tupsafe/auth';
import type { User, Session } from '@supabase/supabase-js';

/**
 * User profile with employee/applicant details
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  userType: 'employee' | 'applicant';
  role: string;
  employeeId?: string;
  applicantId?: string;
  departmentId?: string;
  positionId?: string;
  accountStatus: string;
  isActive: boolean;
  temporaryPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Create Supabase client with portal-aware cookie configuration
  // useMemo ensures client is created once and reused
  // SSR guards are in the cookie methods (getAll/setAll), not here
  const supabase = useMemo(() => createClient(), []);

  // Detect when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Fetch user profile from the server
   */
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      setProfileLoading(true);
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        console.warn('[AuthProvider] Profile fetch returned', response.status);
        return null;
      }
      const data = await response.json();
      return data.profile as UserProfile;
    } catch (error) {
      console.error('[AuthProvider] Error fetching profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /**
   * Refresh profile - can be called externally to force a profile refresh
   */
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      console.warn('[AuthProvider] Cannot refresh profile: no user');
      return;
    }
    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
      console.log('[AuthProvider] ✅ Profile refreshed:', userProfile.userType);
    } else {
      console.warn('[AuthProvider] ⚠️ Profile refresh returned null');
    }
  }, [user?.id, fetchProfile]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthProvider] Error refreshing session:', error);
        setUser(null);
        setSession(null);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
    } catch (error) {
      console.error('[AuthProvider] Error in refreshSession:', error);
      setUser(null);
      setSession(null);
    }
  }, [supabase]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Call logout API to clean up server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all auth state
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileLoading(false);

      // Redirect to login
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error);
    }
  }, [supabase]);

  // Initialize session on mount (client-side only)
  useEffect(() => {
    // Skip if not mounted yet
    if (!mounted) {
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing auth...');

        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error);
        }

        console.log('[AuthProvider] Initial session:', initialSession ? 'Found' : 'Not found');

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch user profile if session exists
        if (initialSession?.user) {
          console.log('[AuthProvider] Fetching user profile...');
          const userProfile = await fetchProfile(initialSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
            console.log('[AuthProvider] ✅ Profile loaded:', userProfile.userType);
          } else {
            console.warn('[AuthProvider] ⚠️ Profile not found');
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error);
      } finally {
        console.log('[AuthProvider] ✅ Initialization complete, setting loading = false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [mounted, supabase.auth, fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    if (!mounted) {
      return;
    }

    console.log('[AuthProvider] Setting up auth state listener');

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthProvider] Auth state changed:', event, newSession ? 'Session exists' : 'No session');
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // CRITICAL: Fetch/clear profile based on auth state
      if (newSession?.user) {
        // User logged in or session refreshed - fetch profile
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('[AuthProvider] Fetching profile after auth event:', event);
          const userProfile = await fetchProfile(newSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
            console.log('[AuthProvider] ✅ Profile set after', event, ':', userProfile.userType);
          } else {
            console.warn('[AuthProvider] ⚠️ Profile fetch returned null after', event);
            setProfile(null);
          }
        }
      } else {
        // User logged out or session cleared - clear profile
        console.log('[AuthProvider] Clearing profile (no session)');
        setProfile(null);
        setProfileLoading(false);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [mounted, supabase.auth, fetchProfile]);

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshSession,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
