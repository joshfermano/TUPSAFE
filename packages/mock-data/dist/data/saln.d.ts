import type { SalnSubmission } from '@smartgov/database';
export type SubmissionStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
export type PropertyKind = 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed';
export type FilingType = 'joint' | 'separate' | 'not_applicable';
export interface SalnRealProperty {
    id: string;
    salnSubmissionId: string;
    description: string;
    kind: PropertyKind;
    exactLocation: string;
    assessedValue: number;
    currentFairMarketValue: number;
    acquisitionYear: number;
    acquisitionMode: string;
    acquisitionCost: number;
}
export interface SalnPersonalProperty {
    id: string;
    salnSubmissionId: string;
    description: string;
    yearAcquired: number;
    acquisitionCost: number;
}
export interface SalnLiability {
    id: string;
    salnSubmissionId: string;
    nature: string;
    creditorName: string;
    outstandingBalance: number;
}
export interface SalnBusinessInterest {
    id: string;
    salnSubmissionId: string;
    entityName: string;
    businessAddress: string;
    natureOfBusiness: string;
    dateOfAcquisition: Date;
}
export interface SalnRelativeInGov {
    id: string;
    salnSubmissionId: string;
    name: string;
    relationship: string;
    position: string;
    agencyAddress: string;
}
export declare const mockSalnSubmissions: SalnSubmission[];
export declare const mockSalnRealProperties: SalnRealProperty[];
export declare const mockSalnPersonalProperties: SalnPersonalProperty[];
export declare const mockSalnLiabilities: SalnLiability[];
export declare const mockSalnBusinessInterests: SalnBusinessInterest[];
export declare const mockSalnRelativesInGov: SalnRelativeInGov[];
export declare function getSalnSubmissionById(id: string): SalnSubmission | undefined;
export declare function getSalnSubmissionsByUserId(userId: string): SalnSubmission[];
export declare function getSalnSubmissionsByYear(year: number): SalnSubmission[];
export declare function getSalnRealPropertiesBySubmissionId(submissionId: string): SalnRealProperty[];
export declare function getSalnPersonalPropertiesBySubmissionId(submissionId: string): SalnPersonalProperty[];
export declare function getSalnLiabilitiesBySubmissionId(submissionId: string): SalnLiability[];
export declare function getSalnBusinessInterestsBySubmissionId(submissionId: string): SalnBusinessInterest[];
export declare function getSalnRelativesInGovBySubmissionId(submissionId: string): SalnRelativeInGov[];
export declare function getCompleteSalnSubmission(submissionId: string): {
    submission: {
        id: string;
        createdAt: Date;
        userId: string;
        year: number;
        status: "draft" | "submitted" | "reviewing" | "approved" | "rejected";
        totalAssets: string | null;
        totalLiabilities: string | null;
        netWorth: string | null;
        submittedAt: Date | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        filingType: "joint" | "separate" | "not_applicable";
        updatedAt: Date;
    };
    realProperties: SalnRealProperty[];
    personalProperties: SalnPersonalProperty[];
    liabilities: SalnLiability[];
    businessInterests: SalnBusinessInterest[];
    relativesInGov: SalnRelativeInGov[];
    calculations: {
        totalRealPropertyValue: number;
        totalPersonalPropertyValue: number;
        totalAssets: number;
        totalLiabilities: number;
        netWorth: number;
    };
} | null;
export declare function generateMockSalnSubmission(userId: string, year: number, status?: SubmissionStatus, filingType?: FilingType): SalnSubmission;
export declare function generateMockRealProperty(salnSubmissionId: string, description: string, kind: PropertyKind, location: string, acquisitionYear: number): SalnRealProperty;
export declare const philippineCities: {
    city: string;
    province: string;
    zipCode: string;
}[];
export declare const filipinoSurnames: string[];
export declare const filipinoGivenNames: {
    male: string[];
    female: string[];
};
export declare const mockSalnDataSummary: {
    submissions: number;
    realProperties: number;
    personalProperties: number;
    liabilities: number;
    businessInterests: number;
    relativesInGov: number;
    years: number[];
    statuses: {
        draft: number;
        submitted: number;
        reviewing: number;
        approved: number;
        rejected: number;
    };
    filingTypes: {
        joint: number;
        separate: number;
        not_applicable: number;
    };
    totalNetWorth: number;
    averageNetWorth: number;
};
