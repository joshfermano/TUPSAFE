CREATE TYPE "public"."application_status" AS ENUM('pending', 'under_review', 'shortlisted', 'for_interview', 'interviewed', 'for_final_review', 'accepted', 'rejected', 'withdrawn', 'hired');--> statement-breakpoint
CREATE TYPE "public"."employment_category" AS ENUM('faculty', 'administrative', 'contractual', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."office_type" AS ENUM('academic', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."position_status" AS ENUM('open', 'closed', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('employee', 'applicant');--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"previous_status" "application_status",
	"new_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now(),
	"notes" text,
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_number" text NOT NULL,
	"applicant_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"pds_submission_id" uuid,
	"cover_letter" text,
	"resume_url" text,
	"additional_documents" jsonb DEFAULT '[]'::jsonb,
	"status" "application_status" DEFAULT 'pending',
	"application_date" timestamp DEFAULT now(),
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"reviewer_notes" text,
	"interview_date" timestamp,
	"interview_location" text,
	"interview_notes" text,
	"final_decision" text,
	"decision_by" uuid,
	"decision_at" timestamp,
	"rejection_reason" text,
	"converted_to_employee_id" text,
	"converted_hire_date" date,
	"conversion_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "job_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "open_positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"position_title" text NOT NULL,
	"position_code" text NOT NULL,
	"department_id" uuid,
	"employment_category" "employment_category" NOT NULL,
	"description" text NOT NULL,
	"qualifications" jsonb DEFAULT '[]'::jsonb,
	"responsibilities" jsonb DEFAULT '[]'::jsonb,
	"requirements" jsonb DEFAULT '{"education":[],"experience":[],"skills":[]}'::jsonb,
	"salary_grade" text,
	"salary_range_min" numeric(12, 2),
	"salary_range_max" numeric(12, 2),
	"employment_type" text,
	"status" "position_status" DEFAULT 'open',
	"application_deadline" timestamp NOT NULL,
	"number_of_openings" integer DEFAULT 1,
	"applications_received" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"posted_by" uuid,
	"posted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	CONSTRAINT "open_positions_position_code_unique" UNIQUE("position_code")
);
--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "employee_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "office_type" "office_type" DEFAULT 'academic';--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "parent_college_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_type" "user_type" DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "employment_category" "employment_category" DEFAULT 'not_applicable';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "applicant_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_id_profiles_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_position_id_open_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."open_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_decision_by_profiles_id_fk" FOREIGN KEY ("decision_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_posted_by_profiles_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_status_history_application_id_idx" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_status_history_new_status_idx" ON "application_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "application_status_history_changed_by_idx" ON "application_status_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "application_status_history_changed_at_idx" ON "application_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "application_status_history_application_id_changed_at_idx" ON "application_status_history" USING btree ("application_id","changed_at");--> statement-breakpoint
CREATE INDEX "application_status_history_application_id_new_status_idx" ON "application_status_history" USING btree ("application_id","new_status");--> statement-breakpoint
CREATE INDEX "job_applications_application_number_idx" ON "job_applications" USING btree ("application_number");--> statement-breakpoint
CREATE INDEX "job_applications_applicant_id_idx" ON "job_applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "job_applications_position_id_idx" ON "job_applications" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "job_applications_status_idx" ON "job_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_applications_application_date_idx" ON "job_applications" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "job_applications_reviewed_by_idx" ON "job_applications" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "job_applications_decision_by_idx" ON "job_applications" USING btree ("decision_by");--> statement-breakpoint
CREATE INDEX "job_applications_converted_to_employee_id_idx" ON "job_applications" USING btree ("converted_to_employee_id");--> statement-breakpoint
CREATE INDEX "job_applications_created_at_idx" ON "job_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_applications_applicant_status_idx" ON "job_applications" USING btree ("applicant_id","status");--> statement-breakpoint
CREATE INDEX "job_applications_position_status_idx" ON "job_applications" USING btree ("position_id","status");--> statement-breakpoint
CREATE INDEX "job_applications_status_application_date_idx" ON "job_applications" USING btree ("status","application_date");--> statement-breakpoint
CREATE INDEX "job_applications_reviewed_by_status_idx" ON "job_applications" USING btree ("reviewed_by","status");--> statement-breakpoint
CREATE INDEX "open_positions_position_code_idx" ON "open_positions" USING btree ("position_code");--> statement-breakpoint
CREATE INDEX "open_positions_department_id_idx" ON "open_positions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "open_positions_employment_category_idx" ON "open_positions" USING btree ("employment_category");--> statement-breakpoint
CREATE INDEX "open_positions_status_idx" ON "open_positions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "open_positions_application_deadline_idx" ON "open_positions" USING btree ("application_deadline");--> statement-breakpoint
CREATE INDEX "open_positions_is_active_idx" ON "open_positions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "open_positions_is_featured_idx" ON "open_positions" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "open_positions_posted_by_idx" ON "open_positions" USING btree ("posted_by");--> statement-breakpoint
CREATE INDEX "open_positions_posted_at_idx" ON "open_positions" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "open_positions_status_is_active_idx" ON "open_positions" USING btree ("status","is_active");--> statement-breakpoint
CREATE INDEX "open_positions_status_deadline_idx" ON "open_positions" USING btree ("status","application_deadline");--> statement-breakpoint
CREATE INDEX "open_positions_employment_category_status_idx" ON "open_positions" USING btree ("employment_category","status");--> statement-breakpoint
CREATE INDEX "open_positions_is_featured_status_idx" ON "open_positions" USING btree ("is_featured","status");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_college_id_departments_id_fk" FOREIGN KEY ("parent_college_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_office_type_idx" ON "departments" USING btree ("office_type");--> statement-breakpoint
CREATE INDEX "departments_parent_college_id_idx" ON "departments" USING btree ("parent_college_id");--> statement-breakpoint
CREATE INDEX "departments_office_type_is_active_idx" ON "departments" USING btree ("office_type","is_active");--> statement-breakpoint
CREATE INDEX "profiles_applicant_id_idx" ON "profiles" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "profiles_user_type_idx" ON "profiles" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "profiles_employment_category_idx" ON "profiles" USING btree ("employment_category");--> statement-breakpoint
CREATE INDEX "profiles_user_type_employment_category_idx" ON "profiles" USING btree ("user_type","employment_category");--> statement-breakpoint
CREATE INDEX "profiles_user_type_account_status_idx" ON "profiles" USING btree ("user_type","account_status");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_applicant_id_unique" UNIQUE("applicant_id");