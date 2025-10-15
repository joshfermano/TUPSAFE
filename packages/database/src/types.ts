import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type * as schema from './schema';

// User Management Types
export type Profile = InferSelectModel<typeof schema.profiles>;
export type NewProfile = InferInsertModel<typeof schema.profiles>;
export type Department = InferSelectModel<typeof schema.departments>;
export type NewDepartment = InferInsertModel<typeof schema.departments>;
export type Position = InferSelectModel<typeof schema.positions>;
export type NewPosition = InferInsertModel<typeof schema.positions>;

// PDS Types
export type PdsSubmission = InferSelectModel<typeof schema.pdsSubmissions>;
export type NewPdsSubmission = InferInsertModel<typeof schema.pdsSubmissions>;
export type PdsPersonalInfo = InferSelectModel<typeof schema.pdsPersonalInfo>;
export type NewPdsPersonalInfo = InferInsertModel<
  typeof schema.pdsPersonalInfo
>;
export type PdsFamilyBackground = InferSelectModel<
  typeof schema.pdsFamilyBackground
>;
export type NewPdsFamilyBackground = InferInsertModel<
  typeof schema.pdsFamilyBackground
>;
export type PdsChild = InferSelectModel<typeof schema.pdsChildren>;
export type NewPdsChild = InferInsertModel<typeof schema.pdsChildren>;
export type PdsEducation = InferSelectModel<typeof schema.pdsEducation>;
export type NewPdsEducation = InferInsertModel<typeof schema.pdsEducation>;
export type PdsCivilService = InferSelectModel<typeof schema.pdsCivilService>;
export type NewPdsCivilService = InferInsertModel<
  typeof schema.pdsCivilService
>;
export type PdsWorkExperience = InferSelectModel<
  typeof schema.pdsWorkExperience
>;
export type NewPdsWorkExperience = InferInsertModel<
  typeof schema.pdsWorkExperience
>;
export type PdsVoluntaryWork = InferSelectModel<typeof schema.pdsVoluntaryWork>;
export type NewPdsVoluntaryWork = InferInsertModel<
  typeof schema.pdsVoluntaryWork
>;
export type PdsTraining = InferSelectModel<typeof schema.pdsTraining>;
export type NewPdsTraining = InferInsertModel<typeof schema.pdsTraining>;
export type PdsOtherInfo = InferSelectModel<typeof schema.pdsOtherInfo>;
export type NewPdsOtherInfo = InferInsertModel<typeof schema.pdsOtherInfo>;

// SALN Types
export type SalnSubmission = InferSelectModel<typeof schema.salnSubmissions>;
export type NewSalnSubmission = InferInsertModel<typeof schema.salnSubmissions>;
export type SalnRealProperty = InferSelectModel<
  typeof schema.salnRealProperties
>;
export type NewSalnRealProperty = InferInsertModel<
  typeof schema.salnRealProperties
>;
export type SalnPersonalProperty = InferSelectModel<
  typeof schema.salnPersonalProperties
>;
export type NewSalnPersonalProperty = InferInsertModel<
  typeof schema.salnPersonalProperties
>;
export type SalnLiability = InferSelectModel<typeof schema.salnLiabilities>;
export type NewSalnLiability = InferInsertModel<typeof schema.salnLiabilities>;
export type SalnBusinessInterest = InferSelectModel<
  typeof schema.salnBusinessInterests
>;
export type NewSalnBusinessInterest = InferInsertModel<
  typeof schema.salnBusinessInterests
>;
export type SalnRelativeInGov = InferSelectModel<
  typeof schema.salnRelativesInGov
>;
export type NewSalnRelativeInGov = InferInsertModel<
  typeof schema.salnRelativesInGov
>;

// Administrative Types
export type SubmissionDeadline = InferSelectModel<
  typeof schema.submissionDeadlines
>;
export type NewSubmissionDeadline = InferInsertModel<
  typeof schema.submissionDeadlines
>;
export type ApprovalWorkflow = InferSelectModel<
  typeof schema.approvalWorkflows
>;
export type NewApprovalWorkflow = InferInsertModel<
  typeof schema.approvalWorkflows
>;
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLogs>;
export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;
export type Archive = InferSelectModel<typeof schema.archives>;
export type NewArchive = InferInsertModel<typeof schema.archives>;

// Enum Types
export type Role = 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected';
export type Sex = 'male' | 'female';
export type CivilStatus =
  | 'single'
  | 'married'
  | 'widowed'
  | 'separated'
  | 'divorced';
export type EducationLevel =
  | 'elementary'
  | 'secondary'
  | 'vocational'
  | 'college'
  | 'graduate';
export type PropertyKind =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'
  | 'mixed';
export type FormType = 'pds' | 'saln';
export type FilingType = 'joint' | 'separate' | 'not_applicable';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'deadline_reminder'
  | 'submission_status'
  | 'approval_required'
  | 'system_update';

// Complex Types for JSONB fields
export interface Citizenship {
  type: 'Filipino' | 'Dual';
  country?: string;
  details?: string;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  zipCode: string;
}

export interface Skill {
  name: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Recognition {
  title: string;
  year: number;
  organization: string;
}

export interface Association {
  name: string;
  position?: string;
  yearsOfMembership?: number;
}

export interface CharacterReference {
  name: string;
  address: string;
  telephoneNo?: string;
}

// Complete PDS Data Structure
export interface CompletePdsData {
  submission: PdsSubmission;
  personalInfo: PdsPersonalInfo;
  familyBackground: PdsFamilyBackground;
  children: PdsChild[];
  education: PdsEducation[];
  civilService: PdsCivilService[];
  workExperience: PdsWorkExperience[];
  voluntaryWork: PdsVoluntaryWork[];
  training: PdsTraining[];
  otherInfo: PdsOtherInfo;
}

// Complete SALN Data Structure
export interface CompleteSalnData {
  submission: SalnSubmission;
  realProperties: SalnRealProperty[];
  personalProperties: SalnPersonalProperty[];
  liabilities: SalnLiability[];
  businessInterests: SalnBusinessInterest[];
  relativesInGov: SalnRelativeInGov[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Session Context
export interface UserContext {
  id: string;
  email: string;
  profile: Profile;
  permissions: string[];
}

// Supabase Database Type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: NewProfile;
        Update: Partial<NewProfile>;
      };
      departments: {
        Row: Department;
        Insert: NewDepartment;
        Update: Partial<NewDepartment>;
      };
      positions: {
        Row: Position;
        Insert: NewPosition;
        Update: Partial<NewPosition>;
      };
      pds_submissions: {
        Row: PdsSubmission;
        Insert: NewPdsSubmission;
        Update: Partial<NewPdsSubmission>;
      };
      pds_personal_info: {
        Row: PdsPersonalInfo;
        Insert: NewPdsPersonalInfo;
        Update: Partial<NewPdsPersonalInfo>;
      };
      pds_family_background: {
        Row: PdsFamilyBackground;
        Insert: NewPdsFamilyBackground;
        Update: Partial<NewPdsFamilyBackground>;
      };
      pds_children: {
        Row: PdsChild;
        Insert: NewPdsChild;
        Update: Partial<NewPdsChild>;
      };
      pds_education: {
        Row: PdsEducation;
        Insert: NewPdsEducation;
        Update: Partial<NewPdsEducation>;
      };
      pds_civil_service: {
        Row: PdsCivilService;
        Insert: NewPdsCivilService;
        Update: Partial<NewPdsCivilService>;
      };
      pds_work_experience: {
        Row: PdsWorkExperience;
        Insert: NewPdsWorkExperience;
        Update: Partial<NewPdsWorkExperience>;
      };
      pds_voluntary_work: {
        Row: PdsVoluntaryWork;
        Insert: NewPdsVoluntaryWork;
        Update: Partial<NewPdsVoluntaryWork>;
      };
      pds_training: {
        Row: PdsTraining;
        Insert: NewPdsTraining;
        Update: Partial<NewPdsTraining>;
      };
      pds_other_info: {
        Row: PdsOtherInfo;
        Insert: NewPdsOtherInfo;
        Update: Partial<NewPdsOtherInfo>;
      };
      saln_submissions: {
        Row: SalnSubmission;
        Insert: NewSalnSubmission;
        Update: Partial<NewSalnSubmission>;
      };
      saln_real_properties: {
        Row: SalnRealProperty;
        Insert: NewSalnRealProperty;
        Update: Partial<NewSalnRealProperty>;
      };
      saln_personal_properties: {
        Row: SalnPersonalProperty;
        Insert: NewSalnPersonalProperty;
        Update: Partial<NewSalnPersonalProperty>;
      };
      saln_liabilities: {
        Row: SalnLiability;
        Insert: NewSalnLiability;
        Update: Partial<NewSalnLiability>;
      };
      saln_business_interests: {
        Row: SalnBusinessInterest;
        Insert: NewSalnBusinessInterest;
        Update: Partial<NewSalnBusinessInterest>;
      };
      saln_relatives_in_gov: {
        Row: SalnRelativeInGov;
        Insert: NewSalnRelativeInGov;
        Update: Partial<NewSalnRelativeInGov>;
      };
      submission_deadlines: {
        Row: SubmissionDeadline;
        Insert: NewSubmissionDeadline;
        Update: Partial<NewSubmissionDeadline>;
      };
      approval_workflows: {
        Row: ApprovalWorkflow;
        Insert: NewApprovalWorkflow;
        Update: Partial<NewApprovalWorkflow>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: NewAuditLog;
        Update: Partial<NewAuditLog>;
      };
      notifications: {
        Row: Notification;
        Insert: NewNotification;
        Update: Partial<NewNotification>;
      };
      archives: {
        Row: Archive;
        Insert: NewArchive;
        Update: Partial<NewArchive>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      role: Role;
      submission_status: SubmissionStatus;
      sex: Sex;
      civil_status: CivilStatus;
      education_level: EducationLevel;
      property_kind: PropertyKind;
      form_type: FormType;
      filing_type: FilingType;
      approval_status: ApprovalStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
