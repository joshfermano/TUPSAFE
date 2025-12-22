CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'private', 'colleagues');--> statement-breakpoint
CREATE TABLE "session_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"login_at" timestamp DEFAULT now() NOT NULL,
	"logout_at" timestamp,
	"ip_address" "inet",
	"user_agent" text,
	"device_fingerprint" text,
	"browser" text,
	"os" text,
	"device_type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_login_ip" "inet";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_login_device" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "profile_visibility" "profile_visibility" DEFAULT 'colleagues' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "data_sharing_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "activity_tracking_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "push_notifications_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "sms_notifications_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "sound_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_logs_user_id_idx" ON "session_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_logs_is_active_idx" ON "session_logs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "session_logs_login_at_idx" ON "session_logs" USING btree ("login_at");--> statement-breakpoint
CREATE INDEX "session_logs_user_active_idx" ON "session_logs" USING btree ("user_id","is_active");