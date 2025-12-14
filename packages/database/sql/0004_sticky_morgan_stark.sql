CREATE TYPE "public"."dashboard_layout" AS ENUM('default', 'compact', 'detailed');--> statement-breakpoint
CREATE TYPE "public"."email_digest_frequency" AS ENUM('realtime', 'daily', 'weekly', 'never');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'fil');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true,
	"email_digest_frequency" "email_digest_frequency" DEFAULT 'daily' NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"dashboard_layout" "dashboard_layout" DEFAULT 'default' NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'Asia/Manila' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "pds_personal_info" ADD COLUMN "philsys_no" text;--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN "spouse_name" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN "agency" text;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD COLUMN "office_address" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pds_submissions_year_idx" ON "pds_submissions" USING btree ("year");--> statement-breakpoint
CREATE INDEX "pds_submissions_user_year_idx" ON "pds_submissions" USING btree ("user_id","year");--> statement-breakpoint
CREATE INDEX "pds_submissions_year_status_idx" ON "pds_submissions" USING btree ("year","status");--> statement-breakpoint
ALTER TABLE "pds_personal_info" ADD CONSTRAINT "pds_personal_info_philsys_no_unique" UNIQUE("philsys_no");