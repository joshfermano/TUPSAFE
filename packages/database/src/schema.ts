import {
  boolean,
  date,
  decimal,
  inet,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { v7 } from 'uuid';

// Enums
export const roleEnum = pgEnum('role', [
  'employee',
  'hr',
  'admin',
  'supervisor',
  'auditor',
]);
export const submissionStatusEnum = pgEnum('submission_status', [
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'rejected',
]);
export const sexEnum = pgEnum('sex', ['male', 'female']);
export const civilStatusEnum = pgEnum('civil_status', [
  'single',
  'married',
  'widowed',
  'separated',
  'divorced',
]);
export const educationLevelEnum = pgEnum('education_level', [
  'elementary',
  'secondary',
  'vocational',
  'college',
  'graduate',
]);
export const propertyKindEnum = pgEnum('property_kind', [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'mixed',
]);
export const formTypeEnum = pgEnum('form_type', ['pds', 'saln']);
export const filingTypeEnum = pgEnum('filing_type', [
  'joint',
  'separate',
  'not_applicable',
]);
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'deadline_reminder',
  'submission_status',
  'approval_required',
  'system_update',
]);

// Auth-related enums
export const accountStatusEnum = pgEnum('account_status', [
  'pending',
  'active',
  'suspended',
  'rejected',
]);
export const otpTypeEnum = pgEnum('otp_type', [
  'email_verification',
  'login_challenge',
  'password_reset',
]);

// User preferences enums
export const emailDigestFrequencyEnum = pgEnum('email_digest_frequency', [
  'realtime',
  'daily',
  'weekly',
  'never',
]);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);
export const dashboardLayoutEnum = pgEnum('dashboard_layout', [
  'default',
  'compact',
  'detailed',
]);
export const languageEnum = pgEnum('language', ['en', 'fil']);

// Multi-user type system enums
export const userTypeEnum = pgEnum('user_type', ['employee', 'applicant']);
export const employmentCategoryEnum = pgEnum('employment_category', [
  'faculty',
  'administrative',
  'contractual',
  'not_applicable',
]);
export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'under_review',
  'shortlisted',
  'for_interview',
  'interviewed',
  'for_final_review',
  'accepted',
  'rejected',
  'withdrawn',
  'hired',
]);
export const positionStatusEnum = pgEnum('position_status', [
  'open',
  'closed',
  'filled',
  'cancelled',
]);
export const officeTypeEnum = pgEnum('office_type', [
  'academic',
  'administrative',
]);

// Core User Management Tables
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // References Supabase auth.users.id
    // Multi-user type fields
    userType: userTypeEnum('user_type').default('employee').notNull(),
    employmentCategory: employmentCategoryEnum('employment_category').default(
      'not_applicable'
    ),
    applicantId: text('applicant_id').unique(),
    employeeId: text('employee_id').unique(), // Now nullable for applicants
    hireDate: date('hire_date'),
    // Basic info
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    middleName: text('middle_name'),
    phoneNumber: text('phone_number'),
    role: roleEnum('role').default('employee').notNull(),
    departmentId: uuid('department_id'),
    positionId: uuid('position_id'),
    // TUP Manila-specific fields
    academicRank: text('academic_rank'), // Professor, Associate Professor, Assistant Professor, Instructor
    tenureStatus: text('tenure_status'), // Tenured, tenure-track, non-tenure track, contractual
    employmentType: text('employment_type'), // Full-time, part-time, adjunct
    campusAssignment: text('campus_assignment'), // Main campus or satellite campus
    // Auth-related fields
    accountStatus: accountStatusEnum('account_status')
      .default('pending')
      .notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at'),
    temporaryPassword: boolean('temporary_password').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    employeeIdIdx: index('profiles_employee_id_idx').on(table.employeeId),
    applicantIdIdx: index('profiles_applicant_id_idx').on(table.applicantId),
    userTypeIdx: index('profiles_user_type_idx').on(table.userType),
    employmentCategoryIdx: index('profiles_employment_category_idx').on(
      table.employmentCategory
    ),
    roleIdx: index('profiles_role_idx').on(table.role),
    departmentIdIdx: index('profiles_department_id_idx').on(table.departmentId),
    isActiveIdx: index('profiles_is_active_idx').on(table.isActive),
    accountStatusIdx: index('profiles_account_status_idx').on(
      table.accountStatus
    ),
    // Composite indexes for common queries
    roleDepartmentIdx: index('profiles_role_department_idx').on(
      table.role,
      table.departmentId
    ),
    userTypeEmploymentCategoryIdx: index(
      'profiles_user_type_employment_category_idx'
    ).on(table.userType, table.employmentCategory),
    userTypeAccountStatusIdx: index('profiles_user_type_account_status_idx').on(
      table.userType,
      table.accountStatus
    ),
  })
);

export const departments = pgTable(
  'departments',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    name: text('name').notNull(),
    code: text('code').unique().notNull(),
    officeType: officeTypeEnum('office_type').default('academic'),
    parentId: uuid('parent_id'),
    parentCollegeId: uuid('parent_college_id').references(
      (): any => departments.id
    ),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index('departments_code_idx').on(table.code),
    officeTypeIdx: index('departments_office_type_idx').on(table.officeType),
    parentIdIdx: index('departments_parent_id_idx').on(table.parentId),
    parentCollegeIdIdx: index('departments_parent_college_id_idx').on(
      table.parentCollegeId
    ),
    isActiveIdx: index('departments_is_active_idx').on(table.isActive),
    // Composite indexes
    officeTypeIsActiveIdx: index('departments_office_type_is_active_idx').on(
      table.officeType,
      table.isActive
    ),
  })
);

export const positions = pgTable(
  'positions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    title: text('title').notNull(),
    gradeLevel: integer('grade_level'),
    departmentId: uuid('department_id'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    departmentIdIdx: index('positions_department_id_idx').on(
      table.departmentId
    ),
    gradeLevelIdx: index('positions_grade_level_idx').on(table.gradeLevel),
    isActiveIdx: index('positions_is_active_idx').on(table.isActive),
  })
);

// Job Application System Tables
export const openPositions = pgTable(
  'open_positions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    positionTitle: text('position_title').notNull(),
    positionCode: text('position_code').unique().notNull(),
    departmentId: uuid('department_id').references(() => departments.id),
    employmentCategory: employmentCategoryEnum('employment_category').notNull(),

    description: text('description').notNull(),
    qualifications: jsonb('qualifications').$type<string[]>().default([]),
    responsibilities: jsonb('responsibilities').$type<string[]>().default([]),
    requirements: jsonb('requirements')
      .$type<{
        education: string[];
        experience: string[];
        skills: string[];
      }>()
      .default({ education: [], experience: [], skills: [] }),

    salaryGrade: text('salary_grade'),
    salaryRangeMin: decimal('salary_range_min', { precision: 12, scale: 2 }),
    salaryRangeMax: decimal('salary_range_max', { precision: 12, scale: 2 }),
    employmentType: text('employment_type'),

    status: positionStatusEnum('status').default('open'),
    applicationDeadline: timestamp('application_deadline').notNull(),
    numberOfOpenings: integer('number_of_openings').default(1),
    applicationsReceived: integer('applications_received').default(0),

    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),

    postedBy: uuid('posted_by').references(() => profiles.id),
    postedAt: timestamp('posted_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    closedAt: timestamp('closed_at'),
  },
  (table) => ({
    positionCodeIdx: index('open_positions_position_code_idx').on(
      table.positionCode
    ),
    departmentIdIdx: index('open_positions_department_id_idx').on(
      table.departmentId
    ),
    employmentCategoryIdx: index('open_positions_employment_category_idx').on(
      table.employmentCategory
    ),
    statusIdx: index('open_positions_status_idx').on(table.status),
    applicationDeadlineIdx: index('open_positions_application_deadline_idx').on(
      table.applicationDeadline
    ),
    isActiveIdx: index('open_positions_is_active_idx').on(table.isActive),
    isFeaturedIdx: index('open_positions_is_featured_idx').on(table.isFeatured),
    postedByIdx: index('open_positions_posted_by_idx').on(table.postedBy),
    postedAtIdx: index('open_positions_posted_at_idx').on(table.postedAt),
    // Composite indexes for common queries
    statusIsActiveIdx: index('open_positions_status_is_active_idx').on(
      table.status,
      table.isActive
    ),
    statusDeadlineIdx: index('open_positions_status_deadline_idx').on(
      table.status,
      table.applicationDeadline
    ),
    employmentCategoryStatusIdx: index(
      'open_positions_employment_category_status_idx'
    ).on(table.employmentCategory, table.status),
    isFeaturedStatusIdx: index('open_positions_is_featured_status_idx').on(
      table.isFeatured,
      table.status
    ),
  })
);

export const jobApplications = pgTable(
  'job_applications',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    applicationNumber: text('application_number').unique().notNull(),

    applicantId: uuid('applicant_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    positionId: uuid('position_id')
      .notNull()
      .references(() => openPositions.id, { onDelete: 'restrict' }),

    pdsSubmissionId: uuid('pds_submission_id').references(
      () => pdsSubmissions.id
    ),
    coverLetter: text('cover_letter'),
    resumeUrl: text('resume_url'),
    additionalDocuments: jsonb('additional_documents')
      .$type<string[]>()
      .default([]),

    status: applicationStatusEnum('status').default('pending'),
    applicationDate: timestamp('application_date').defaultNow(),

    reviewedBy: uuid('reviewed_by').references(() => profiles.id),
    reviewedAt: timestamp('reviewed_at'),
    reviewerNotes: text('reviewer_notes'),

    interviewDate: timestamp('interview_date'),
    interviewLocation: text('interview_location'),
    interviewNotes: text('interview_notes'),

    finalDecision: text('final_decision'),
    decisionBy: uuid('decision_by').references(() => profiles.id),
    decisionAt: timestamp('decision_at'),
    rejectionReason: text('rejection_reason'),

    convertedToEmployeeId: text('converted_to_employee_id'),
    convertedHireDate: date('converted_hire_date'),
    conversionDate: timestamp('conversion_date'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    applicationNumberIdx: index('job_applications_application_number_idx').on(
      table.applicationNumber
    ),
    applicantIdIdx: index('job_applications_applicant_id_idx').on(
      table.applicantId
    ),
    positionIdIdx: index('job_applications_position_id_idx').on(
      table.positionId
    ),
    statusIdx: index('job_applications_status_idx').on(table.status),
    applicationDateIdx: index('job_applications_application_date_idx').on(
      table.applicationDate
    ),
    reviewedByIdx: index('job_applications_reviewed_by_idx').on(
      table.reviewedBy
    ),
    decisionByIdx: index('job_applications_decision_by_idx').on(
      table.decisionBy
    ),
    convertedToEmployeeIdIdx: index(
      'job_applications_converted_to_employee_id_idx'
    ).on(table.convertedToEmployeeId),
    createdAtIdx: index('job_applications_created_at_idx').on(table.createdAt),
    // Composite indexes for common queries
    applicantStatusIdx: index('job_applications_applicant_status_idx').on(
      table.applicantId,
      table.status
    ),
    positionStatusIdx: index('job_applications_position_status_idx').on(
      table.positionId,
      table.status
    ),
    statusApplicationDateIdx: index(
      'job_applications_status_application_date_idx'
    ).on(table.status, table.applicationDate),
    reviewedByStatusIdx: index('job_applications_reviewed_by_status_idx').on(
      table.reviewedBy,
      table.status
    ),
  })
);

export const applicationStatusHistory = pgTable(
  'application_status_history',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => jobApplications.id, { onDelete: 'cascade' }),

    previousStatus: applicationStatusEnum('previous_status'),
    newStatus: applicationStatusEnum('new_status').notNull(),

    changedBy: uuid('changed_by').references(() => profiles.id),
    changedAt: timestamp('changed_at').defaultNow(),
    notes: text('notes'),

    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    applicationIdIdx: index('application_status_history_application_id_idx').on(
      table.applicationId
    ),
    newStatusIdx: index('application_status_history_new_status_idx').on(
      table.newStatus
    ),
    changedByIdx: index('application_status_history_changed_by_idx').on(
      table.changedBy
    ),
    changedAtIdx: index('application_status_history_changed_at_idx').on(
      table.changedAt
    ),
    // Composite indexes for common queries
    applicationIdChangedAtIdx: index(
      'application_status_history_application_id_changed_at_idx'
    ).on(table.applicationId, table.changedAt),
    applicationIdNewStatusIdx: index(
      'application_status_history_application_id_new_status_idx'
    ).on(table.applicationId, table.newStatus),
  })
);

// PDS Tables (Personal Data Sheet - CSC Format)
export const pdsSubmissions = pgTable(
  'pds_submissions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(), // References Supabase auth.users.id
    version: integer('version').default(1).notNull(),
    status: submissionStatusEnum('status').default('draft').notNull(),
    submittedAt: timestamp('submitted_at'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'), // Reason for rejection if status is 'rejected'
    pdfFilePath: text('pdf_file_path'), // Supabase Storage path to generated PDF
    isLatest: boolean('is_latest').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('pds_submissions_user_id_idx').on(table.userId),
    statusIdx: index('pds_submissions_status_idx').on(table.status),
    isLatestIdx: index('pds_submissions_is_latest_idx').on(table.isLatest),
    submittedAtIdx: index('pds_submissions_submitted_at_idx').on(
      table.submittedAt
    ),
    approvedByIdx: index('pds_submissions_approved_by_idx').on(
      table.approvedBy
    ),
    createdAtIdx: index('pds_submissions_created_at_idx').on(table.createdAt),
    // Composite indexes for common queries
    userStatusIdx: index('pds_submissions_user_status_idx').on(
      table.userId,
      table.status
    ),
    userLatestIdx: index('pds_submissions_user_latest_idx').on(
      table.userId,
      table.isLatest
    ),
    statusSubmittedIdx: index('pds_submissions_status_submitted_idx').on(
      table.status,
      table.submittedAt
    ),
  })
);

export const pdsPersonalInfo = pgTable(
  'pds_personal_info',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    surname: text('surname').notNull(),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    nameExtension: text('name_extension'),
    dateOfBirth: date('date_of_birth').notNull(),
    placeOfBirth: text('place_of_birth').notNull(),
    sex: sexEnum('sex').notNull(),
    civilStatus: civilStatusEnum('civil_status').notNull(),
    heightM: decimal('height_m', { precision: 3, scale: 2 }),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    bloodType: text('blood_type'),
    gsisNo: text('gsis_no'),
    pagibigNo: text('pagibig_no'),
    philhealthNo: text('philhealth_no'),
    sssNo: text('sss_no'),
    tinNo: text('tin_no'),
    agencyEmployeeNo: text('agency_employee_no'),
    citizenship: jsonb('citizenship'), // {type: 'Filipino' | 'Dual', details: {...}}
    residentialAddress: jsonb('residential_address'), // {street, city, province, zipCode}
    permanentAddress: jsonb('permanent_address'),
    telephoneNo: text('telephone_no'),
    mobileNo: text('mobile_no'),
    emailAddress: text('email_address'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_personal_info_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsFamilyBackground = pgTable(
  'pds_family_background',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    spouseSurname: text('spouse_surname'),
    spouseFirstName: text('spouse_first_name'),
    spouseMiddleName: text('spouse_middle_name'),
    spouseNameExtension: text('spouse_name_extension'),
    spouseOccupation: text('spouse_occupation'),
    spouseEmployer: text('spouse_employer'),
    spouseBusinessAddress: text('spouse_business_address'),
    spouseTelephoneNo: text('spouse_telephone_no'),
    fatherSurname: text('father_surname'),
    fatherFirstName: text('father_first_name'),
    fatherMiddleName: text('father_middle_name'),
    motherMaidenSurname: text('mother_maiden_surname'),
    motherFirstName: text('mother_first_name'),
    motherMiddleName: text('mother_middle_name'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_family_background_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsChildren = pgTable(
  'pds_children',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    fullName: text('full_name').notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_children_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsEducation = pgTable(
  'pds_education',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    level: educationLevelEnum('level').notNull(),
    schoolName: text('school_name').notNull(),
    degreeCourse: text('degree_course'),
    periodFrom: date('period_from'),
    periodTo: date('period_to'),
    highestLevelEarned: text('highest_level_earned'),
    yearGraduated: integer('year_graduated'),
    honorsReceived: text('honors_received'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_education_submission_id_idx').on(
      table.pdsSubmissionId
    ),
    levelIdx: index('pds_education_level_idx').on(table.level),
  })
);

export const pdsCivilService = pgTable(
  'pds_civil_service',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    eligibilityName: text('eligibility_name').notNull(),
    rating: decimal('rating', { precision: 5, scale: 2 }),
    dateOfExam: date('date_of_exam'),
    placeOfExam: text('place_of_exam'),
    licenseNo: text('license_no'),
    licenseValidityDate: date('license_validity_date'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_civil_service_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsWorkExperience = pgTable(
  'pds_work_experience',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    positionTitle: text('position_title').notNull(),
    departmentAgency: text('department_agency').notNull(),
    monthlySalary: decimal('monthly_salary', { precision: 12, scale: 2 }),
    salaryGrade: text('salary_grade'),
    statusOfAppointment: text('status_of_appointment'),
    isGovernment: boolean('is_government').default(true).notNull(),
    dateFrom: date('date_from').notNull(),
    dateTo: date('date_to'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_work_experience_submission_id_idx').on(
      table.pdsSubmissionId
    ),
    isGovernmentIdx: index('pds_work_experience_is_government_idx').on(
      table.isGovernment
    ),
  })
);

export const pdsVoluntaryWork = pgTable(
  'pds_voluntary_work',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    organizationName: text('organization_name').notNull(),
    organizationAddress: text('organization_address'),
    dateFrom: date('date_from').notNull(),
    dateTo: date('date_to'),
    numberOfHours: integer('number_of_hours'),
    positionNature: text('position_nature'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_voluntary_work_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsTraining = pgTable(
  'pds_training',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    title: text('title').notNull(),
    dateFrom: date('date_from').notNull(),
    dateTo: date('date_to').notNull(),
    hours: integer('hours'),
    typeOfLd: text('type_of_ld'), // Learning and Development
    conductedBy: text('conducted_by'),
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_training_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

export const pdsOtherInfo = pgTable(
  'pds_other_info',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    pdsSubmissionId: uuid('pds_submission_id').notNull(),
    skills: jsonb('skills'), // Array of skills
    recognitions: jsonb('recognitions'), // Array of recognitions
    associations: jsonb('associations'), // Array of organization memberships
    questions: jsonb('questions'), // Q34-Q40 answers
    references: jsonb('references'), // Character references
  },
  (table) => ({
    pdsSubmissionIdIdx: index('pds_other_info_submission_id_idx').on(
      table.pdsSubmissionId
    ),
  })
);

// SALN Tables (Statement of Assets, Liabilities, Net Worth)
export const salnSubmissions = pgTable(
  'saln_submissions',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(), // References Supabase auth.users.id
    year: integer('year').notNull(),
    status: submissionStatusEnum('status').default('draft').notNull(),
    totalAssets: decimal('total_assets', { precision: 15, scale: 2 }).default(
      '0'
    ),
    totalLiabilities: decimal('total_liabilities', {
      precision: 15,
      scale: 2,
    }).default('0'),
    netWorth: decimal('net_worth', { precision: 15, scale: 2 }).default('0'), // Computed field
    submittedAt: timestamp('submitted_at'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'), // Reason for rejection if status is 'rejected'
    pdfFilePath: text('pdf_file_path'), // Supabase Storage path to generated PDF
    filingType: filingTypeEnum('filing_type').default('separate').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('saln_submissions_user_id_idx').on(table.userId),
    yearIdx: index('saln_submissions_year_idx').on(table.year),
    statusIdx: index('saln_submissions_status_idx').on(table.status),
    submittedAtIdx: index('saln_submissions_submitted_at_idx').on(
      table.submittedAt
    ),
    approvedByIdx: index('saln_submissions_approved_by_idx').on(
      table.approvedBy
    ),
    createdAtIdx: index('saln_submissions_created_at_idx').on(table.createdAt),
    // Composite indexes for common queries
    userYearIdx: index('saln_submissions_user_year_idx').on(
      table.userId,
      table.year
    ),
    userStatusIdx: index('saln_submissions_user_status_idx').on(
      table.userId,
      table.status
    ),
    statusSubmittedIdx: index('saln_submissions_status_submitted_idx').on(
      table.status,
      table.submittedAt
    ),
    yearStatusIdx: index('saln_submissions_year_status_idx').on(
      table.year,
      table.status
    ),
  })
);

export const salnRealProperties = pgTable(
  'saln_real_properties',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    salnSubmissionId: uuid('saln_submission_id').notNull(),
    description: text('description').notNull(),
    kind: propertyKindEnum('kind').notNull(),
    exactLocation: text('exact_location').notNull(),
    assessedValue: decimal('assessed_value', {
      precision: 15,
      scale: 2,
    }).notNull(),
    currentFairMarketValue: decimal('current_fair_market_value', {
      precision: 15,
      scale: 2,
    }).notNull(),
    acquisitionYear: integer('acquisition_year').notNull(),
    acquisitionMode: text('acquisition_mode').notNull(),
    acquisitionCost: decimal('acquisition_cost', {
      precision: 15,
      scale: 2,
    }).notNull(),
  },
  (table) => ({
    salnSubmissionIdIdx: index('saln_real_properties_submission_id_idx').on(
      table.salnSubmissionId
    ),
    kindIdx: index('saln_real_properties_kind_idx').on(table.kind),
  })
);

export const salnPersonalProperties = pgTable(
  'saln_personal_properties',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    salnSubmissionId: uuid('saln_submission_id').notNull(),
    description: text('description').notNull(),
    yearAcquired: integer('year_acquired').notNull(),
    acquisitionCost: decimal('acquisition_cost', {
      precision: 15,
      scale: 2,
    }).notNull(),
  },
  (table) => ({
    salnSubmissionIdIdx: index('saln_personal_properties_submission_id_idx').on(
      table.salnSubmissionId
    ),
  })
);

export const salnLiabilities = pgTable(
  'saln_liabilities',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    salnSubmissionId: uuid('saln_submission_id').notNull(),
    nature: text('nature').notNull(),
    creditorName: text('creditor_name').notNull(),
    outstandingBalance: decimal('outstanding_balance', {
      precision: 15,
      scale: 2,
    }).notNull(),
  },
  (table) => ({
    salnSubmissionIdIdx: index('saln_liabilities_submission_id_idx').on(
      table.salnSubmissionId
    ),
  })
);

export const salnBusinessInterests = pgTable(
  'saln_business_interests',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    salnSubmissionId: uuid('saln_submission_id').notNull(),
    entityName: text('entity_name').notNull(),
    businessAddress: text('business_address').notNull(),
    natureOfBusiness: text('nature_of_business').notNull(),
    dateOfAcquisition: date('date_of_acquisition').notNull(),
  },
  (table) => ({
    salnSubmissionIdIdx: index('saln_business_interests_submission_id_idx').on(
      table.salnSubmissionId
    ),
  })
);

export const salnRelativesInGov = pgTable(
  'saln_relatives_in_gov',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    salnSubmissionId: uuid('saln_submission_id').notNull(),
    name: text('name').notNull(),
    relationship: text('relationship').notNull(),
    position: text('position').notNull(),
    agencyAddress: text('agency_address').notNull(),
  },
  (table) => ({
    salnSubmissionIdIdx: index('saln_relatives_in_gov_submission_id_idx').on(
      table.salnSubmissionId
    ),
  })
);

// Administrative Tables
export const submissionDeadlines = pgTable(
  'submission_deadlines',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    formType: formTypeEnum('form_type').notNull(),
    year: integer('year').notNull(),
    deadlineDate: date('deadline_date').notNull(),
    reminderDaysBefore: integer('reminder_days_before')
      .array()
      .default([30, 15, 7, 3, 1]),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    formTypeIdx: index('submission_deadlines_form_type_idx').on(table.formType),
    yearIdx: index('submission_deadlines_year_idx').on(table.year),
    deadlineDateIdx: index('submission_deadlines_deadline_date_idx').on(
      table.deadlineDate
    ),
    isActiveIdx: index('submission_deadlines_is_active_idx').on(table.isActive),
    // Composite index for common deadline queries
    formTypeYearIdx: index('submission_deadlines_form_type_year_idx').on(
      table.formType,
      table.year
    ),
  })
);

export const approvalWorkflows = pgTable(
  'approval_workflows',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    submissionId: uuid('submission_id').notNull(),
    submissionType: formTypeEnum('submission_type').notNull(),
    approverId: uuid('approver_id').notNull(),
    approvalLevel: integer('approval_level').default(1).notNull(),
    status: approvalStatusEnum('status').default('pending').notNull(),
    comments: text('comments'),
    actionDate: timestamp('action_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    submissionIdIdx: index('approval_workflows_submission_id_idx').on(
      table.submissionId
    ),
    approverIdIdx: index('approval_workflows_approver_id_idx').on(
      table.approverId
    ),
    statusIdx: index('approval_workflows_status_idx').on(table.status),
    submissionTypeIdx: index('approval_workflows_submission_type_idx').on(
      table.submissionType
    ),
    // Composite indexes for workflow queries
    approverStatusIdx: index('approval_workflows_approver_status_idx').on(
      table.approverId,
      table.status
    ),
    submissionTypeStatusIdx: index(
      'approval_workflows_submission_type_status_idx'
    ).on(table.submissionType, table.status),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(), // References Supabase auth.users.id
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    changes: jsonb('changes'), // Before/after changes
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    entityTypeIdx: index('audit_logs_entity_type_idx').on(table.entityType),
    entityIdIdx: index('audit_logs_entity_id_idx').on(table.entityId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    // Composite indexes for audit queries
    userCreatedAtIdx: index('audit_logs_user_created_at_idx').on(
      table.userId,
      table.createdAt
    ),
    entityTypeEntityIdIdx: index('audit_logs_entity_type_entity_id_idx').on(
      table.entityType,
      table.entityId
    ),
  })
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(), // References Supabase auth.users.id
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    readAt: timestamp('read_at'),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    typeIdx: index('notifications_type_idx').on(table.type),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
    // Composite indexes for notification queries
    userIsReadIdx: index('notifications_user_is_read_idx').on(
      table.userId,
      table.isRead
    ),
    userCreatedAtIdx: index('notifications_user_created_at_idx').on(
      table.userId,
      table.createdAt
    ),
  })
);

export const archives = pgTable(
  'archives',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    originalTable: text('original_table').notNull(),
    originalId: uuid('original_id').notNull(),
    data: jsonb('data').notNull(), // Complete record data
    archivedAt: timestamp('archived_at').defaultNow().notNull(),
    archivedBy: uuid('archived_by').notNull(), // References Supabase auth.users.id
  },
  (table) => ({
    originalTableIdx: index('archives_original_table_idx').on(
      table.originalTable
    ),
    originalIdIdx: index('archives_original_id_idx').on(table.originalId),
    archivedByIdx: index('archives_archived_by_idx').on(table.archivedBy),
    archivedAtIdx: index('archives_archived_at_idx').on(table.archivedAt),
    // Composite index for finding archived records
    originalTableIdIdx: index('archives_original_table_id_idx').on(
      table.originalTable,
      table.originalId
    ),
  })
);

// Auth System Tables

// OTP Verifications table - for email verification and login challenges
export const otpVerifications = pgTable(
  'otp_verifications',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(),
    code: text('code').notNull(), // 6-digit code
    type: otpTypeEnum('type').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('otp_verifications_user_id_idx').on(table.userId),
    expiresAtIdx: index('otp_verifications_expires_at_idx').on(table.expiresAt),
    typeIdx: index('otp_verifications_type_idx').on(table.type),
    userTypeIdx: index('otp_verifications_user_type_idx').on(
      table.userId,
      table.type
    ),
  })
);

// Pending Registrations table - admin approval queue
export const pendingRegistrations = pgTable(
  'pending_registrations',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull().unique(),
    status: approvalStatusEnum('status').default('pending').notNull(),
    adminNotes: text('admin_notes'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('pending_registrations_user_id_idx').on(table.userId),
    statusIdx: index('pending_registrations_status_idx').on(table.status),
    createdAtIdx: index('pending_registrations_created_at_idx').on(
      table.createdAt
    ),
  })
);

// Trusted Devices table - 30-day device trust
export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id').notNull(),
    deviceFingerprint: text('device_fingerprint').notNull(), // Hash of IP + User-Agent
    browserInfo: text('browser_info'), // User-Agent string
    ipAddress: inet('ip_address'),
    trustedAt: timestamp('trusted_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('trusted_devices_user_id_idx').on(table.userId),
    deviceFingerprintIdx: index('trusted_devices_device_fingerprint_idx').on(
      table.deviceFingerprint
    ),
    expiresAtIdx: index('trusted_devices_expires_at_idx').on(table.expiresAt),
    userDeviceIdx: index('trusted_devices_user_device_idx').on(
      table.userId,
      table.deviceFingerprint
    ),
  })
);

// Employee ID Registry table - prevent collisions
export const employeeIdRegistry = pgTable(
  'employee_id_registry',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    employeeId: text('employee_id').unique().notNull(),
    userId: uuid('user_id').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    employeeIdIdx: index('employee_id_registry_employee_id_idx').on(
      table.employeeId
    ),
    userIdIdx: index('employee_id_registry_user_id_idx').on(table.userId),
  })
);

// User Preferences table - admin portal settings
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Notification preferences
    emailNotificationsEnabled: boolean('email_notifications_enabled').default(
      true
    ),
    emailDigestFrequency: emailDigestFrequencyEnum('email_digest_frequency')
      .default('daily')
      .notNull(),

    // UI preferences
    theme: themeEnum('theme').default('system').notNull(),
    dashboardLayout: dashboardLayoutEnum('dashboard_layout')
      .default('default')
      .notNull(),
    language: languageEnum('language').default('en').notNull(),
    timezone: text('timezone').default('Asia/Manila').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_preferences_user_id_idx').on(table.userId),
  })
);

// Relations
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  department: one(departments, {
    fields: [profiles.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [profiles.positionId],
    references: [positions.id],
  }),
  pdsSubmissions: many(pdsSubmissions),
  salnSubmissions: many(salnSubmissions),
  notifications: many(notifications),
  // Job application relations
  jobApplications: many(jobApplications),
  postedPositions: many(openPositions),
  reviewedApplications: many(jobApplications, {
    relationName: 'reviewer',
  }),
  decidedApplications: many(jobApplications, {
    relationName: 'decision_maker',
  }),
  statusChanges: many(applicationStatusHistory),
  // User preferences
  userPreferences: one(userPreferences, {
    fields: [profiles.id],
    references: [userPreferences.userId],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(profiles, {
      fields: [userPreferences.userId],
      references: [profiles.id],
    }),
  })
);

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
    relationName: 'parent_child',
  }),
  parentCollege: one(departments, {
    fields: [departments.parentCollegeId],
    references: [departments.id],
    relationName: 'college_department',
  }),
  children: many(departments, { relationName: 'parent_child' }),
  departmentsInCollege: many(departments, {
    relationName: 'college_department',
  }),
  profiles: many(profiles),
  positions: many(positions),
  openPositions: many(openPositions),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  profiles: many(profiles),
}));

export const pdsSubmissionsRelations = relations(
  pdsSubmissions,
  ({ one, many }) => ({
    user: one(profiles, {
      fields: [pdsSubmissions.userId],
      references: [profiles.id],
    }),
    personalInfo: one(pdsPersonalInfo, {
      fields: [pdsSubmissions.id],
      references: [pdsPersonalInfo.pdsSubmissionId],
    }),
    familyBackground: one(pdsFamilyBackground, {
      fields: [pdsSubmissions.id],
      references: [pdsFamilyBackground.pdsSubmissionId],
    }),
    children: many(pdsChildren),
    education: many(pdsEducation),
    civilService: many(pdsCivilService),
    workExperience: many(pdsWorkExperience),
    voluntaryWork: many(pdsVoluntaryWork),
    training: many(pdsTraining),
    otherInfo: one(pdsOtherInfo, {
      fields: [pdsSubmissions.id],
      references: [pdsOtherInfo.pdsSubmissionId],
    }),
  })
);

export const salnSubmissionsRelations = relations(
  salnSubmissions,
  ({ one, many }) => ({
    user: one(profiles, {
      fields: [salnSubmissions.userId],
      references: [profiles.id],
    }),
    realProperties: many(salnRealProperties),
    personalProperties: many(salnPersonalProperties),
    liabilities: many(salnLiabilities),
    businessInterests: many(salnBusinessInterests),
    relativesInGov: many(salnRelativesInGov),
  })
);

// Job Application System Relations
export const openPositionsRelations = relations(
  openPositions,
  ({ one, many }) => ({
    department: one(departments, {
      fields: [openPositions.departmentId],
      references: [departments.id],
    }),
    postedBy: one(profiles, {
      fields: [openPositions.postedBy],
      references: [profiles.id],
    }),
    applications: many(jobApplications),
  })
);

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one, many }) => ({
    applicant: one(profiles, {
      fields: [jobApplications.applicantId],
      references: [profiles.id],
    }),
    position: one(openPositions, {
      fields: [jobApplications.positionId],
      references: [openPositions.id],
    }),
    pdsSubmission: one(pdsSubmissions, {
      fields: [jobApplications.pdsSubmissionId],
      references: [pdsSubmissions.id],
    }),
    reviewedBy: one(profiles, {
      fields: [jobApplications.reviewedBy],
      references: [profiles.id],
      relationName: 'reviewer',
    }),
    decisionBy: one(profiles, {
      fields: [jobApplications.decisionBy],
      references: [profiles.id],
      relationName: 'decision_maker',
    }),
    statusHistory: many(applicationStatusHistory),
  })
);

export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(jobApplications, {
      fields: [applicationStatusHistory.applicationId],
      references: [jobApplications.id],
    }),
    changedBy: one(profiles, {
      fields: [applicationStatusHistory.changedBy],
      references: [profiles.id],
    }),
  })
);

// Export all tables for drizzle-kit
export const schema = {
  profiles,
  departments,
  positions,
  // Job application system tables
  openPositions,
  jobApplications,
  applicationStatusHistory,
  // PDS tables
  pdsSubmissions,
  pdsPersonalInfo,
  pdsFamilyBackground,
  pdsChildren,
  pdsEducation,
  pdsCivilService,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsTraining,
  pdsOtherInfo,
  // SALN tables
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
  // Administrative tables
  submissionDeadlines,
  approvalWorkflows,
  auditLogs,
  notifications,
  archives,
  // Auth system tables
  otpVerifications,
  pendingRegistrations,
  trustedDevices,
  employeeIdRegistry,
  // User preferences
  userPreferences,
};
