'use client';

import { useState, useEffect, useCallback } from 'react';
import { MockAuth, type MockSession, type MockUser } from '../../data/auth';
import { storage } from '../../utils/storage';

export interface UseAuthReturn {
  user: MockUser | null;
  session: MockSession | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
}

const CURRENT_USER_KEY = 'current_user';
const CURRENT_SESSION_KEY = 'current_session';

/**
 * Mock authentication hook
 * Simulates authentication with localStorage persistence
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = storage.get<MockUser>(CURRENT_USER_KEY);
    const storedSession = storage.get<MockSession>(CURRENT_SESSION_KEY);

    if (storedUser && storedSession) {
      // Check if session is still valid
      if (new Date(storedSession.expiresAt) > new Date()) {
        setUser(storedUser);
        setSession(storedSession);
      } else {
        // Session expired, clear storage
        storage.remove(CURRENT_USER_KEY);
        storage.remove(CURRENT_SESSION_KEY);
      }
    }

    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await MockAuth.signIn(email, password);

      if (result?.session && result?.user) {
        setUser(result.user);
        setSession(result.session);
        storage.set(CURRENT_USER_KEY, result.user);
        storage.set(CURRENT_SESSION_KEY, result.session);
        return true;
      } else {
        setError('Invalid email or password');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      MockAuth.signOut();
      setUser(null);
      setSession(null);
      storage.remove(CURRENT_USER_KEY);
      storage.remove(CURRENT_SESSION_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Mock sign up - just call sign in for now
      const result = await MockAuth.signIn(email, password);

      if (result?.session && result?.user) {
        setUser(result.user);
        setSession(result.session);
        storage.set(CURRENT_USER_KEY, result.user);
        storage.set(CURRENT_SESSION_KEY, result.session);
        return true;
      } else {
        setError('Sign up failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    signUp,
  };
}
