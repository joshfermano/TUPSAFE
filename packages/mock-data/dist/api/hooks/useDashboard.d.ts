import { MockDatabase } from '../../data';
export interface DashboardData {
    user: ReturnType<typeof MockDatabase.getUserWithDetails>;
    pds: NonNullable<ReturnType<typeof MockDatabase.getUserDashboard>>['pds'];
    saln: NonNullable<ReturnType<typeof MockDatabase.getUserDashboard>>['saln'];
    notifications: ReturnType<typeof MockDatabase.getNotifications>;
}
export interface UseDashboardReturn {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}
/**
 * Mock dashboard hook
 * Fetches comprehensive dashboard data for user overview
 */
export declare function useDashboard(userId: string): UseDashboardReturn;
