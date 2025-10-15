import { type PdsSubmission } from '../../data';
import type { CompletePdsData } from '@smartgov/database';
export interface UsePdsReturn {
    submissions: PdsSubmission[];
    latest: PdsSubmission | null;
    loading: boolean;
    error: string | null;
    getCompleteSubmission: (id: string) => CompletePdsData | null;
    createDraft: () => Promise<PdsSubmission>;
    updateSubmission: (id: string, data: Partial<CompletePdsData>) => Promise<boolean>;
    submitForReview: (id: string) => Promise<boolean>;
    refetch: () => void;
}
/**
 * Mock PDS submissions hook
 * Manages PDS (Personal Data Sheet) submissions with CRUD operations
 */
export declare function usePds(userId: string): UsePdsReturn;
