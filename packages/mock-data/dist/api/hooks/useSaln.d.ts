import { type SalnSubmission } from '../../data';
import type { CompleteSalnData } from '@smartgov/database';
export interface UseSalnReturn {
    submissions: SalnSubmission[];
    latest: SalnSubmission | null;
    loading: boolean;
    error: string | null;
    getCompleteSubmission: (id: string) => CompleteSalnData | null;
    createDraft: (year: number) => Promise<SalnSubmission>;
    updateSubmission: (id: string, data: Partial<CompleteSalnData>) => Promise<boolean>;
    submitForReview: (id: string) => Promise<boolean>;
    refetch: () => void;
}
/**
 * Mock SALN submissions hook
 * Manages SALN (Statement of Assets, Liabilities, Net Worth) submissions
 */
export declare function useSaln(userId: string): UseSalnReturn;
