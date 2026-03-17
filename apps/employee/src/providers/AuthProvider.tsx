'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
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
  avatarPath?: string | null;
  avatarUrl?: string | null;
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

  // Debounce profile fetches to prevent rapid refetches on tab switch
  const lastProfileFetchRef = useRef<number>(0);
  const PROFILE_FETCH_DEBOUNCE_MS = 30000; // 30 seconds - prevent refetch during typical tab switching

  // Track if initial profile has been loaded (to avoid loading flash on refetch)
  const initialProfileLoadedRef = useRef(false);

  // Stable reference to supabase.auth to prevent effect re-runs
  const supabaseAuthRef = useRef(supabase.auth);

  // Detect when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Fetch user profile from the server
   * @param isInitialLoad - Only show loading state on initial load, not refetches
   */
  const fetchProfile = useCallback(async (userId: string, isInitialLoad = false): Promise<UserProfile | null> => {
    try {
      // Only show loading indicator on initial load to prevent flash on refetch
      if (isInitialLoad && !initialProfileLoadedRef.current) {
        setProfileLoading(true);
      }
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        console.warn('[AuthProvider] Profile fetch returned', response.status);
        return null;
      }
      const json = await response.json();
      initialProfileLoadedRef.current = true;
      // API returns { success: true, data: { ...profile } } via apiSuccess()
      const profileData = json.data ?? json.profile;
      if (!profileData) {
        console.warn('[AuthProvider] No profile data in response:', Object.keys(json));
        return null;
      }
      return profileData as UserProfile;
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
        } = await supabaseAuthRef.current.getSession();

        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error);
        }

        console.log('[AuthProvider] Initial session:', initialSession ? 'Found' : 'Not found');

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch user profile if session exists
        if (initialSession?.user) {
          console.log('[AuthProvider] Fetching user profile...');
          lastProfileFetchRef.current = Date.now(); // Mark initial fetch time
          const userProfile = await fetchProfile(initialSession.user.id, true);
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
  }, [mounted, fetchProfile]); // Removed supabase.auth - using ref instead

  // Listen for auth state changes
  useEffect(() => {
    if (!mounted) {
      return;
    }

    console.log('[AuthProvider] Setting up auth state listener');

    const {
      data: { subscription },
    } = supabaseAuthRef.current.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthProvider] Auth state changed:', event, newSession ? 'Session exists' : 'No session');

      // Always update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // CRITICAL: Only fetch profile on actual sign-in events, NOT token refresh
      // TOKEN_REFRESHED fires on tab switch which causes the "restart" effect
      if (newSession?.user) {
        // Only fetch profile on genuine auth events, not token refresh
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Still apply debounce for rapid sign-in attempts
          const now = Date.now();
          if (now - lastProfileFetchRef.current < PROFILE_FETCH_DEBOUNCE_MS) {
            console.log('[AuthProvider] Skipping profile fetch - debounced (too recent)');
            // Don't return early - still need to set loading to false
          } else {
            lastProfileFetchRef.current = now;

            console.log('[AuthProvider] Fetching profile after auth event:', event);
            const userProfile = await fetchProfile(newSession.user.id, event === 'SIGNED_IN');
            if (userProfile) {
              setProfile(userProfile);
              console.log('[AuthProvider] ✅ Profile set after', event, ':', userProfile.userType);
            } else {
              console.warn('[AuthProvider] ⚠️ Profile fetch returned null after', event);
              // Don't clear profile on fetch failure - keep existing profile
            }
          }
        }
        // For TOKEN_REFRESHED: just update session, don't refetch profile
        // This prevents the "app restart" effect on tab switch
      } else {
        // User logged out or session cleared - clear profile
        console.log('[AuthProvider] Clearing profile (no session)');
        setProfile(null);
        setProfileLoading(false);
        initialProfileLoadedRef.current = false;
      }

      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [mounted, fetchProfile]); // Removed supabase.auth - using ref instead

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
