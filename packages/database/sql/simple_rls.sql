-- =========================================
-- Simple Row Level Security (RLS) for Supabase + Drizzle
-- SmartGov PDS/SALN System
-- =========================================

-- Enable RLS on key tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_family_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_civil_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_voluntary_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_other_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_real_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_personal_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_business_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_relatives_in_gov ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Basic Policies
-- =========================================

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL USING (id = auth.uid());

-- Allow service role to bypass RLS for profile creation
CREATE POLICY "service_role_profiles" ON profiles
  FOR ALL TO service_role USING (true);

-- PDS Submissions: Users own their submissions
CREATE POLICY "pds_submissions_policy" ON pds_submissions
  FOR ALL USING (user_id = auth.uid());

-- PDS related tables: Access through submission ownership
CREATE POLICY "pds_personal_info_policy" ON pds_personal_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_personal_info.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_family_background_policy" ON pds_family_background
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_family_background.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_children_policy" ON pds_children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_children.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_education_policy" ON pds_education
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_education.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_civil_service_policy" ON pds_civil_service
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_civil_service.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_work_experience_policy" ON pds_work_experience
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_work_experience.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_voluntary_work_policy" ON pds_voluntary_work
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_voluntary_work.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_training_policy" ON pds_training
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_training.pds_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "pds_other_info_policy" ON pds_other_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions
      WHERE id = pds_other_info.pds_submission_id
      AND user_id = auth.uid()
    )
  );

-- SALN Submissions: Users own their submissions
CREATE POLICY "saln_submissions_policy" ON saln_submissions
  FOR ALL USING (user_id = auth.uid());

-- SALN related tables: Access through submission ownership
CREATE POLICY "saln_real_properties_policy" ON saln_real_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE id = saln_real_properties.saln_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "saln_personal_properties_policy" ON saln_personal_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE id = saln_personal_properties.saln_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "saln_liabilities_policy" ON saln_liabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE id = saln_liabilities.saln_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "saln_business_interests_policy" ON saln_business_interests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE id = saln_business_interests.saln_submission_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "saln_relatives_in_gov_policy" ON saln_relatives_in_gov
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE id = saln_relatives_in_gov.saln_submission_id
      AND user_id = auth.uid()
    )
  );

-- Notifications: Users see their own notifications
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: Users can only see their own actions
CREATE POLICY "audit_logs_policy" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Allow system to insert audit logs
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =========================================
-- Public tables (no RLS needed)
-- =========================================
-- departments, positions, submission_deadlines can remain public for reading
-- approval_workflows and archives will be handled by application logic