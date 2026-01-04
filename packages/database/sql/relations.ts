import { relations } from "drizzle-orm/relations";
import { profiles, jobApplications, pdsSubmissions, openPositions, departments, positions, pdsCivilService, pdsAttachments, pdsTraining, applicationStatusHistory, userPreferences, sessionLogs } from "./schema";

export const jobApplicationsRelations = relations(jobApplications, ({one, many}) => ({
	profile_applicantId: one(profiles, {
		fields: [jobApplications.applicantId],
		references: [profiles.id],
		relationName: "jobApplications_applicantId_profiles_id"
	}),
	profile_decisionBy: one(profiles, {
		fields: [jobApplications.decisionBy],
		references: [profiles.id],
		relationName: "jobApplications_decisionBy_profiles_id"
	}),
	pdsSubmission: one(pdsSubmissions, {
		fields: [jobApplications.pdsSubmissionId],
		references: [pdsSubmissions.id]
	}),
	openPosition: one(openPositions, {
		fields: [jobApplications.positionId],
		references: [openPositions.id]
	}),
	profile_reviewedBy: one(profiles, {
		fields: [jobApplications.reviewedBy],
		references: [profiles.id],
		relationName: "jobApplications_reviewedBy_profiles_id"
	}),
	applicationStatusHistories: many(applicationStatusHistory),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	jobApplications_applicantId: many(jobApplications, {
		relationName: "jobApplications_applicantId_profiles_id"
	}),
	jobApplications_decisionBy: many(jobApplications, {
		relationName: "jobApplications_decisionBy_profiles_id"
	}),
	jobApplications_reviewedBy: many(jobApplications, {
		relationName: "jobApplications_reviewedBy_profiles_id"
	}),
	openPositions: many(openPositions),
	profile: one(profiles, {
		fields: [profiles.approvedBy],
		references: [profiles.id],
		relationName: "profiles_approvedBy_profiles_id"
	}),
	profiles: many(profiles, {
		relationName: "profiles_approvedBy_profiles_id"
	}),
	department: one(departments, {
		fields: [profiles.departmentId],
		references: [departments.id]
	}),
	position: one(positions, {
		fields: [profiles.positionId],
		references: [positions.id]
	}),
	applicationStatusHistories: many(applicationStatusHistory),
	userPreferences_userId: many(userPreferences, {
		relationName: "userPreferences_userId_profiles_id"
	}),
	userPreferences_userId: many(userPreferences, {
		relationName: "userPreferences_userId_profiles_id"
	}),
	sessionLogs: many(sessionLogs),
}));

export const pdsSubmissionsRelations = relations(pdsSubmissions, ({many}) => ({
	jobApplications: many(jobApplications),
	pdsAttachments: many(pdsAttachments),
}));

export const openPositionsRelations = relations(openPositions, ({one, many}) => ({
	jobApplications: many(jobApplications),
	department: one(departments, {
		fields: [openPositions.departmentId],
		references: [departments.id]
	}),
	profile: one(profiles, {
		fields: [openPositions.postedBy],
		references: [profiles.id]
	}),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	department: one(departments, {
		fields: [departments.parentCollegeId],
		references: [departments.id],
		relationName: "departments_parentCollegeId_departments_id"
	}),
	departments: many(departments, {
		relationName: "departments_parentCollegeId_departments_id"
	}),
	openPositions: many(openPositions),
	profiles: many(profiles),
}));

export const positionsRelations = relations(positions, ({many}) => ({
	profiles: many(profiles),
}));

export const pdsAttachmentsRelations = relations(pdsAttachments, ({one}) => ({
	pdsCivilService: one(pdsCivilService, {
		fields: [pdsAttachments.civilServiceId],
		references: [pdsCivilService.id]
	}),
	pdsSubmission: one(pdsSubmissions, {
		fields: [pdsAttachments.pdsSubmissionId],
		references: [pdsSubmissions.id]
	}),
	pdsTraining: one(pdsTraining, {
		fields: [pdsAttachments.trainingId],
		references: [pdsTraining.id]
	}),
}));

export const pdsCivilServiceRelations = relations(pdsCivilService, ({many}) => ({
	pdsAttachments: many(pdsAttachments),
}));

export const pdsTrainingRelations = relations(pdsTraining, ({many}) => ({
	pdsAttachments: many(pdsAttachments),
}));

export const applicationStatusHistoryRelations = relations(applicationStatusHistory, ({one}) => ({
	jobApplication: one(jobApplications, {
		fields: [applicationStatusHistory.applicationId],
		references: [jobApplications.id]
	}),
	profile: one(profiles, {
		fields: [applicationStatusHistory.changedBy],
		references: [profiles.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	profile_userId: one(profiles, {
		fields: [userPreferences.userId],
		references: [profiles.id],
		relationName: "userPreferences_userId_profiles_id"
	}),
	profile_userId: one(profiles, {
		fields: [userPreferences.userId],
		references: [profiles.id],
		relationName: "userPreferences_userId_profiles_id"
	}),
}));

export const sessionLogsRelations = relations(sessionLogs, ({one}) => ({
	profile: one(profiles, {
		fields: [sessionLogs.userId],
		references: [profiles.id]
	}),
}));