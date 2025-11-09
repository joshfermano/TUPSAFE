-- Safe enum creation (only if not exists)
DO $$ BEGIN
  CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'suspended', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."otp_type" AS ENUM('email_verification', 'login_challenge', 'password_reset');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_id_registry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_id_registry_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "employee_id_registry_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otp_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"type" "otp_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_registrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trusted_devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_fingerprint" text NOT NULL,
	"browser_info" text,
	"ip_address" "inet",
	"trusted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_workflows" DROP CONSTRAINT IF EXISTS "approval_workflows_approver_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "archives" DROP CONSTRAINT IF EXISTS "archives_archived_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_parent_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_children" DROP CONSTRAINT IF EXISTS "pds_children_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_civil_service" DROP CONSTRAINT IF EXISTS "pds_civil_service_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_education" DROP CONSTRAINT IF EXISTS "pds_education_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_family_background" DROP CONSTRAINT IF EXISTS "pds_family_background_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_other_info" DROP CONSTRAINT IF EXISTS "pds_other_info_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_personal_info" DROP CONSTRAINT IF EXISTS "pds_personal_info_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_submissions" DROP CONSTRAINT IF EXISTS "pds_submissions_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_submissions" DROP CONSTRAINT IF EXISTS "pds_submissions_approved_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_training" DROP CONSTRAINT IF EXISTS "pds_training_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_voluntary_work" DROP CONSTRAINT IF EXISTS "pds_voluntary_work_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "pds_work_experience" DROP CONSTRAINT IF EXISTS "pds_work_experience_pds_submission_id_pds_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "positions_department_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_department_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_position_id_positions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_business_interests" DROP CONSTRAINT IF EXISTS "saln_business_interests_saln_submission_id_saln_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_liabilities" DROP CONSTRAINT IF EXISTS "saln_liabilities_saln_submission_id_saln_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_personal_properties" DROP CONSTRAINT IF EXISTS "saln_personal_properties_saln_submission_id_saln_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_real_properties" DROP CONSTRAINT IF EXISTS "saln_real_properties_saln_submission_id_saln_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_relatives_in_gov" DROP CONSTRAINT IF EXISTS "saln_relatives_in_gov_saln_submission_id_saln_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_submissions" DROP CONSTRAINT IF EXISTS "saln_submissions_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "saln_submissions" DROP CONSTRAINT IF EXISTS "saln_submissions_approved_by_profiles_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_user_id_is_read_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "departments_code_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "profiles_employee_id_idx";--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD COLUMN IF NOT EXISTS "pdf_file_path" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "phone_number" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "academic_rank" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "tenure_status" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "employment_type" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "campus_assignment" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "account_status" "account_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "temporary_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN IF NOT EXISTS "pdf_file_path" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_id_registry_employee_id_idx" ON "employee_id_registry" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "employee_id_registry_user_id_idx" ON "employee_id_registry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_user_id_idx" ON "otp_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_expires_at_idx" ON "otp_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_type_idx" ON "otp_verifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_verifications_user_type_idx" ON "otp_verifications" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_registrations_user_id_idx" ON "pending_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_registrations_status_idx" ON "pending_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_registrations_created_at_idx" ON "pending_registrations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trusted_devices_user_id_idx" ON "trusted_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trusted_devices_device_fingerprint_idx" ON "trusted_devices" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trusted_devices_expires_at_idx" ON "trusted_devices" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trusted_devices_user_device_idx" ON "trusted_devices" USING btree ("user_id","device_fingerprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_workflows_submission_type_idx" ON "approval_workflows" USING btree ("submission_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_workflows_approver_status_idx" ON "approval_workflows" USING btree ("approver_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_workflows_submission_type_status_idx" ON "approval_workflows" USING btree ("submission_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "archives_original_id_idx" ON "archives" USING btree ("original_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "archives_original_table_id_idx" ON "archives" USING btree ("original_table","original_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_entity_id_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_children_submission_id_idx" ON "pds_children" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_civil_service_submission_id_idx" ON "pds_civil_service" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_education_submission_id_idx" ON "pds_education" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_education_level_idx" ON "pds_education" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_family_background_submission_id_idx" ON "pds_family_background" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_other_info_submission_id_idx" ON "pds_other_info" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_personal_info_submission_id_idx" ON "pds_personal_info" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_submissions_submitted_at_idx" ON "pds_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_submissions_approved_by_idx" ON "pds_submissions" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_submissions_created_at_idx" ON "pds_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_submissions_user_latest_idx" ON "pds_submissions" USING btree ("user_id","is_latest");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_submissions_status_submitted_idx" ON "pds_submissions" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_training_submission_id_idx" ON "pds_training" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_voluntary_work_submission_id_idx" ON "pds_voluntary_work" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_work_experience_submission_id_idx" ON "pds_work_experience" USING btree ("pds_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pds_work_experience_is_government_idx" ON "pds_work_experience" USING btree ("is_government");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "positions_grade_level_idx" ON "positions" USING btree ("grade_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "positions_is_active_idx" ON "positions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_account_status_idx" ON "profiles" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_role_department_idx" ON "profiles" USING btree ("role","department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_business_interests_submission_id_idx" ON "saln_business_interests" USING btree ("saln_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_liabilities_submission_id_idx" ON "saln_liabilities" USING btree ("saln_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_personal_properties_submission_id_idx" ON "saln_personal_properties" USING btree ("saln_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_real_properties_submission_id_idx" ON "saln_real_properties" USING btree ("saln_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_real_properties_kind_idx" ON "saln_real_properties" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_relatives_in_gov_submission_id_idx" ON "saln_relatives_in_gov" USING btree ("saln_submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_submitted_at_idx" ON "saln_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_approved_by_idx" ON "saln_submissions" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_created_at_idx" ON "saln_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_user_status_idx" ON "saln_submissions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_status_submitted_idx" ON "saln_submissions" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saln_submissions_year_status_idx" ON "saln_submissions" USING btree ("year","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_deadlines_form_type_idx" ON "submission_deadlines" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_deadlines_year_idx" ON "submission_deadlines" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_deadlines_deadline_date_idx" ON "submission_deadlines" USING btree ("deadline_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_deadlines_is_active_idx" ON "submission_deadlines" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_deadlines_form_type_year_idx" ON "submission_deadlines" USING btree ("form_type","year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_employee_id_idx" ON "profiles" USING btree ("employee_id");