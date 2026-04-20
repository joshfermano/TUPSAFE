import { pgTable, index, uuid, text, jsonb, timestamp, inet, foreignKey, unique, date, boolean, numeric, integer, check, pgPolicy, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountStatus = pgEnum("account_status", ['pending', 'active', 'suspended', 'rejected'])
export const applicationStatus = pgEnum("application_status", ['pending', 'under_review', 'shortlisted', 'for_interview', 'interviewed', 'for_final_review', 'accepted', 'rejected', 'withdrawn', 'hired'])
export const approvalStatus = pgEnum("approval_status", ['pending', 'approved', 'rejected'])
export const civilStatus = pgEnum("civil_status", ['single', 'married', 'widowed', 'separated', 'divorced'])
export const dashboardLayout = pgEnum("dashboard_layout", ['default', 'compact', 'detailed'])
export const educationLevel = pgEnum("education_level", ['elementary', 'secondary', 'vocational', 'college', 'graduate'])
export const emailDigestFrequency = pgEnum("email_digest_frequency", ['realtime', 'daily', 'weekly', 'never'])
export const employmentCategory = pgEnum("employment_category", ['faculty', 'administrative', 'contractual', 'not_applicable'])
export const filingType = pgEnum("filing_type", ['joint', 'separate', 'not_applicable'])
export const formType = pgEnum("form_type", ['pds', 'saln'])
export const language = pgEnum("language", ['en', 'fil'])
export const notificationType = pgEnum("notification_type", ['deadline_reminder', 'submission_status', 'approval_required', 'system_update'])
export const officeType = pgEnum("office_type", ['academic', 'administrative'])
export const otpType = pgEnum("otp_type", ['email_verification', 'login_challenge', 'password_reset'])
export const positionStatus = pgEnum("position_status", ['open', 'closed', 'filled', 'cancelled'])
export const propertyKind = pgEnum("property_kind", ['residential', 'commercial', 'industrial', 'agricultural', 'mixed'])
export const role = pgEnum("role", ['employee', 'hr', 'admin', 'co_admin', 'supervisor', 'auditor'])
export const sex = pgEnum("sex", ['male', 'female'])
export const submissionStatus = pgEnum("submission_status", ['draft', 'submitted', 'reviewing', 'approved', 'rejected'])
export const theme = pgEnum("theme", ['light', 'dark', 'system'])
export const userType = pgEnum("user_type", ['employee', 'applicant'])


export const archives = pgTable("archives", {
	id: uuid().primaryKey().notNull(),
	originalTable: text("original_table").notNull(),
	originalId: uuid("original_id").notNull(),
	data: jsonb().notNull(),
	archivedAt: timestamp("archived_at", { mode: 'string' }).defaultNow().notNull(),
	archivedBy: uuid("archived_by").notNull(),
}, (table) => [
	index("archives_archived_at_idx").using("btree", table.archivedAt.asc().nullsLast().op("timestamp_ops")),
	index("archives_archived_by_idx").using("btree", table.archivedBy.asc().nullsLast().op("uuid_ops")),
	index("archives_original_id_idx").using("btree", table.originalId.asc().nullsLast().op("uuid_ops")),
	index("archives_original_table_id_idx").using("btree", table.originalTable.asc().nullsLast().op("text_ops"), table.originalId.asc().nullsLast().op("uuid_ops")),
	index("archives_original_table_idx").using("btree", table.originalTable.asc().nullsLast().op("text_ops")),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id"),
	changes: jsonb(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("audit_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_logs_entity_id_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("audit_logs_entity_type_entity_id_idx").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("audit_logs_entity_type_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops")),
	index("audit_logs_user_created_at_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_entity_created").using("btree", table.entityType.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_audit_logs_recent").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
]);

export const jobApplications = pgTable("job_applications", {
	id: uuid().primaryKey().notNull(),
	applicationNumber: text("application_number").notNull(),
	applicantId: uuid("applicant_id").notNull(),
	positionId: uuid("position_id").notNull(),
	pdsSubmissionId: uuid("pds_submission_id"),
	coverLetter: text("cover_letter"),
	resumeUrl: text("resume_url"),
	additionalDocuments: jsonb("additional_documents").default([]),
	status: applicationStatus().default('pending'),
	applicationDate: timestamp("application_date", { mode: 'string' }).defaultNow(),
	reviewedBy: uuid("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewerNotes: text("reviewer_notes"),
	interviewDate: timestamp("interview_date", { mode: 'string' }),
	interviewLocation: text("interview_location"),
	interviewNotes: text("interview_notes"),
	finalDecision: text("final_decision"),
	decisionBy: uuid("decision_by"),
	decisionAt: timestamp("decision_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	convertedToEmployeeId: text("converted_to_employee_id"),
	convertedHireDate: date("converted_hire_date"),
	conversionDate: timestamp("conversion_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_job_applications_applicant_timeline").using("btree", table.applicantId.asc().nullsLast().op("timestamp_ops"), table.applicationDate.desc().nullsFirst().op("timestamp_ops")),
	index("job_applications_applicant_id_idx").using("btree", table.applicantId.asc().nullsLast().op("uuid_ops")),
	index("job_applications_applicant_status_idx").using("btree", table.applicantId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("job_applications_application_date_idx").using("btree", table.applicationDate.asc().nullsLast().op("timestamp_ops")),
	index("job_applications_application_number_idx").using("btree", table.applicationNumber.asc().nullsLast().op("text_ops")),
	index("job_applications_converted_to_employee_id_idx").using("btree", table.convertedToEmployeeId.asc().nullsLast().op("text_ops")),
	index("job_applications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("job_applications_decision_by_idx").using("btree", table.decisionBy.asc().nullsLast().op("uuid_ops")),
	index("job_applications_position_id_idx").using("btree", table.positionId.asc().nullsLast().op("uuid_ops")),
	index("job_applications_position_status_idx").using("btree", table.positionId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("job_applications_reviewed_by_idx").using("btree", table.reviewedBy.asc().nullsLast().op("uuid_ops")),
	index("job_applications_reviewed_by_status_idx").using("btree", table.reviewedBy.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("job_applications_status_application_date_idx").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.applicationDate.asc().nullsLast().op("enum_ops")),
	index("job_applications_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.applicantId],
			foreignColumns: [profiles.id],
			name: "job_applications_applicant_id_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.decisionBy],
			foreignColumns: [profiles.id],
			name: "job_applications_decision_by_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.pdsSubmissionId],
			foreignColumns: [pdsSubmissions.id],
			name: "job_applications_pds_submission_id_pds_submissions_id_fk"
		}),
	foreignKey({
			columns: [table.positionId],
			foreignColumns: [openPositions.id],
			name: "job_applications_position_id_open_positions_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [profiles.id],
			name: "job_applications_reviewed_by_profiles_id_fk"
		}),
	unique("job_applications_application_number_unique").on(table.applicationNumber),
]);

export const departments = pgTable("departments", {
	id: uuid().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	parentId: uuid("parent_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	officeType: officeType("office_type").default('academic'),
	parentCollegeId: uuid("parent_college_id"),
}, (table) => [
	index("departments_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("departments_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("departments_office_type_idx").using("btree", table.officeType.asc().nullsLast().op("enum_ops")),
	index("departments_office_type_is_active_idx").using("btree", table.officeType.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("enum_ops")),
	index("departments_parent_college_id_idx").using("btree", table.parentCollegeId.asc().nullsLast().op("uuid_ops")),
	index("departments_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.parentCollegeId],
			foreignColumns: [table.id],
			name: "departments_parent_college_id_departments_id_fk"
		}),
	unique("departments_code_unique").on(table.code),
]);

export const employeeIdRegistry = pgTable("employee_id_registry", {
	id: uuid().primaryKey().notNull(),
	employeeId: text("employee_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("employee_id_registry_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("employee_id_registry_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("employee_id_registry_employee_id_unique").on(table.employeeId),
	unique("employee_id_registry_user_id_unique").on(table.userId),
]);

export const notifications = pgTable("notifications", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
}, (table) => [
	index("idx_notifications_unread").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")).where(sql`(is_read = false)`),
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("notifications_user_created_at_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("notifications_user_is_read_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.isRead.asc().nullsLast().op("uuid_ops")),
]);

export const openPositions = pgTable("open_positions", {
	id: uuid().primaryKey().notNull(),
	positionTitle: text("position_title").notNull(),
	positionCode: text("position_code").notNull(),
	departmentId: uuid("department_id"),
	employmentCategory: employmentCategory("employment_category").notNull(),
	description: text().notNull(),
	qualifications: jsonb().default([]),
	responsibilities: jsonb().default([]),
	requirements: jsonb().default({"skills":[],"education":[],"experience":[]}),
	salaryGrade: text("salary_grade"),
	salaryRangeMin: numeric("salary_range_min", { precision: 12, scale:  2 }),
	salaryRangeMax: numeric("salary_range_max", { precision: 12, scale:  2 }),
	employmentType: text("employment_type"),
	status: positionStatus().default('open'),
	applicationDeadline: timestamp("application_deadline", { mode: 'string' }).notNull(),
	numberOfOpenings: integer("number_of_openings").default(1),
	applicationsReceived: integer("applications_received").default(0),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	postedBy: uuid("posted_by"),
	postedAt: timestamp("posted_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
}, (table) => [
	index("idx_open_positions_active_browsing").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.isFeatured.desc().nullsFirst().op("timestamp_ops"), table.postedAt.desc().nullsFirst().op("bool_ops")).where(sql`(is_active = true)`),
	index("open_positions_application_deadline_idx").using("btree", table.applicationDeadline.asc().nullsLast().op("timestamp_ops")),
	index("open_positions_department_id_idx").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("open_positions_employment_category_idx").using("btree", table.employmentCategory.asc().nullsLast().op("enum_ops")),
	index("open_positions_employment_category_status_idx").using("btree", table.employmentCategory.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("open_positions_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("open_positions_is_featured_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("open_positions_is_featured_status_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops"), table.status.asc().nullsLast().op("bool_ops")),
	index("open_positions_position_code_idx").using("btree", table.positionCode.asc().nullsLast().op("text_ops")),
	index("open_positions_posted_at_idx").using("btree", table.postedAt.asc().nullsLast().op("timestamp_ops")),
	index("open_positions_posted_by_idx").using("btree", table.postedBy.asc().nullsLast().op("uuid_ops")),
	index("open_positions_status_deadline_idx").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.applicationDeadline.asc().nullsLast().op("enum_ops")),
	index("open_positions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("open_positions_status_is_active_idx").using("btree", table.status.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "open_positions_department_id_departments_id_fk"
		}),
	foreignKey({
			columns: [table.postedBy],
			foreignColumns: [profiles.id],
			name: "open_positions_posted_by_profiles_id_fk"
		}),
	unique("open_positions_position_code_unique").on(table.positionCode),
]);

export const salnPersonalProperties = pgTable("saln_personal_properties", {
	id: uuid().primaryKey().notNull(),
	salnSubmissionId: uuid("saln_submission_id").notNull(),
	description: text().notNull(),
	yearAcquired: integer("year_acquired").notNull(),
	acquisitionCost: numeric("acquisition_cost", { precision: 15, scale:  2 }).notNull(),
}, (table) => [
	index("saln_personal_properties_submission_id_idx").using("btree", table.salnSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const salnRealProperties = pgTable("saln_real_properties", {
	id: uuid().primaryKey().notNull(),
	salnSubmissionId: uuid("saln_submission_id").notNull(),
	description: text().notNull(),
	kind: propertyKind().notNull(),
	exactLocation: text("exact_location").notNull(),
	assessedValue: numeric("assessed_value", { precision: 15, scale:  2 }).notNull(),
	currentFairMarketValue: numeric("current_fair_market_value", { precision: 15, scale:  2 }).notNull(),
	acquisitionYear: integer("acquisition_year").notNull(),
	acquisitionMode: text("acquisition_mode").notNull(),
	acquisitionCost: numeric("acquisition_cost", { precision: 15, scale:  2 }).notNull(),
}, (table) => [
	index("saln_real_properties_kind_idx").using("btree", table.kind.asc().nullsLast().op("enum_ops")),
	index("saln_real_properties_submission_id_idx").using("btree", table.salnSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const approvalWorkflows = pgTable("approval_workflows", {
	id: uuid().primaryKey().notNull(),
	submissionId: uuid("submission_id").notNull(),
	submissionType: formType("submission_type").notNull(),
	approverId: uuid("approver_id").notNull(),
	approvalLevel: integer("approval_level").default(1).notNull(),
	status: approvalStatus().default('pending').notNull(),
	comments: text(),
	actionDate: timestamp("action_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("approval_workflows_approver_id_idx").using("btree", table.approverId.asc().nullsLast().op("uuid_ops")),
	index("approval_workflows_approver_status_idx").using("btree", table.approverId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("approval_workflows_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("approval_workflows_submission_id_idx").using("btree", table.submissionId.asc().nullsLast().op("uuid_ops")),
	index("approval_workflows_submission_type_idx").using("btree", table.submissionType.asc().nullsLast().op("enum_ops")),
	index("approval_workflows_submission_type_status_idx").using("btree", table.submissionType.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("idx_approval_workflows_pending").using("btree", table.approverId.asc().nullsLast().op("uuid_ops"), table.submissionType.asc().nullsLast().op("uuid_ops")).where(sql`(status = 'pending'::approval_status)`),
]);

export const otpVerifications = pgTable("otp_verifications", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	code: text().notNull(),
	type: otpType().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("otp_verifications_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("otp_verifications_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("otp_verifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("otp_verifications_user_type_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.type.asc().nullsLast().op("uuid_ops")),
]);

export const pdsFamilyBackground = pgTable("pds_family_background", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	spouseSurname: text("spouse_surname"),
	spouseFirstName: text("spouse_first_name"),
	spouseMiddleName: text("spouse_middle_name"),
	spouseNameExtension: text("spouse_name_extension"),
	spouseOccupation: text("spouse_occupation"),
	spouseEmployer: text("spouse_employer"),
	spouseBusinessAddress: text("spouse_business_address"),
	spouseTelephoneNo: text("spouse_telephone_no"),
	fatherSurname: text("father_surname"),
	fatherFirstName: text("father_first_name"),
	fatherMiddleName: text("father_middle_name"),
	motherMaidenSurname: text("mother_maiden_surname"),
	motherFirstName: text("mother_first_name"),
	motherMiddleName: text("mother_middle_name"),
	fatherNameExtension: text("father_name_extension"),
}, (table) => [
	index("pds_family_background_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsChildren = pgTable("pds_children", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	fullName: text("full_name").notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
}, (table) => [
	index("pds_children_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsEducation = pgTable("pds_education", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	level: educationLevel().notNull(),
	schoolName: text("school_name").notNull(),
	degreeCourse: text("degree_course"),
	periodFrom: date("period_from"),
	periodTo: date("period_to"),
	highestLevelEarned: text("highest_level_earned"),
	yearGraduated: integer("year_graduated"),
	honorsReceived: text("honors_received"),
}, (table) => [
	index("pds_education_level_idx").using("btree", table.level.asc().nullsLast().op("enum_ops")),
	index("pds_education_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsOtherInfo = pgTable("pds_other_info", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	skills: jsonb(),
	recognitions: jsonb(),
	associations: jsonb(),
	questions: jsonb(),
	references: jsonb(),
}, (table) => [
	index("pds_other_info_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsTraining = pgTable("pds_training", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	title: text().notNull(),
	dateFrom: date("date_from").notNull(),
	dateTo: date("date_to").notNull(),
	hours: integer(),
	typeOfLd: text("type_of_ld"),
	conductedBy: text("conducted_by"),
}, (table) => [
	index("pds_training_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	employeeId: text("employee_id"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	middleName: text("middle_name"),
	phoneNumber: text("phone_number"),
	role: role().default('employee').notNull(),
	departmentId: uuid("department_id"),
	positionId: uuid("position_id"),
	academicRank: text("academic_rank"),
	tenureStatus: text("tenure_status"),
	employmentType: text("employment_type"),
	campusAssignment: text("campus_assignment"),
	accountStatus: accountStatus("account_status").default('pending').notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	temporaryPassword: boolean("temporary_password").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	userType: userType("user_type").default('employee').notNull(),
	employmentCategory: employmentCategory("employment_category").default('not_applicable'),
	applicantId: text("applicant_id"),
	hireDate: date("hire_date"),
	dateOfBirth: date("date_of_birth"),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	twoFactorSecret: text("two_factor_secret"),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	lastLoginIp: inet("last_login_ip"),
	lastLoginDevice: text("last_login_device"),
	avatarPath: text("avatar_path"),
	salaryGrade: integer("salary_grade"),
	positionTitle: text("position_title"),
}, (table) => [
	index("idx_profiles_account_status_count").using("btree", table.accountStatus.asc().nullsLast().op("enum_ops")).where(sql`(account_status IS NOT NULL)`),
	index("idx_profiles_active_employees").using("btree", table.departmentId.asc().nullsLast().op("enum_ops"), table.userType.asc().nullsLast().op("enum_ops")).where(sql`((is_active = true) AND (user_type = 'employee'::user_type))`),
	index("idx_profiles_active_status").using("btree", table.isActive.asc().nullsLast().op("enum_ops"), table.accountStatus.asc().nullsLast().op("enum_ops")).where(sql`((is_active = true) AND (account_status = 'active'::account_status))`),
	index("idx_profiles_created_at_desc").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_profiles_department_employee").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")).where(sql`((user_type = 'employee'::user_type) AND (account_status = 'active'::account_status) AND (is_active = true))`),
	index("idx_profiles_employment_category_count").using("btree", table.employmentCategory.asc().nullsLast().op("enum_ops")).where(sql`((user_type = 'employee'::user_type) AND (employment_category <> 'not_applicable'::employment_category))`),
	index("idx_profiles_pending_approvals").using("btree", table.accountStatus.asc().nullsLast().op("enum_ops")).where(sql`(account_status = 'pending'::account_status)`),
	index("idx_profiles_role_count").using("btree", table.role.asc().nullsLast().op("enum_ops")).where(sql`(role IS NOT NULL)`),
	index("idx_profiles_stats_covering").using("btree", table.userType.asc().nullsLast().op("timestamp_ops"), table.role.asc().nullsLast().op("timestamp_ops"), table.accountStatus.asc().nullsLast().op("bool_ops"), table.employmentCategory.asc().nullsLast().op("timestamp_ops"), table.isActive.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")).where(sql`(account_status IS NOT NULL)`),
	index("idx_profiles_suspended").using("btree", table.accountStatus.asc().nullsLast().op("enum_ops")).where(sql`(account_status = 'suspended'::account_status)`),
	index("idx_profiles_type_status_active").using("btree", table.userType.asc().nullsLast().op("enum_ops"), table.accountStatus.asc().nullsLast().op("enum_ops"), table.isActive.asc().nullsLast().op("enum_ops")).where(sql`(user_type = 'employee'::user_type)`),
	index("idx_profiles_user_type_count").using("btree", table.userType.asc().nullsLast().op("enum_ops")).where(sql`(user_type IS NOT NULL)`),
	index("profiles_account_status_idx").using("btree", table.accountStatus.asc().nullsLast().op("enum_ops")),
	index("profiles_applicant_id_idx").using("btree", table.applicantId.asc().nullsLast().op("text_ops")),
	index("profiles_department_id_idx").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("profiles_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("profiles_employment_category_idx").using("btree", table.employmentCategory.asc().nullsLast().op("enum_ops")),
	index("profiles_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("profiles_role_department_idx").using("btree", table.role.asc().nullsLast().op("enum_ops"), table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("profiles_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	index("profiles_salary_grade_idx").using("btree", table.salaryGrade.asc().nullsLast().op("int4_ops")),
	index("profiles_user_type_account_status_idx").using("btree", table.userType.asc().nullsLast().op("enum_ops"), table.accountStatus.asc().nullsLast().op("enum_ops")),
	index("profiles_user_type_employment_category_idx").using("btree", table.userType.asc().nullsLast().op("enum_ops"), table.employmentCategory.asc().nullsLast().op("enum_ops")),
	index("profiles_user_type_idx").using("btree", table.userType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [table.id],
			name: "profiles_approved_by_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "profiles_department_id_departments_id_fk"
		}),
	foreignKey({
			columns: [table.positionId],
			foreignColumns: [positions.id],
			name: "profiles_position_id_positions_id_fk"
		}),
	unique("profiles_employee_id_unique").on(table.employeeId),
	unique("profiles_applicant_id_unique").on(table.applicantId),
	check("chk_user_type_id", sql`(account_status = 'pending'::account_status) OR (account_status = 'rejected'::account_status) OR (is_active = false) OR ((user_type = 'employee'::user_type) AND (employee_id IS NOT NULL)) OR ((user_type = 'applicant'::user_type) AND (applicant_id IS NOT NULL))`),
	check("profiles_salary_grade_check", sql`(salary_grade IS NULL) OR ((salary_grade >= 1) AND (salary_grade <= 33))`),
]);

export const pdsCivilService = pgTable("pds_civil_service", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	eligibilityName: text("eligibility_name").notNull(),
	rating: numeric({ precision: 5, scale:  2 }),
	dateOfExam: date("date_of_exam"),
	placeOfExam: text("place_of_exam"),
	licenseNo: text("license_no"),
	licenseValidityDate: date("license_validity_date"),
}, (table) => [
	index("pds_civil_service_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsVoluntaryWork = pgTable("pds_voluntary_work", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	organizationName: text("organization_name").notNull(),
	organizationAddress: text("organization_address"),
	dateFrom: date("date_from").notNull(),
	dateTo: date("date_to"),
	numberOfHours: integer("number_of_hours"),
	positionNature: text("position_nature"),
}, (table) => [
	index("pds_voluntary_work_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsWorkExperience = pgTable("pds_work_experience", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	positionTitle: text("position_title").notNull(),
	departmentAgency: text("department_agency").notNull(),
	monthlySalary: numeric("monthly_salary", { precision: 12, scale:  2 }),
	salaryGrade: text("salary_grade"),
	statusOfAppointment: text("status_of_appointment"),
	isGovernment: boolean("is_government").default(true).notNull(),
	dateFrom: date("date_from").notNull(),
	dateTo: date("date_to"),
}, (table) => [
	index("pds_work_experience_is_government_idx").using("btree", table.isGovernment.asc().nullsLast().op("bool_ops")),
	index("pds_work_experience_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pendingRegistrations = pgTable("pending_registrations", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	status: approvalStatus().default('pending').notNull(),
	adminNotes: text("admin_notes"),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("pending_registrations_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("pending_registrations_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("pending_registrations_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("pending_registrations_user_id_unique").on(table.userId),
]);

export const positions = pgTable("positions", {
	id: uuid().primaryKey().notNull(),
	title: text().notNull(),
	gradeLevel: integer("grade_level"),
	departmentId: uuid("department_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("positions_department_id_idx").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("positions_grade_level_idx").using("btree", table.gradeLevel.asc().nullsLast().op("int4_ops")),
	index("positions_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
]);

export const salnBusinessInterests = pgTable("saln_business_interests", {
	id: uuid().primaryKey().notNull(),
	salnSubmissionId: uuid("saln_submission_id").notNull(),
	entityName: text("entity_name").notNull(),
	businessAddress: text("business_address").notNull(),
	natureOfBusiness: text("nature_of_business").notNull(),
	dateOfAcquisition: date("date_of_acquisition").notNull(),
}, (table) => [
	index("saln_business_interests_submission_id_idx").using("btree", table.salnSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const salnLiabilities = pgTable("saln_liabilities", {
	id: uuid().primaryKey().notNull(),
	salnSubmissionId: uuid("saln_submission_id").notNull(),
	nature: text().notNull(),
	creditorName: text("creditor_name").notNull(),
	outstandingBalance: numeric("outstanding_balance", { precision: 15, scale:  2 }).notNull(),
}, (table) => [
	index("saln_liabilities_submission_id_idx").using("btree", table.salnSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const pdsAttachments = pgTable("pds_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	year: integer().notNull(),
	trainingId: uuid("training_id"),
	civilServiceId: uuid("civil_service_id"),
	filePath: text("file_path").notNull(),
	fileName: text("file_name").notNull(),
	mimeType: text("mime_type").notNull(),
	sizeBytes: integer("size_bytes").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("pds_attachments_civil_service_id_idx").using("btree", table.civilServiceId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_submission_civil_service_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops"), table.civilServiceId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_submission_training_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops"), table.trainingId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_training_id_idx").using("btree", table.trainingId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_user_year_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.year.asc().nullsLast().op("uuid_ops")),
	index("pds_attachments_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.civilServiceId],
			foreignColumns: [pdsCivilService.id],
			name: "pds_attachments_civil_service_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pdsSubmissionId],
			foreignColumns: [pdsSubmissions.id],
			name: "pds_attachments_pds_submission_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.trainingId],
			foreignColumns: [pdsTraining.id],
			name: "pds_attachments_training_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins and HR can view all attachments", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::role, 'hr'::role])))))` }),
	pgPolicy("Users can delete own attachments", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("Users can insert own attachments", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own attachments", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own attachments", { as: "permissive", for: "select", to: ["public"] }),
]);

export const trustedDevices = pgTable("trusted_devices", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	deviceFingerprint: text("device_fingerprint").notNull(),
	browserInfo: text("browser_info"),
	ipAddress: inet("ip_address"),
	trustedAt: timestamp("trusted_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("trusted_devices_device_fingerprint_idx").using("btree", table.deviceFingerprint.asc().nullsLast().op("text_ops")),
	index("trusted_devices_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("trusted_devices_user_device_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.deviceFingerprint.asc().nullsLast().op("uuid_ops")),
	index("trusted_devices_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const applicationStatusHistory = pgTable("application_status_history", {
	id: uuid().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	previousStatus: applicationStatus("previous_status"),
	newStatus: applicationStatus("new_status").notNull(),
	changedBy: uuid("changed_by"),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow(),
	notes: text(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
}, (table) => [
	index("application_status_history_application_id_changed_at_idx").using("btree", table.applicationId.asc().nullsLast().op("timestamp_ops"), table.changedAt.asc().nullsLast().op("timestamp_ops")),
	index("application_status_history_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("application_status_history_application_id_new_status_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops"), table.newStatus.asc().nullsLast().op("enum_ops")),
	index("application_status_history_changed_at_idx").using("btree", table.changedAt.asc().nullsLast().op("timestamp_ops")),
	index("application_status_history_changed_by_idx").using("btree", table.changedBy.asc().nullsLast().op("uuid_ops")),
	index("application_status_history_new_status_idx").using("btree", table.newStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [jobApplications.id],
			name: "application_status_history_application_id_job_applications_id_f"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [profiles.id],
			name: "application_status_history_changed_by_profiles_id_fk"
		}),
]);

export const pdsPersonalInfo = pgTable("pds_personal_info", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	surname: text().notNull(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	nameExtension: text("name_extension"),
	dateOfBirth: date("date_of_birth").notNull(),
	placeOfBirth: text("place_of_birth").notNull(),
	sex: sex().notNull(),
	civilStatus: civilStatus("civil_status").notNull(),
	heightM: numeric("height_m", { precision: 3, scale:  2 }),
	weightKg: numeric("weight_kg", { precision: 5, scale:  2 }),
	bloodType: text("blood_type"),
	gsisNo: text("gsis_no"),
	pagibigNo: text("pagibig_no"),
	philhealthNo: text("philhealth_no"),
	sssNo: text("sss_no"),
	tinNo: text("tin_no"),
	agencyEmployeeNo: text("agency_employee_no"),
	citizenship: jsonb(),
	residentialAddress: jsonb("residential_address"),
	permanentAddress: jsonb("permanent_address"),
	telephoneNo: text("telephone_no"),
	mobileNo: text("mobile_no"),
	emailAddress: text("email_address"),
	philsysNo: text("philsys_no"),
}, (table) => [
	index("idx_pds_personal_info_philsys_no").using("btree", table.philsysNo.asc().nullsLast().op("text_ops")).where(sql`(philsys_no IS NOT NULL)`),
	index("pds_personal_info_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
	unique("pds_personal_info_philsys_no_key").on(table.philsysNo),
	unique("pds_personal_info_philsys_no_unique").on(table.philsysNo),
]);

export const userPreferences = pgTable("user_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	emailNotificationsEnabled: boolean("email_notifications_enabled").default(true).notNull(),
	emailDigestFrequency: emailDigestFrequency("email_digest_frequency").default('daily').notNull(),
	theme: theme().default('system').notNull(),
	dashboardLayout: dashboardLayout("dashboard_layout").default('default').notNull(),
	language: language().default('en').notNull(),
	timezone: varchar({ length: 50 }).default('Asia/Manila').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	profileVisibility: text("profile_visibility").default('colleagues'),
	dataSharingEnabled: boolean("data_sharing_enabled").default(false),
	activityTrackingEnabled: boolean("activity_tracking_enabled").default(true),
	pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
	smsNotificationsEnabled: boolean("sms_notifications_enabled").default(false),
	soundEnabled: boolean("sound_enabled").default(true),
}, (table) => [
	index("idx_user_preferences_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("user_preferences_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_preferences_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_preferences_user_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("user_preferences_user_id_key").on(table.userId),
	pgPolicy("Users can delete own preferences", { as: "permissive", for: "delete", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can insert own preferences", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update own preferences", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own preferences", { as: "permissive", for: "select", to: ["public"] }),
	check("user_preferences_profile_visibility_check", sql`profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'colleagues'::text])`),
]);

export const pdsSubmissions = pgTable("pds_submissions", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	version: integer().default(1).notNull(),
	status: submissionStatus().default('draft').notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	pdfFilePath: text("pdf_file_path"),
	isLatest: boolean("is_latest").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	year: integer().notNull(),
	reviewNotes: text("review_notes"),
	completion: integer().default(0).notNull(),
}, (table) => [
	index("idx_pds_submissions_approved_at").using("btree", table.approvedAt.desc().nullsFirst().op("timestamp_ops")).where(sql`((approved_at IS NOT NULL) AND (status = 'approved'::submission_status))`),
	index("idx_pds_submissions_created_at_desc").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_pds_submissions_status_created").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`(status = ANY (ARRAY['approved'::submission_status, 'submitted'::submission_status, 'reviewing'::submission_status, 'rejected'::submission_status]))`),
	index("idx_pds_submissions_user_latest").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.isLatest.asc().nullsLast().op("bool_ops")).where(sql`(is_latest = true)`),
	index("pds_submissions_approved_by_idx").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("pds_submissions_is_latest_idx").using("btree", table.isLatest.asc().nullsLast().op("bool_ops")),
	index("pds_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("pds_submissions_status_submitted_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("pds_submissions_submitted_at_idx").using("btree", table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("pds_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_user_latest_idx").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isLatest.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_user_status_idx").using("btree", table.userId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_user_year_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops")),
	index("pds_submissions_user_year_version_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.year.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
	index("pds_submissions_year_status_idx").using("btree", table.year.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("int4_ops")),
]);

export const salnSubmissions = pgTable("saln_submissions", {
	id: uuid().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	year: integer().notNull(),
	status: submissionStatus().default('draft').notNull(),
	totalAssets: numeric("total_assets", { precision: 15, scale:  2 }).default('0'),
	totalLiabilities: numeric("total_liabilities", { precision: 15, scale:  2 }).default('0'),
	netWorth: numeric("net_worth", { precision: 15, scale:  2 }).default('0'),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	pdfFilePath: text("pdf_file_path"),
	filingType: filingType("filing_type").default('separate').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	reviewNotes: text("review_notes"),
	spouseName: text("spouse_name"),
	position: text(),
	agency: text(),
	officeAddress: text("office_address"),
	completion: integer().default(0).notNull(),
}, (table) => [
	index("idx_saln_submissions_created_at_desc").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_saln_submissions_user_year_latest").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.year.desc().nullsFirst().op("uuid_ops")),
	index("idx_saln_submissions_year_approved").using("btree", table.year.asc().nullsLast().op("timestamp_ops"), table.approvedAt.desc().nullsFirst().op("timestamp_ops")).where(sql`((approved_at IS NOT NULL) AND (status = 'approved'::submission_status))`),
	index("idx_saln_submissions_year_status").using("btree", table.year.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_approved_by_idx").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("saln_submissions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("saln_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_status_submitted_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("saln_submissions_submitted_at_idx").using("btree", table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("saln_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("saln_submissions_user_status_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_user_year_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops")),
	index("saln_submissions_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
	index("saln_submissions_year_status_idx").using("btree", table.year.asc().nullsLast().op("int4_ops"), table.status.asc().nullsLast().op("int4_ops")),
	check("chk_saln_year", sql`(year >= 2000) AND ((year)::numeric <= (EXTRACT(year FROM CURRENT_DATE) + (1)::numeric))`),
]);

export const salnRelativesInGov = pgTable("saln_relatives_in_gov", {
	id: uuid().primaryKey().notNull(),
	salnSubmissionId: uuid("saln_submission_id").notNull(),
	name: text().notNull(),
	relationship: text().notNull(),
	position: text().notNull(),
	agencyAddress: text("agency_address").notNull(),
}, (table) => [
	index("saln_relatives_in_gov_submission_id_idx").using("btree", table.salnSubmissionId.asc().nullsLast().op("uuid_ops")),
]);

export const submissionDeadlines = pgTable("submission_deadlines", {
	id: uuid().primaryKey().notNull(),
	formType: formType("form_type").notNull(),
	year: integer().notNull(),
	deadlineDate: date("deadline_date").notNull(),
	reminderDaysBefore: integer("reminder_days_before").array().default([30, 15, 7, 3, 1]),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_submission_deadlines_active_upcoming").using("btree", table.formType.asc().nullsLast().op("enum_ops"), table.deadlineDate.asc().nullsLast().op("enum_ops")).where(sql`(is_active = true)`),
	index("submission_deadlines_deadline_date_idx").using("btree", table.deadlineDate.asc().nullsLast().op("date_ops")),
	index("submission_deadlines_form_type_idx").using("btree", table.formType.asc().nullsLast().op("enum_ops")),
	index("submission_deadlines_form_type_year_idx").using("btree", table.formType.asc().nullsLast().op("enum_ops"), table.year.asc().nullsLast().op("enum_ops")),
	index("submission_deadlines_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("submission_deadlines_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
]);

export const sessionLogs = pgTable("session_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	loginAt: timestamp("login_at", { mode: 'string' }).defaultNow().notNull(),
	logoutAt: timestamp("logout_at", { mode: 'string' }),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	deviceFingerprint: text("device_fingerprint"),
	browser: text(),
	os: text(),
	deviceType: text("device_type"),
	isActive: boolean("is_active").default(true),
	lastActivity: timestamp("last_activity", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("session_logs_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("session_logs_login_at_idx").using("btree", table.loginAt.desc().nullsFirst().op("timestamp_ops")),
	index("session_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "session_logs_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("System can create sessions", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`true`  }),
	pgPolicy("Users can terminate own sessions", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view own sessions", { as: "permissive", for: "select", to: ["public"] }),
]);
