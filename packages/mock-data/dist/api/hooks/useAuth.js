'use client';
import { useState, useEffect, useCallback } from 'react';
import { MockAuth } from '../../data/auth';
import { storage } from '../../utils/storage';
const CURRENT_USER_KEY = 'current_user';
const CURRENT_SESSION_KEY = 'current_session';
/**
 * Mock authentication hook
 * Simulates authentication with localStorage persistence
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Initialize auth state from localStorage
    useEffect(() => {
        const storedUser = storage.get(CURRENT_USER_KEY);
        const storedSession = storage.get(CURRENT_SESSION_KEY);
        if (storedUser && storedSession) {
            // Check if session is still valid
            if (new Date(storedSession.expiresAt) > new Date()) {
                setUser(storedUser);
                setSession(storedSession);
            }
            else {
                // Session expired, clear storage
                storage.remove(CURRENT_USER_KEY);
                storage.remove(CURRENT_SESSION_KEY);
            }
        }
        setLoading(false);
    }, []);
    const signIn = useCallback(async (email, password) => {
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
            }
            else {
                setError('Invalid email or password');
                return false;
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return false;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const signOut = useCallback(async () => {
        setLoading(true);
        try {
            MockAuth.signOut();
            setUser(null);
            setSession(null);
            storage.remove(CURRENT_USER_KEY);
            storage.remove(CURRENT_SESSION_KEY);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign out failed');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const signUp = useCallback(async (email, password) => {
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
            }
            else {
                setError('Sign up failed');
                return false;
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return false;
        }
        finally {
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
