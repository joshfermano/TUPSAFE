import { type MockSession, type MockUser } from '../../data/auth';
export interface UseAuthReturn {
    user: MockUser | null;
    session: MockSession | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<boolean>;
}
/**
 * Mock authentication hook
 * Simulates authentication with localStorage persistence
 */
export declare function useAuth(): UseAuthReturn;
