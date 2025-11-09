ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_approver_id_profiles_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_archived_by_profiles_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_departments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_children" ADD CONSTRAINT "pds_children_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_civil_service" ADD CONSTRAINT "pds_civil_service_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_education" ADD CONSTRAINT "pds_education_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_family_background" ADD CONSTRAINT "pds_family_background_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_other_info" ADD CONSTRAINT "pds_other_info_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_personal_info" ADD CONSTRAINT "pds_personal_info_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD CONSTRAINT "pds_submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_submissions" ADD CONSTRAINT "pds_submissions_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_training" ADD CONSTRAINT "pds_training_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_voluntary_work" ADD CONSTRAINT "pds_voluntary_work_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pds_work_experience" ADD CONSTRAINT "pds_work_experience_pds_submission_id_pds_submissions_id_fk" FOREIGN KEY ("pds_submission_id") REFERENCES "public"."pds_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_business_interests" ADD CONSTRAINT "saln_business_interests_saln_submission_id_saln_submissions_id_fk" FOREIGN KEY ("saln_submission_id") REFERENCES "public"."saln_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_liabilities" ADD CONSTRAINT "saln_liabilities_saln_submission_id_saln_submissions_id_fk" FOREIGN KEY ("saln_submission_id") REFERENCES "public"."saln_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_personal_properties" ADD CONSTRAINT "saln_personal_properties_saln_submission_id_saln_submissions_id_fk" FOREIGN KEY ("saln_submission_id") REFERENCES "public"."saln_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_real_properties" ADD CONSTRAINT "saln_real_properties_saln_submission_id_saln_submissions_id_fk" FOREIGN KEY ("saln_submission_id") REFERENCES "public"."saln_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_relatives_in_gov" ADD CONSTRAINT "saln_relatives_in_gov_saln_submission_id_saln_submissions_id_fk" FOREIGN KEY ("saln_submission_id") REFERENCES "public"."saln_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD CONSTRAINT "saln_submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saln_submissions" ADD CONSTRAINT "saln_submissions_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_workflows_submission_id_idx" ON "approval_workflows" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "approval_workflows_approver_id_idx" ON "approval_workflows" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "approval_workflows_status_idx" ON "approval_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "archives_original_table_idx" ON "archives" USING btree ("original_table");--> statement-breakpoint
CREATE INDEX "archives_archived_at_idx" ON "archives" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "archives_archived_by_idx" ON "archives" USING btree ("archived_by");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "departments_parent_id_idx" ON "departments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pds_submissions_user_id_idx" ON "pds_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pds_submissions_status_idx" ON "pds_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pds_submissions_is_latest_idx" ON "pds_submissions" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "pds_submissions_user_status_idx" ON "pds_submissions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "positions_department_id_idx" ON "positions" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_employee_id_idx" ON "profiles" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_department_id_idx" ON "profiles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "profiles_is_active_idx" ON "profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "saln_submissions_user_id_idx" ON "saln_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saln_submissions_year_idx" ON "saln_submissions" USING btree ("year");--> statement-breakpoint
CREATE INDEX "saln_submissions_status_idx" ON "saln_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "saln_submissions_user_year_idx" ON "saln_submissions" USING btree ("user_id","year");