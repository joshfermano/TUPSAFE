import { type Profile, type Department, type Position } from '../../data';
export interface ProfileWithDetails {
    profile: Profile;
    department: Department | null;
    position: Position | null;
}
export interface UseProfileReturn {
    profile: Profile | null;
    department: Department | null;
    position: Position | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}
/**
 * Mock profile hook
 * Fetches user profile with department and position details
 */
export declare function useProfile(userId: string): UseProfileReturn;
