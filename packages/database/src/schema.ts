import {
  boolean,
  date,
  decimal,
  inet,
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

// Core User Management Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References Supabase auth.users.id
  employeeId: text('employee_id').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  role: roleEnum('role').default('employee').notNull(),
  departmentId: uuid('department_id'),
  positionId: uuid('position_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const positions = pgTable('positions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  title: text('title').notNull(),
  gradeLevel: integer('grade_level'),
  departmentId: uuid('department_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// PDS Tables (Personal Data Sheet - CSC Format)
export const pdsSubmissions = pgTable('pds_submissions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  userId: uuid('user_id').notNull(), // References Supabase auth.users.id
  version: integer('version').default(1).notNull(),
  status: submissionStatusEnum('status').default('draft').notNull(),
  submittedAt: timestamp('submitted_at'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  isLatest: boolean('is_latest').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pdsPersonalInfo = pgTable('pds_personal_info', {
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
});

export const pdsFamilyBackground = pgTable('pds_family_background', {
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
});

export const pdsChildren = pgTable('pds_children', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  pdsSubmissionId: uuid('pds_submission_id').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
});

export const pdsEducation = pgTable('pds_education', {
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
});

export const pdsCivilService = pgTable('pds_civil_service', {
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
});

export const pdsWorkExperience = pgTable('pds_work_experience', {
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
});

export const pdsVoluntaryWork = pgTable('pds_voluntary_work', {
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
});

export const pdsTraining = pgTable('pds_training', {
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
});

export const pdsOtherInfo = pgTable('pds_other_info', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  pdsSubmissionId: uuid('pds_submission_id').notNull(),
  skills: jsonb('skills'), // Array of skills
  recognitions: jsonb('recognitions'), // Array of recognitions
  associations: jsonb('associations'), // Array of organization memberships
  questions: jsonb('questions'), // Q34-Q40 answers
  references: jsonb('references'), // Character references
});

// SALN Tables (Statement of Assets, Liabilities, Net Worth)
export const salnSubmissions = pgTable('saln_submissions', {
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
  filingType: filingTypeEnum('filing_type').default('separate').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const salnRealProperties = pgTable('saln_real_properties', {
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
});

export const salnPersonalProperties = pgTable('saln_personal_properties', {
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
});

export const salnLiabilities = pgTable('saln_liabilities', {
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
});

export const salnBusinessInterests = pgTable('saln_business_interests', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  salnSubmissionId: uuid('saln_submission_id').notNull(),
  entityName: text('entity_name').notNull(),
  businessAddress: text('business_address').notNull(),
  natureOfBusiness: text('nature_of_business').notNull(),
  dateOfAcquisition: date('date_of_acquisition').notNull(),
});

export const salnRelativesInGov = pgTable('saln_relatives_in_gov', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  salnSubmissionId: uuid('saln_submission_id').notNull(),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  position: text('position').notNull(),
  agencyAddress: text('agency_address').notNull(),
});

// Administrative Tables
export const submissionDeadlines = pgTable('submission_deadlines', {
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
});

export const approvalWorkflows = pgTable('approval_workflows', {
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
});

export const auditLogs = pgTable('audit_logs', {
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
});

export const notifications = pgTable('notifications', {
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
});

export const archives = pgTable('archives', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => v7()),
  originalTable: text('original_table').notNull(),
  originalId: uuid('original_id').notNull(),
  data: jsonb('data').notNull(), // Complete record data
  archivedAt: timestamp('archived_at').defaultNow().notNull(),
  archivedBy: uuid('archived_by').notNull(), // References Supabase auth.users.id
});

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
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, {
    fields: [departments.parentId],
    references: [departments.id],
  }),
  children: many(departments),
  profiles: many(profiles),
  positions: many(positions),
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

// Export all tables for drizzle-kit
export const schema = {
  profiles,
  departments,
  positions,
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
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
  submissionDeadlines,
  approvalWorkflows,
  auditLogs,
  notifications,
  archives,
};
