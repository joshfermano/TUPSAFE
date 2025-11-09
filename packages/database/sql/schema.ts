import { pgTable, index, uuid, text, date, numeric, integer, timestamp, jsonb, inet, unique, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountStatus = pgEnum("account_status", ['pending', 'active', 'suspended', 'rejected'])
export const approvalStatus = pgEnum("approval_status", ['pending', 'approved', 'rejected'])
export const civilStatus = pgEnum("civil_status", ['single', 'married', 'widowed', 'separated', 'divorced'])
export const educationLevel = pgEnum("education_level", ['elementary', 'secondary', 'vocational', 'college', 'graduate'])
export const filingType = pgEnum("filing_type", ['joint', 'separate', 'not_applicable'])
export const formType = pgEnum("form_type", ['pds', 'saln'])
export const notificationType = pgEnum("notification_type", ['deadline_reminder', 'submission_status', 'approval_required', 'system_update'])
export const otpType = pgEnum("otp_type", ['email_verification', 'login_challenge', 'password_reset'])
export const propertyKind = pgEnum("property_kind", ['residential', 'commercial', 'industrial', 'agricultural', 'mixed'])
export const role = pgEnum("role", ['employee', 'hr', 'admin', 'supervisor', 'auditor'])
export const sex = pgEnum("sex", ['male', 'female'])
export const submissionStatus = pgEnum("submission_status", ['draft', 'submitted', 'reviewing', 'approved', 'rejected'])


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
	index("approval_workflows_approver_status_idx").using("btree", table.approverId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("approval_workflows_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("approval_workflows_submission_id_idx").using("btree", table.submissionId.asc().nullsLast().op("uuid_ops")),
	index("approval_workflows_submission_type_idx").using("btree", table.submissionType.asc().nullsLast().op("enum_ops")),
	index("approval_workflows_submission_type_status_idx").using("btree", table.submissionType.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
]);

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
	index("audit_logs_user_created_at_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("audit_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const departments = pgTable("departments", {
	id: uuid().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	parentId: uuid("parent_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("departments_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("departments_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("departments_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	unique("departments_code_unique").on(table.code),
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
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("notifications_user_created_at_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("notifications_user_is_read_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.isRead.asc().nullsLast().op("uuid_ops")),
]);

export const pdsChildren = pgTable("pds_children", {
	id: uuid().primaryKey().notNull(),
	pdsSubmissionId: uuid("pds_submission_id").notNull(),
	fullName: text("full_name").notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
}, (table) => [
	index("pds_children_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
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
}, (table) => [
	index("pds_personal_info_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
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
}, (table) => [
	index("pds_family_background_submission_id_idx").using("btree", table.pdsSubmissionId.asc().nullsLast().op("uuid_ops")),
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
}, (table) => [
	index("pds_submissions_approved_by_idx").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("pds_submissions_is_latest_idx").using("btree", table.isLatest.asc().nullsLast().op("bool_ops")),
	index("pds_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("pds_submissions_status_submitted_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.submittedAt.asc().nullsLast().op("enum_ops")),
	index("pds_submissions_submitted_at_idx").using("btree", table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("pds_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("pds_submissions_user_latest_idx").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isLatest.asc().nullsLast().op("bool_ops")),
	index("pds_submissions_user_status_idx").using("btree", table.userId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
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
}, (table) => [
	index("saln_submissions_approved_by_idx").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("saln_submissions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("saln_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_status_submitted_idx").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.submittedAt.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_submitted_at_idx").using("btree", table.submittedAt.asc().nullsLast().op("timestamp_ops")),
	index("saln_submissions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("saln_submissions_user_status_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("saln_submissions_user_year_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.year.asc().nullsLast().op("uuid_ops")),
	index("saln_submissions_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
	index("saln_submissions_year_status_idx").using("btree", table.year.asc().nullsLast().op("int4_ops"), table.status.asc().nullsLast().op("int4_ops")),
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
	index("submission_deadlines_deadline_date_idx").using("btree", table.deadlineDate.asc().nullsLast().op("date_ops")),
	index("submission_deadlines_form_type_idx").using("btree", table.formType.asc().nullsLast().op("enum_ops")),
	index("submission_deadlines_form_type_year_idx").using("btree", table.formType.asc().nullsLast().op("enum_ops"), table.year.asc().nullsLast().op("enum_ops")),
	index("submission_deadlines_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("submission_deadlines_year_idx").using("btree", table.year.asc().nullsLast().op("int4_ops")),
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

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	employeeId: text("employee_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	middleName: text("middle_name"),
	role: role().default('employee').notNull(),
	departmentId: uuid("department_id"),
	positionId: uuid("position_id"),
	academicRank: text("academic_rank"),
	tenureStatus: text("tenure_status"),
	employmentType: text("employment_type"),
	campusAssignment: text("campus_assignment"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	phoneNumber: text("phone_number"),
	accountStatus: accountStatus("account_status").default('pending').notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	temporaryPassword: boolean("temporary_password").default(false).notNull(),
}, (table) => [
	index("profiles_account_status_idx").using("btree", table.accountStatus.asc().nullsLast().op("enum_ops")),
	index("profiles_department_id_idx").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("profiles_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("profiles_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("profiles_role_department_idx").using("btree", table.role.asc().nullsLast().op("uuid_ops"), table.departmentId.asc().nullsLast().op("uuid_ops")),
	index("profiles_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	unique("profiles_employee_id_unique").on(table.employeeId),
]);
