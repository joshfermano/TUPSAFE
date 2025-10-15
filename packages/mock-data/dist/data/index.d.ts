export * from './auth';
export * from './users';
export * from './pds';
export { mockSalnSubmissions, mockSalnRealProperties, mockSalnPersonalProperties, mockSalnLiabilities, mockSalnBusinessInterests, mockSalnRelativesInGov, mockSalnDataSummary, getCompleteSalnSubmission, getSalnSubmissionsByUserId, getSalnSubmissionsByYear, } from './saln';
export type { SalnSubmission, PdsSubmission } from '@smartgov/database';
import { MockAuth } from './auth';
import { getDepartmentById, getPositionById, getProfileById, getProfilesByDepartment, getProfilesByRole } from './users';
import { getCompletePdsSubmission, getPdsSubmissionsByUserId } from './pds';
import { getCompleteSalnSubmission, getSalnSubmissionsByUserId, getSalnSubmissionsByYear } from './saln';
export declare class MockDatabase {
    static auth: typeof MockAuth;
    static authUsers: import("./auth").MockUser[];
    static departments: import("./users").Department[];
    static positions: import("./users").Position[];
    static profiles: import("./users").Profile[];
    static pdsSubmissions: import("./pds").PdsSubmission[];
    static pdsPersonalInfo: import("./pds").PdsPersonalInfo[];
    static pdsFamilyBackground: import("./pds").PdsFamilyBackground[];
    static pdsChildren: import("./pds").PdsChildren[];
    static pdsEducation: import("./pds").PdsEducation[];
    static pdsCivilService: import("./pds").PdsCivilService[];
    static pdsWorkExperience: import("./pds").PdsWorkExperience[];
    static pdsVoluntaryWork: import("./pds").PdsVoluntaryWork[];
    static pdsTraining: import("./pds").PdsTraining[];
    static pdsOtherInfo: import("./pds").PdsOtherInfo[];
    static salnSubmissions: {
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
    }[];
    static salnRealProperties: import("./saln").SalnRealProperty[];
    static salnPersonalProperties: import("./saln").SalnPersonalProperty[];
    static salnLiabilities: import("./saln").SalnLiability[];
    static salnBusinessInterests: import("./saln").SalnBusinessInterest[];
    static salnRelativesInGov: import("./saln").SalnRelativeInGov[];
    static getDepartment: typeof getDepartmentById;
    static getPosition: typeof getPositionById;
    static getProfile: typeof getProfileById;
    static getProfilesByDepartment: typeof getProfilesByDepartment;
    static getProfilesByRole: typeof getProfilesByRole;
    static getCompletePds: typeof getCompletePdsSubmission;
    static getPdsByUser: typeof getPdsSubmissionsByUserId;
    static getCompleteSaln: typeof getCompleteSalnSubmission;
    static getSalnByUser: typeof getSalnSubmissionsByUserId;
    static getSalnByYear: typeof getSalnSubmissionsByYear;
    static getUserWithDetails(userId: string): {
        profile: import("./users").Profile;
        department: import("./users").Department | null | undefined;
        position: import("./users").Position | null | undefined;
        authUser: import("./auth").MockUser | undefined;
    } | null;
    static getUserDashboard(userId: string): {
        user: {
            profile: import("./users").Profile;
            department: import("./users").Department | null | undefined;
            position: import("./users").Position | null | undefined;
            authUser: import("./auth").MockUser | undefined;
        };
        pds: {
            submissions: import("./pds").PdsSubmission[];
            latest: import("./pds").PdsSubmission;
            complete: {
                submission: import("./pds").PdsSubmission;
                personalInfo: import("./pds").PdsPersonalInfo | undefined;
                familyBackground: import("./pds").PdsFamilyBackground | undefined;
                children: import("./pds").PdsChildren[];
                education: import("./pds").PdsEducation[];
                civilService: import("./pds").PdsCivilService[];
                workExperience: import("./pds").PdsWorkExperience[];
                voluntaryWork: import("./pds").PdsVoluntaryWork[];
                training: import("./pds").PdsTraining[];
                otherInfo: import("./pds").PdsOtherInfo | undefined;
            } | null;
        };
        saln: {
            submissions: {
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
            }[];
            latest: {
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
            complete: {
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
                realProperties: import("./saln").SalnRealProperty[];
                personalProperties: import("./saln").SalnPersonalProperty[];
                liabilities: import("./saln").SalnLiability[];
                businessInterests: import("./saln").SalnBusinessInterest[];
                relativesInGov: import("./saln").SalnRelativeInGov[];
                calculations: {
                    totalRealPropertyValue: number;
                    totalPersonalPropertyValue: number;
                    totalAssets: number;
                    totalLiabilities: number;
                    netWorth: number;
                };
            } | null;
        };
    } | null;
    static getPendingApprovals(approverId?: string): {
        pds: {
            submission: import("./pds").PdsSubmission;
            user: import("./users").Profile | undefined;
            complete: {
                submission: import("./pds").PdsSubmission;
                personalInfo: import("./pds").PdsPersonalInfo | undefined;
                familyBackground: import("./pds").PdsFamilyBackground | undefined;
                children: import("./pds").PdsChildren[];
                education: import("./pds").PdsEducation[];
                civilService: import("./pds").PdsCivilService[];
                workExperience: import("./pds").PdsWorkExperience[];
                voluntaryWork: import("./pds").PdsVoluntaryWork[];
                training: import("./pds").PdsTraining[];
                otherInfo: import("./pds").PdsOtherInfo | undefined;
            } | null;
        }[];
        saln: {
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
            user: import("./users").Profile | undefined;
            complete: {
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
                realProperties: import("./saln").SalnRealProperty[];
                personalProperties: import("./saln").SalnPersonalProperty[];
                liabilities: import("./saln").SalnLiability[];
                businessInterests: import("./saln").SalnBusinessInterest[];
                relativesInGov: import("./saln").SalnRelativeInGov[];
                calculations: {
                    totalRealPropertyValue: number;
                    totalPersonalPropertyValue: number;
                    totalAssets: number;
                    totalLiabilities: number;
                    netWorth: number;
                };
            } | null;
        }[];
    };
    static getSystemStats(): {
        users: {
            total: number;
            active: number;
            byRole: {
                employee: number;
                hr: number;
                admin: number;
                supervisor: number;
                auditor: number;
            };
        };
        pds: {
            submissions: number;
            personalInfo: number;
            familyBackground: number;
            children: number;
            education: number;
            civilService: number;
            workExperience: number;
            voluntaryWork: number;
            training: number;
            otherInfo: number;
            statuses: {
                draft: number;
                submitted: number;
                reviewing: number;
                approved: number;
                rejected: number;
            };
        };
        saln: {
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
        departments: {
            total: number;
            active: number;
        };
        positions: {
            total: number;
            active: number;
        };
    };
    static searchUsers(query: string): {
        profile: import("./users").Profile;
        department: import("./users").Department | null | undefined;
        position: import("./users").Position | null | undefined;
    }[];
    static getNotifications(userId: string): {
        id: string;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
    }[];
}
export default MockDatabase;
export declare const mockDataOverview: {
    description: string;
    created: string;
    version: string;
    coverage: {
        authUsers: number;
        departments: number;
        positions: number;
        profiles: number;
        pdsSubmissions: number;
        salnSubmissions: number;
    };
    features: string[];
    usage: {
        authentication: string;
        users: string;
        pds: string;
        saln: string;
        dashboard: string;
        admin: string;
    };
    notes: string[];
};
