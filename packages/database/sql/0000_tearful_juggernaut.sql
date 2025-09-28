CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."civil_status" AS ENUM('single', 'married', 'widowed', 'separated', 'divorced');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('elementary', 'secondary', 'vocational', 'college', 'graduate');--> statement-breakpoint
CREATE TYPE "public"."filing_type" AS ENUM('joint', 'separate', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."form_type" AS ENUM('pds', 'saln');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('deadline_reminder', 'submission_status', 'approval_required', 'system_update');--> statement-breakpoint
CREATE TYPE "public"."property_kind" AS ENUM('residential', 'commercial', 'industrial', 'agricultural', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('employee', 'hr', 'admin', 'supervisor', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'reviewing', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"submission_type" "form_type" NOT NULL,
	"approver_id" uuid NOT NULL,
	"approval_level" integer DEFAULT 1 NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"comments" text,
	"action_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archives" (
	"id" uuid PRIMARY KEY NOT NULL,
	"original_table" text NOT NULL,
	"original_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL,
	"archived_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pds_children" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pds_civil_service" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"eligibility_name" text NOT NULL,
	"rating" numeric(5, 2),
	"date_of_exam" date,
	"place_of_exam" text,
	"license_no" text,
	"license_validity_date" date
);
--> statement-breakpoint
CREATE TABLE "pds_education" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"level" "education_level" NOT NULL,
	"school_name" text NOT NULL,
	"degree_course" text,
	"period_from" date,
	"period_to" date,
	"highest_level_earned" text,
	"year_graduated" integer,
	"honors_received" text
);
--> statement-breakpoint
CREATE TABLE "pds_family_background" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"spouse_surname" text,
	"spouse_first_name" text,
	"spouse_middle_name" text,
	"spouse_name_extension" text,
	"spouse_occupation" text,
	"spouse_employer" text,
	"spouse_business_address" text,
	"spouse_telephone_no" text,
	"father_surname" text,
	"father_first_name" text,
	"father_middle_name" text,
	"mother_maiden_surname" text,
	"mother_first_name" text,
	"mother_middle_name" text
);
--> statement-breakpoint
CREATE TABLE "pds_other_info" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"skills" jsonb,
	"recognitions" jsonb,
	"associations" jsonb,
	"questions" jsonb,
	"references" jsonb
);
--> statement-breakpoint
CREATE TABLE "pds_personal_info" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"surname" text NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"name_extension" text,
	"date_of_birth" date NOT NULL,
	"place_of_birth" text NOT NULL,
	"sex" "sex" NOT NULL,
	"civil_status" "civil_status" NOT NULL,
	"height_m" numeric(3, 2),
	"weight_kg" numeric(5, 2),
	"blood_type" text,
	"gsis_no" text,
	"pagibig_no" text,
	"philhealth_no" text,
	"sss_no" text,
	"tin_no" text,
	"agency_employee_no" text,
	"citizenship" jsonb,
	"residential_address" jsonb,
	"permanent_address" jsonb,
	"telephone_no" text,
	"mobile_no" text,
	"email_address" text
);
--> statement-breakpoint
CREATE TABLE "pds_submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_by" uuid,
	"approved_at" timestamp,
	"is_latest" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pds_training" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"title" text NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"hours" integer,
	"type_of_ld" text,
	"conducted_by" text
);
--> statement-breakpoint
CREATE TABLE "pds_voluntary_work" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"organization_address" text,
	"date_from" date NOT NULL,
	"date_to" date,
	"number_of_hours" integer,
	"position_nature" text
);
--> statement-breakpoint
CREATE TABLE "pds_work_experience" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pds_submission_id" uuid NOT NULL,
	"position_title" text NOT NULL,
	"department_agency" text NOT NULL,
	"monthly_salary" numeric(12, 2),
	"salary_grade" text,
	"status_of_appointment" text,
	"is_government" boolean DEFAULT true NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"grade_level" integer,
	"department_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"department_id" uuid,
	"position_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "saln_business_interests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"saln_submission_id" uuid NOT NULL,
	"entity_name" text NOT NULL,
	"business_address" text NOT NULL,
	"nature_of_business" text NOT NULL,
	"date_of_acquisition" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saln_liabilities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"saln_submission_id" uuid NOT NULL,
	"nature" text NOT NULL,
	"creditor_name" text NOT NULL,
	"outstanding_balance" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saln_personal_properties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"saln_submission_id" uuid NOT NULL,
	"description" text NOT NULL,
	"year_acquired" integer NOT NULL,
	"acquisition_cost" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saln_real_properties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"saln_submission_id" uuid NOT NULL,
	"description" text NOT NULL,
	"kind" "property_kind" NOT NULL,
	"exact_location" text NOT NULL,
	"assessed_value" numeric(15, 2) NOT NULL,
	"current_fair_market_value" numeric(15, 2) NOT NULL,
	"acquisition_year" integer NOT NULL,
	"acquisition_mode" text NOT NULL,
	"acquisition_cost" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saln_relatives_in_gov" (
	"id" uuid PRIMARY KEY NOT NULL,
	"saln_submission_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"position" text NOT NULL,
	"agency_address" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saln_submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"total_assets" numeric(15, 2) DEFAULT '0',
	"total_liabilities" numeric(15, 2) DEFAULT '0',
	"net_worth" numeric(15, 2) DEFAULT '0',
	"submitted_at" timestamp,
	"approved_by" uuid,
	"approved_at" timestamp,
	"filing_type" "filing_type" DEFAULT 'separate' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_deadlines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"form_type" "form_type" NOT NULL,
	"year" integer NOT NULL,
	"deadline_date" date NOT NULL,
	"reminder_days_before" integer[] DEFAULT '{30,15,7,3,1}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
