// Mock Data Exports for SmartGov PDS/SALN Compliance System
// This file centralizes all mock data for frontend development before implementing real authentication and database connections
// Authentication Mock Data
export * from './auth';
// User Profiles and Organization Mock Data
export * from './users';
// PDS (Personal Data Sheet) Mock Data
export * from './pds';
// SALN (Statement of Assets, Liabilities, Net Worth) Mock Data
export { mockSalnSubmissions, mockSalnRealProperties, mockSalnPersonalProperties, mockSalnLiabilities, mockSalnBusinessInterests, mockSalnRelativesInGov, mockSalnDataSummary, getCompleteSalnSubmission, getSalnSubmissionsByUserId, getSalnSubmissionsByYear, } from './saln';
// Re-export specific collections for easy access
import { mockAuthUsers, MockAuth } from './auth';
import { mockDepartments, mockPositions, mockProfiles, mockDataSummary, getDepartmentById, getPositionById, getProfileById, getProfilesByDepartment, getProfilesByRole, } from './users';
import { mockPdsSubmissions, mockPdsPersonalInfo, mockPdsFamilyBackground, mockPdsChildren, mockPdsEducation, mockPdsCivilService, mockPdsWorkExperience, mockPdsVoluntaryWork, mockPdsTraining, mockPdsOtherInfo, mockPdsDataSummary, getCompletePdsSubmission, getPdsSubmissionsByUserId, } from './pds';
import { mockSalnSubmissions, mockSalnRealProperties, mockSalnPersonalProperties, mockSalnLiabilities, mockSalnBusinessInterests, mockSalnRelativesInGov, mockSalnDataSummary, getCompleteSalnSubmission, getSalnSubmissionsByUserId, getSalnSubmissionsByYear, } from './saln';
// Consolidated Mock Database Interface
export class MockDatabase {
    // Get user's complete profile with department and position info
    static getUserWithDetails(userId) {
        const profile = getProfileById(userId);
        if (!profile)
            return null;
        const department = profile.departmentId
            ? getDepartmentById(profile.departmentId)
            : null;
        const position = profile.positionId
            ? getPositionById(profile.positionId)
            : null;
        const authUser = mockAuthUsers.find((u) => u.id === userId);
        return {
            profile,
            department,
            position,
            authUser,
        };
    }
    // Get user's dashboard data
    static getUserDashboard(userId) {
        const userDetails = this.getUserWithDetails(userId);
        if (!userDetails)
            return null;
        const pdsSubmissions = getPdsSubmissionsByUserId(userId);
        const salnSubmissions = getSalnSubmissionsByUserId(userId);
        // Get latest submissions
        const latestPds = pdsSubmissions
            .filter((pds) => pds.isLatest)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const latestSaln = salnSubmissions.sort((a, b) => b.year - a.year)[0];
        return {
            user: userDetails,
            pds: {
                submissions: pdsSubmissions,
                latest: latestPds,
                complete: latestPds ? getCompletePdsSubmission(latestPds.id) : null,
            },
            saln: {
                submissions: salnSubmissions,
                latest: latestSaln,
                complete: latestSaln ? getCompleteSalnSubmission(latestSaln.id) : null,
            },
        };
    }
    // Get submissions requiring approval (for HR/Admin/Supervisor roles)
    static getPendingApprovals(approverId) {
        const pendingPds = mockPdsSubmissions.filter((pds) => pds.status === 'submitted' || pds.status === 'reviewing');
        const pendingSaln = mockSalnSubmissions.filter((saln) => saln.status === 'submitted' || saln.status === 'reviewing');
        return {
            pds: pendingPds.map((pds) => ({
                submission: pds,
                user: getProfileById(pds.userId),
                complete: getCompletePdsSubmission(pds.id),
            })),
            saln: pendingSaln.map((saln) => ({
                submission: saln,
                user: getProfileById(saln.userId),
                complete: getCompleteSalnSubmission(saln.id),
            })),
        };
    }
    // Get system statistics (for Admin dashboard)
    static getSystemStats() {
        return {
            users: {
                total: mockProfiles.length,
                active: mockProfiles.filter((p) => p.isActive).length,
                byRole: mockDataSummary.roles,
            },
            pds: mockPdsDataSummary,
            saln: mockSalnDataSummary,
            departments: {
                total: mockDepartments.length,
                active: mockDepartments.filter((d) => d.isActive).length,
            },
            positions: {
                total: mockPositions.length,
                active: mockPositions.filter((p) => p.isActive).length,
            },
        };
    }
    // Search functionality
    static searchUsers(query) {
        const lowercaseQuery = query.toLowerCase();
        return mockProfiles
            .filter((profile) => profile.firstName.toLowerCase().includes(lowercaseQuery) ||
            profile.lastName.toLowerCase().includes(lowercaseQuery) ||
            profile.employeeId.toLowerCase().includes(lowercaseQuery) ||
            (profile.middleName &&
                profile.middleName.toLowerCase().includes(lowercaseQuery)))
            .map((profile) => ({
            profile,
            department: profile.departmentId
                ? getDepartmentById(profile.departmentId)
                : null,
            position: profile.positionId
                ? getPositionById(profile.positionId)
                : null,
        }));
    }
    // Generate sample notification data
    static getNotifications(userId) {
        const notifications = [];
        const userProfile = getProfileById(userId);
        if (!userProfile)
            return [];
        // Check for pending submissions
        const userPds = getPdsSubmissionsByUserId(userId);
        const userSaln = getSalnSubmissionsByUserId(userId);
        const draftPds = userPds.filter((pds) => pds.status === 'draft');
        const draftSaln = userSaln.filter((saln) => saln.status === 'draft');
        if (draftPds.length > 0) {
            notifications.push({
                id: `pds-draft-${userId}`,
                type: 'deadline_reminder',
                title: 'Complete Your PDS',
                message: `You have ${draftPds.length} draft PDS submission(s). Please complete and submit before the deadline.`,
                isRead: false,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            });
        }
        if (draftSaln.length > 0) {
            notifications.push({
                id: `saln-draft-${userId}`,
                type: 'deadline_reminder',
                title: 'Complete Your SALN',
                message: `You have ${draftSaln.length} draft SALN submission(s) for ${new Date().getFullYear()}. Please complete and submit before April 30.`,
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            });
        }
        // Add approval notifications for supervisors/HR/admins
        if (['hr', 'admin', 'supervisor'].includes(userProfile.role)) {
            const pendingApprovals = this.getPendingApprovals();
            const totalPending = pendingApprovals.pds.length + pendingApprovals.saln.length;
            if (totalPending > 0) {
                notifications.push({
                    id: `pending-approvals-${userId}`,
                    type: 'approval_required',
                    title: 'Pending Approvals',
                    message: `You have ${totalPending} submission(s) requiring your review and approval.`,
                    isRead: false,
                    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                });
            }
        }
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
// Authentication
MockDatabase.auth = MockAuth;
MockDatabase.authUsers = mockAuthUsers;
// Organization Data
MockDatabase.departments = mockDepartments;
MockDatabase.positions = mockPositions;
MockDatabase.profiles = mockProfiles;
// PDS Data
MockDatabase.pdsSubmissions = mockPdsSubmissions;
MockDatabase.pdsPersonalInfo = mockPdsPersonalInfo;
MockDatabase.pdsFamilyBackground = mockPdsFamilyBackground;
MockDatabase.pdsChildren = mockPdsChildren;
MockDatabase.pdsEducation = mockPdsEducation;
MockDatabase.pdsCivilService = mockPdsCivilService;
MockDatabase.pdsWorkExperience = mockPdsWorkExperience;
MockDatabase.pdsVoluntaryWork = mockPdsVoluntaryWork;
MockDatabase.pdsTraining = mockPdsTraining;
MockDatabase.pdsOtherInfo = mockPdsOtherInfo;
// SALN Data
MockDatabase.salnSubmissions = mockSalnSubmissions;
MockDatabase.salnRealProperties = mockSalnRealProperties;
MockDatabase.salnPersonalProperties = mockSalnPersonalProperties;
MockDatabase.salnLiabilities = mockSalnLiabilities;
MockDatabase.salnBusinessInterests = mockSalnBusinessInterests;
MockDatabase.salnRelativesInGov = mockSalnRelativesInGov;
// Helper Methods for Users and Organizations
MockDatabase.getDepartment = getDepartmentById;
MockDatabase.getPosition = getPositionById;
MockDatabase.getProfile = getProfileById;
MockDatabase.getProfilesByDepartment = getProfilesByDepartment;
MockDatabase.getProfilesByRole = getProfilesByRole;
// Helper Methods for PDS
MockDatabase.getCompletePds = getCompletePdsSubmission;
MockDatabase.getPdsByUser = getPdsSubmissionsByUserId;
// Helper Methods for SALN
MockDatabase.getCompleteSaln = getCompleteSalnSubmission;
MockDatabase.getSalnByUser = getSalnSubmissionsByUserId;
MockDatabase.getSalnByYear = getSalnSubmissionsByYear;
// Default export for the main mock database interface
export default MockDatabase;
// Data summaries for quick reference
export const mockDataOverview = {
    description: 'Comprehensive mock data for Philippine Government PDS/SALN Compliance System',
    created: new Date().toISOString(),
    version: '1.0.0',
    coverage: {
        authUsers: mockAuthUsers.length,
        departments: mockDepartments.length,
        positions: mockPositions.length,
        profiles: mockProfiles.length,
        pdsSubmissions: mockPdsSubmissions.length,
        salnSubmissions: mockSalnSubmissions.length,
    },
    features: [
        'Complete authentication system with mock users',
        'Realistic Filipino government employee profiles',
        'Comprehensive PDS submissions with all sections',
        'Detailed SALN submissions with financial data',
        'Multiple submission statuses and workflows',
        'Proper relationship mapping between entities',
        'Helper functions for easy data access',
        'Dashboard and notification generation',
        'Search and filtering capabilities',
    ],
    usage: {
        authentication: 'Use MockAuth class for login/logout simulation',
        users: 'Access mockProfiles for user data, use helper functions for relationships',
        pds: 'Use getCompletePdsSubmission() for full PDS data with all sections',
        saln: 'Use getCompleteSalnSubmission() for full SALN data with calculations',
        dashboard: 'Use MockDatabase.getUserDashboard() for complete user overview',
        admin: 'Use MockDatabase.getSystemStats() for administrative statistics',
    },
    notes: [
        'All IDs use UUID v7 format for realistic database compatibility',
        'Dates are properly formatted Date objects',
        'Financial amounts are in Philippine Peso (PHP)',
        'Addresses use real Philippine cities and provinces',
        'Names are culturally appropriate Filipino names',
        'Government agencies and positions are authentic',
        'Salary grades follow actual Philippine government scale',
    ],
};
