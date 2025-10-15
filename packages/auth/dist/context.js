'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './utils/supabase/client';
const AuthContext = createContext(undefined);
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    // Create supabase client
    const supabase = createClient();
    // Fetch user profile from our database
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };
    // Initialize session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession }, } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
                if (initialSession?.user) {
                    const userProfile = await fetchProfile(initialSession.user.id);
                    setProfile(userProfile);
                }
            }
            catch (error) {
                console.error('Error initializing auth:', error);
            }
            finally {
                setLoading(false);
            }
        };
        initializeAuth();
        // Listen for auth changes
        const { data: { subscription }, } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                const userProfile = await fetchProfile(session.user.id);
                setProfile(userProfile);
            }
            else {
                setProfile(null);
            }
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };
    const signUp = async (email, password, userData) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData,
            },
        });
        return { error };
    };
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };
    const signInWithOAuth = async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    hd: 'gov.ph', // Restrict to government email domains
                },
            },
        });
        return { error };
    };
    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
    };
    const updatePassword = async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
    };
    const hasRole = (role) => {
        if (!profile)
            return false;
        return profile.role === role || profile.role === 'admin';
    };
    const hasPermission = (permission) => {
        if (!profile)
            return false;
        // Admin has all permissions
        if (profile.role === 'admin')
            return true;
        // Define role-based permissions
        const rolePermissions = {
            employee: [
                'view_own_submissions',
                'create_submissions',
                'edit_own_submissions',
            ],
            hr: [
                'view_department_submissions',
                'approve_submissions',
                'manage_users',
            ],
            supervisor: ['view_subordinate_submissions', 'approve_submissions'],
            auditor: ['view_all_submissions', 'view_audit_logs'],
            admin: ['*'], // All permissions
        };
        const userPermissions = rolePermissions[profile.role] || [];
        return (userPermissions.includes(permission) || userPermissions.includes('*'));
    };
    const value = {
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        hasRole,
        hasPermission,
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
