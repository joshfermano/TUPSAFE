-- =========================================
-- Performance Indexes for TUPSAFE
-- Optimized for Drizzle + Supabase Setup
-- =========================================

-- Core user lookup indexes
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Department hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Position lookups
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);

-- PDS submission performance indexes
CREATE INDEX IF NOT EXISTS idx_pds_submissions_user_id ON pds_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_pds_submissions_status ON pds_submissions(status);
CREATE INDEX IF NOT EXISTS idx_pds_submissions_is_latest ON pds_submissions(is_latest);
CREATE INDEX IF NOT EXISTS idx_pds_submissions_submitted_at ON pds_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_pds_submissions_user_latest ON pds_submissions(user_id, is_latest);

-- PDS foreign key indexes for joins
CREATE INDEX IF NOT EXISTS idx_pds_personal_info_submission ON pds_personal_info(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_family_background_submission ON pds_family_background(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_children_submission ON pds_children(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_education_submission ON pds_education(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_civil_service_submission ON pds_civil_service(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_work_experience_submission ON pds_work_experience(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_voluntary_work_submission ON pds_voluntary_work(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_training_submission ON pds_training(pds_submission_id);
CREATE INDEX IF NOT EXISTS idx_pds_other_info_submission ON pds_other_info(pds_submission_id);

-- SALN submission performance indexes
CREATE INDEX IF NOT EXISTS idx_saln_submissions_user_id ON saln_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_saln_submissions_year ON saln_submissions(year);
CREATE INDEX IF NOT EXISTS idx_saln_submissions_status ON saln_submissions(status);
CREATE INDEX IF NOT EXISTS idx_saln_submissions_submitted_at ON saln_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_saln_submissions_user_year ON saln_submissions(user_id, year);

-- SALN foreign key indexes for joins
CREATE INDEX IF NOT EXISTS idx_saln_real_properties_submission ON saln_real_properties(saln_submission_id);
CREATE INDEX IF NOT EXISTS idx_saln_personal_properties_submission ON saln_personal_properties(saln_submission_id);
CREATE INDEX IF NOT EXISTS idx_saln_liabilities_submission ON saln_liabilities(saln_submission_id);
CREATE INDEX IF NOT EXISTS idx_saln_business_interests_submission ON saln_business_interests(saln_submission_id);
CREATE INDEX IF NOT EXISTS idx_saln_relatives_in_gov_submission ON saln_relatives_in_gov(saln_submission_id);

-- Deadline management indexes
CREATE INDEX IF NOT EXISTS idx_submission_deadlines_form_type ON submission_deadlines(form_type);
CREATE INDEX IF NOT EXISTS idx_submission_deadlines_year ON submission_deadlines(year);
CREATE INDEX IF NOT EXISTS idx_submission_deadlines_deadline_date ON submission_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_submission_deadlines_is_active ON submission_deadlines(is_active);

-- Approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_approval_workflows_submission_id ON approval_workflows(submission_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_approver_id ON approval_workflows(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_submission_type ON approval_workflows(submission_type);

-- Audit and notification indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Archive indexes
CREATE INDEX IF NOT EXISTS idx_archives_original_table ON archives(original_table);
CREATE INDEX IF NOT EXISTS idx_archives_original_id ON archives(original_id);
CREATE INDEX IF NOT EXISTS idx_archives_archived_at ON archives(archived_at);

-- =========================================
-- Composite indexes for common queries
-- =========================================

-- User submissions dashboard queries
CREATE INDEX IF NOT EXISTS idx_pds_user_status_date ON pds_submissions(user_id, status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_saln_user_status_date ON saln_submissions(user_id, status, submitted_at);

-- HR/Admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_pds_status_submitted_at ON pds_submissions(status, submitted_at) WHERE status != 'draft';
CREATE INDEX IF NOT EXISTS idx_saln_status_submitted_at ON saln_submissions(status, submitted_at) WHERE status != 'draft';

-- Notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- Audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_date ON audit_logs(entity_type, entity_id, created_at);

-- =========================================
-- Text search indexes (for future search features)
-- =========================================

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_pds_personal_info_citizenship_gin ON pds_personal_info USING GIN (citizenship);
CREATE INDEX IF NOT EXISTS idx_pds_personal_info_addresses_gin ON pds_personal_info USING GIN (residential_address, permanent_address);
CREATE INDEX IF NOT EXISTS idx_pds_other_info_skills_gin ON pds_other_info USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_pds_other_info_recognitions_gin ON pds_other_info USING GIN (recognitions);

-- Full text search preparation (can be enabled later)
-- CREATE INDEX IF NOT EXISTS idx_pds_personal_info_fulltext ON pds_personal_info USING GIN (to_tsvector('english', surname || ' ' || first_name || ' ' || COALESCE(middle_name, '')));

-- =========================================
-- Database statistics update
-- =========================================

-- Update table statistics for better query planning
ANALYZE profiles;
ANALYZE departments;
ANALYZE positions;
ANALYZE pds_submissions;
ANALYZE saln_submissions;
ANALYZE submission_deadlines;
ANALYZE approval_workflows;
ANALYZE audit_logs;
ANALYZE notifications;