'use client';

/**
 * Mock Authentication Context for Admin Portal
 *
 * This is a temporary mock authentication system for development.
 * It uses localStorage for session management and validates against mock users.
 *
 * MIGRATION GUIDE - How to swap for Supabase Auth:
 *
 * 1. Replace imports:
 *    - Remove this file
 *    - Import from '@tupsafe/auth' instead
 *
 * 2. Update AuthProvider usage in layout.tsx:
 *    - Change: import { AuthProvider } from '@/context/AuthContext'
 *    - To: import { AuthProvider } from '@tupsafe/auth'
 *
 * 3. Update useAuth hook usage:
 *    - The interface should remain similar
 *    - user.id will be from Supabase auth.users.id
 *    - profile will come from database query
 *
 * 4. Remove localStorage logic:
 *    - Supabase handles session management automatically
 *    - No need for manual localStorage operations
 *
 * 5. Update login logic:
 *    - Replace mockAuth.signIn with supabase.auth.signInWithPassword
 *    - Profile will be fetched from database via RLS policies
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  mockProfiles,
  mockDepartments,
  mockPositions,
  type Profile,
} from '@tupsafe/mock-data';

// Storage key for localStorage
const STORAGE_KEY = 'tupsafe-admin-auth';

/**
 * Mock user interface matching Supabase Auth structure
 * Designed to be easily swappable with real Supabase user
 */
export interface MockUser {
  id: string;
  email: string;
  role: 'admin' | 'hr';
  created_at: string;
}

/**
 * Extended profile with department and position details
 */
export interface MockProfile extends Profile {
  department?: {
    id: string;
    name: string;
    code: string;
  };
  position?: {
    id: string;
    title: string;
    gradeLevel: number | null;
  };
}

/**
 * AuthContext interface
 * Mirrors Supabase Auth structure for easy migration
 */
interface AuthContextType {
  user: MockUser | null;
  profile: MockProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Mock credentials for admin portal access
 * Only admin and hr roles are allowed
 *
 * TUP Manila-Related Demo Accounts:
 * - Dr. Adora Guerrero (University President)
 * - Prof. Antonio Santos (HR Director)
 */
const mockCredentials = [
  {
    email: 'admin@tup.edu.ph',
    password: 'admin123',
    profileId: '01927d4e-8b45-7f52-b123-456789abcde3', // - Admin (maps to Dr. Adora Guerrero)
  },
  {
    email: 'rodrigo.duterte@tup.edu.ph',
    password: 'password123',
    profileId: '01927d4e-8b45-7f52-b123-456789abcde3', // - Admin (maps to Dr. Adora Guerrero)
  },
  {
    email: 'hr@tup.edu.ph',
    password: 'hr123',
    profileId: '01927d4e-8b45-7f52-b123-456789abcde0', // Maria Santos - HR (maps to Prof. Antonio Santos)
  },
  {
    email: 'maria.santos@tup.edu.ph',
    password: 'password123',
    profileId: '01927d4e-8b45-7f52-b123-456789abcde0', // Maria Santos - HR (maps to Prof. Antonio Santos)
  },
  {
    email: 'leni.robredo@tup.edu.ph',
    password: 'password123',
    profileId: '01927d4e-8b45-7f52-b123-456789abcde6', // Leni Robredo - HR
  },
];

/**
 * Enhance profile with department and position details
 */
function enhanceProfile(profile: Profile): MockProfile {
  const department = profile.departmentId
    ? mockDepartments.find((d) => d.id === profile.departmentId)
    : undefined;

  const position = profile.positionId
    ? mockPositions.find((p) => p.id === profile.positionId)
    : undefined;

  return {
    ...profile,
    department: department
      ? {
          id: department.id,
          name: department.name,
          code: department.code,
        }
      : undefined,
    position: position
      ? {
          id: position.id,
          title: position.title,
          gradeLevel: position.gradeLevel,
        }
      : undefined,
  };
}

/**
 * AuthProvider Component
 * Manages authentication state and provides auth methods
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state from localStorage
   * Runs once on mount to restore session
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setLoading(false);
          return;
        }

        const session = JSON.parse(stored);

        // Validate session expiry
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }

        // Validate user and profile data
        if (session.user && session.profile) {
          setUser(session.user);
          setProfile(session.profile);
        }
      } catch (error) {
        console.error('Error restoring auth session:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Sign in with email and password
   * Validates credentials against mock data and stores session
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Find matching credentials
      const credentials = mockCredentials.find(
        (cred) => cred.email === email && cred.password === password
      );

      if (!credentials) {
        throw new Error('Invalid email or password');
      }

      // Find profile in mock data
      const foundProfile = mockProfiles.find(
        (p) => p.id === credentials.profileId
      );

      if (!foundProfile) {
        throw new Error('User profile not found');
      }

      // Validate role - only admin and hr can access admin portal
      if (foundProfile.role !== 'admin' && foundProfile.role !== 'hr') {
        throw new Error('Access denied. Admin or HR role required.');
      }

      // Create mock user object
      const mockUser: MockUser = {
        id: foundProfile.id,
        email,
        role: foundProfile.role as 'admin' | 'hr',
        created_at: foundProfile.createdAt.toISOString(),
      };

      // Enhance profile with related data
      const enhancedProfile = enhanceProfile(foundProfile);

      // Create session object
      const session = {
        user: mockUser,
        profile: enhancedProfile,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        createdAt: new Date().toISOString(),
      };

      // Store session in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }

      // Update state
      setUser(mockUser);
      setProfile(enhancedProfile);
    } catch (error) {
      // Clear any existing session on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setUser(null);
      setProfile(null);
      throw error;
    }
  }, []);

  /**
   * Sign out and clear session
   * Removes data from localStorage and resets state
   */
  const signOut = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Access auth context in components
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Export for testing and migration
 */
export { AuthContext };
export default AuthContext;
