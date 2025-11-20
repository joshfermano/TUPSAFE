'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error refreshing session:', error);
        setUser(null);
        setSession(null);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
    } catch (error) {
      console.error('Error in refreshSession:', error);
      setUser(null);
      setSession(null);
    }
  }, [supabase.auth]);

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

      setUser(null);
      setSession(null);

      // Redirect to login
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase.auth]);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting initial session:', error);
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [supabase.auth]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

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
    loading,
    signOut,
    refreshSession,
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
