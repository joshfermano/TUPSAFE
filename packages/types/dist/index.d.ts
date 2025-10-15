export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export type UserRole = 'employee' | 'hr' | 'admin';
export interface PDSSubmission {
    id: string;
    userId: string;
    version: number;
    status: SubmissionStatus;
    data: PDSData;
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SALNSubmission {
    id: string;
    userId: string;
    year: number;
    version: number;
    status: SubmissionStatus;
    data: SALNData;
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export interface PDSData {
    personalInfo: {
        firstName: string;
        middleName?: string;
        lastName: string;
        nameExtension?: string;
        dateOfBirth: string;
        placeOfBirth: string;
        sex: 'male' | 'female';
        civilStatus: string;
        height: number;
        weight: number;
        bloodType?: string;
        gsisIdNo?: string;
        pagibigIdNo?: string;
        philhealthNo?: string;
        sssNo?: string;
        tinNo?: string;
        agencyEmployeeNo?: string;
    };
    contactInfo: {
        residentialAddress: Address;
        permanentAddress: Address;
        telephoneNo?: string;
        mobileNo?: string;
        emailAddress?: string;
    };
}
export interface SALNData {
    assets: {
        realProperties: RealProperty[];
        personalProperties: PersonalProperty[];
        cashAndInvestments: CashAndInvestment[];
    };
    liabilities: Liability[];
    netWorth: number;
    businessInterests: BusinessInterest[];
    financialConnections: FinancialConnection[];
    relativesInGovernment: RelativeInGovernment[];
}
export interface Address {
    houseBlockLotNo?: string;
    street?: string;
    subdivision?: string;
    barangay: string;
    city: string;
    province: string;
    zipCode: string;
}
export interface RealProperty {
    id: string;
    description: string;
    kind: string;
    exactLocation: string;
    assessedValue: number;
    currentMarketValue: number;
    acquisitionYear: number;
    acquisitionCost: number;
}
export interface PersonalProperty {
    id: string;
    description: string;
    acquisitionYear: number;
    acquisitionCost: number;
}
export interface CashAndInvestment {
    id: string;
    description: string;
    amount: number;
}
export interface Liability {
    id: string;
    nature: string;
    nameOfCreditors: string;
    outstandingBalance: number;
}
export interface BusinessInterest {
    id: string;
    nameOfEntity: string;
    businessAddress: string;
    nature: string;
    dateOfAcquisition: string;
}
export interface FinancialConnection {
    id: string;
    nameOfEntity: string;
    businessAddress: string;
    nature: string;
    dateOfAcquisition: string;
}
export interface RelativeInGovernment {
    id: string;
    name: string;
    relationship: string;
    position: string;
    nameOfAgency: string;
}
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}
export type NotificationType = 'deadline_reminder' | 'submission_approved' | 'submission_rejected' | 'system_update' | 'general';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface AppConfig {
    appType: 'employee' | 'admin';
    allowedRoles: UserRole[];
    features: {
        pdsSubmission: boolean;
        salnSubmission: boolean;
        aiAssistant: boolean;
        bulkOperations: boolean;
        advancedReporting: boolean;
    };
}
