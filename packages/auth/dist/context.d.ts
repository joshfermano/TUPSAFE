import React from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
type Role = 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
interface Profile {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: Role;
    departmentId?: string;
    positionId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{
        error: AuthError | null;
    }>;
    signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{
        error: AuthError | null;
    }>;
    signOut: () => Promise<{
        error: AuthError | null;
    }>;
    signInWithOAuth: (provider: 'google') => Promise<{
        error: AuthError | null;
    }>;
    resetPassword: (email: string) => Promise<{
        error: AuthError | null;
    }>;
    updatePassword: (password: string) => Promise<{
        error: AuthError | null;
    }>;
    hasRole: (role: Role) => boolean;
    hasPermission: (permission: string) => boolean;
}
export declare function useAuth(): AuthContextType;
interface AuthProviderProps {
    children: React.ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
