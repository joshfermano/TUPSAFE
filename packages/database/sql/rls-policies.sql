-- ============================================================================
-- TUPSAFE Row Level Security (RLS) Policies
-- ============================================================================
-- This file contains comprehensive RLS policies for all tables
-- Execute these policies AFTER creating the schema and before seeding data
--
-- WARNING: Test these policies thoroughly in a development environment first!
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE submission_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin, co-admin, or HR
CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'co_admin', 'hr')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is supervisor
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'supervisor'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is auditor
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'auditor'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins and HR can read all profiles
CREATE POLICY "Admins and HR can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin_or_hr());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent users from changing these fields
  role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
  is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_hr());

-- ============================================================================
-- DEPARTMENTS & POSITIONS POLICIES
-- ============================================================================

-- All authenticated users can read departments and positions
CREATE POLICY "Authenticated users can view departments"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view positions"
ON positions FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify departments and positions
CREATE POLICY "Admins can manage departments"
ON departments FOR ALL
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

CREATE POLICY "Admins can manage positions"
ON positions FOR ALL
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

-- ============================================================================
-- PDS SUBMISSIONS POLICIES
-- ============================================================================

-- Users can read their own PDS submissions
CREATE POLICY "Users can view own PDS submissions"
ON pds_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins/HR can read all PDS submissions
CREATE POLICY "Admins and HR can view all PDS submissions"
ON pds_submissions FOR SELECT
TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

-- Users can create their own PDS submissions
CREATE POLICY "Users can create own PDS submissions"
ON pds_submissions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own DRAFT PDS submissions only
CREATE POLICY "Users can update own draft PDS"
ON pds_submissions FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft')
WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'submitted'));

-- Admins/HR can update any PDS submission
CREATE POLICY "Admins and HR can update any PDS submission"
ON pds_submissions FOR UPDATE
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

-- Users can delete their own DRAFT PDS submissions
CREATE POLICY "Users can delete own draft PDS"
ON pds_submissions FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- ============================================================================
-- PDS RELATED TABLES POLICIES (Cascade from pds_submissions)
-- ============================================================================

-- PDS Personal Info
CREATE POLICY "Users can view own PDS personal info"
ON pds_personal_info FOR SELECT
TO authenticated
USING (
  pds_submission_id IN (
    SELECT id FROM pds_submissions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all PDS personal info"
ON pds_personal_info FOR SELECT
TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can insert own PDS personal info"
ON pds_personal_info FOR INSERT
TO authenticated
WITH CHECK (
  pds_submission_id IN (
    SELECT id FROM pds_submissions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own draft PDS personal info"
ON pds_personal_info FOR UPDATE
TO authenticated
USING (
  pds_submission_id IN (
    SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'
  )
);

CREATE POLICY "Admins can manage all PDS personal info"
ON pds_personal_info FOR ALL
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

-- Apply similar policies to all PDS-related tables
-- PDS Family Background
CREATE POLICY "Users can view own PDS family" ON pds_family_background FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS family" ON pds_family_background FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS family" ON pds_family_background FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS family" ON pds_family_background FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Children
CREATE POLICY "Users can view own PDS children" ON pds_children FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS children" ON pds_children FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS children" ON pds_children FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS children" ON pds_children FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Education
CREATE POLICY "Users can view own PDS education" ON pds_education FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS education" ON pds_education FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS education" ON pds_education FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS education" ON pds_education FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Civil Service
CREATE POLICY "Users can view own PDS civil service" ON pds_civil_service FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS civil service" ON pds_civil_service FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS civil service" ON pds_civil_service FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS civil service" ON pds_civil_service FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Work Experience
CREATE POLICY "Users can view own PDS work experience" ON pds_work_experience FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS work experience" ON pds_work_experience FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS work experience" ON pds_work_experience FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS work experience" ON pds_work_experience FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Voluntary Work
CREATE POLICY "Users can view own PDS voluntary work" ON pds_voluntary_work FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS voluntary work" ON pds_voluntary_work FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS voluntary work" ON pds_voluntary_work FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS voluntary work" ON pds_voluntary_work FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Training
CREATE POLICY "Users can view own PDS training" ON pds_training FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS training" ON pds_training FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS training" ON pds_training FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS training" ON pds_training FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- PDS Other Info
CREATE POLICY "Users can view own PDS other info" ON pds_other_info FOR SELECT TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all PDS other info" ON pds_other_info FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own PDS other info" ON pds_other_info FOR ALL TO authenticated
USING (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (pds_submission_id IN (SELECT id FROM pds_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all PDS other info" ON pds_other_info FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- ============================================================================
-- SALN SUBMISSIONS POLICIES
-- ============================================================================

-- Users can read their own SALN submissions
CREATE POLICY "Users can view own SALN submissions"
ON saln_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins/HR can read all SALN submissions
CREATE POLICY "Admins and HR can view all SALN submissions"
ON saln_submissions FOR SELECT
TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

-- Users can create their own SALN submissions
CREATE POLICY "Users can create own SALN submissions"
ON saln_submissions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own DRAFT SALN submissions only
CREATE POLICY "Users can update own draft SALN"
ON saln_submissions FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft')
WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'submitted'));

-- Admins/HR can update any SALN submission
CREATE POLICY "Admins and HR can update any SALN submission"
ON saln_submissions FOR UPDATE
TO authenticated
USING (is_admin_or_hr())
WITH CHECK (is_admin_or_hr());

-- Users can delete their own DRAFT SALN submissions
CREATE POLICY "Users can delete own draft SALN"
ON saln_submissions FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- ============================================================================
-- SALN RELATED TABLES POLICIES (Similar to PDS)
-- ============================================================================

-- SALN Real Properties
CREATE POLICY "Users can view own SALN real properties" ON saln_real_properties FOR SELECT TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all SALN real properties" ON saln_real_properties FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own SALN real properties" ON saln_real_properties FOR ALL TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all SALN real properties" ON saln_real_properties FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- SALN Personal Properties
CREATE POLICY "Users can view own SALN personal properties" ON saln_personal_properties FOR SELECT TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all SALN personal properties" ON saln_personal_properties FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own SALN personal properties" ON saln_personal_properties FOR ALL TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all SALN personal properties" ON saln_personal_properties FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- SALN Liabilities
CREATE POLICY "Users can view own SALN liabilities" ON saln_liabilities FOR SELECT TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all SALN liabilities" ON saln_liabilities FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own SALN liabilities" ON saln_liabilities FOR ALL TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all SALN liabilities" ON saln_liabilities FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- SALN Business Interests
CREATE POLICY "Users can view own SALN business interests" ON saln_business_interests FOR SELECT TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all SALN business interests" ON saln_business_interests FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own SALN business interests" ON saln_business_interests FOR ALL TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all SALN business interests" ON saln_business_interests FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- SALN Relatives in Government
CREATE POLICY "Users can view own SALN relatives" ON saln_relatives_in_gov FOR SELECT TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all SALN relatives" ON saln_relatives_in_gov FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_supervisor() OR is_auditor());

CREATE POLICY "Users can manage own SALN relatives" ON saln_relatives_in_gov FOR ALL TO authenticated
USING (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid() AND status = 'draft'))
WITH CHECK (saln_submission_id IN (SELECT id FROM saln_submissions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all SALN relatives" ON saln_relatives_in_gov FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- ============================================================================
-- ADMINISTRATIVE TABLES POLICIES
-- ============================================================================

-- Submission Deadlines - All authenticated users can read, only admins can modify
CREATE POLICY "All users can view deadlines" ON submission_deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage deadlines" ON submission_deadlines FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- Approval Workflows
CREATE POLICY "Users can view own approval workflows" ON approval_workflows FOR SELECT TO authenticated
USING (approver_id = auth.uid());

CREATE POLICY "Admins can view all approval workflows" ON approval_workflows FOR SELECT TO authenticated
USING (is_admin_or_hr());

CREATE POLICY "System can insert approval workflows" ON approval_workflows FOR INSERT TO authenticated
WITH CHECK (is_admin_or_hr());

CREATE POLICY "Approvers can update own workflows" ON approval_workflows FOR UPDATE TO authenticated
USING (approver_id = auth.uid())
WITH CHECK (approver_id = auth.uid());

-- Audit Logs - Read-only for admins, system can insert
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT TO authenticated
USING (is_admin_or_hr() OR is_auditor());

CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true); -- All authenticated users can create audit logs

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated
WITH CHECK (true); -- System-generated notifications

CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Archives - Admin/HR only
CREATE POLICY "Admins can manage archives" ON archives FOR ALL TO authenticated
USING (is_admin_or_hr()) WITH CHECK (is_admin_or_hr());

-- ============================================================================
-- STORAGE POLICIES (Must be set manually in Supabase Dashboard)
-- ============================================================================

/*
IMPORTANT: Storage policies must be created in Supabase Dashboard under Storage > Policies

Example policies:

-- PDS Submissions bucket
-- SELECT: Users can view their own files
CREATE POLICY "Users can view own PDS files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT: Users can upload their own files
CREATE POLICY "Users can upload own PDS files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Users can update their own files
CREATE POLICY "Users can update own PDS files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can delete their own files
CREATE POLICY "Users can delete own PDS files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins have full access
CREATE POLICY "Admins have full access to PDS files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  is_admin_or_hr()
);

*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify policies are working:
/*
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test as regular user (should only see own data)
SET ROLE authenticated;
SET request.jwt.claims.sub TO '[user-uuid]';
SELECT * FROM pds_submissions;

-- Test as admin (should see all data)
SET ROLE authenticated;
SET request.jwt.claims.sub TO '[admin-uuid]';
SELECT * FROM pds_submissions;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
1. RLS policies are enforced at the PostgreSQL level
2. Policies work in conjunction with Supabase Auth
3. Test policies thoroughly before deploying to production
4. Monitor slow query logs - complex RLS policies can impact performance
5. Consider creating materialized views for complex reporting queries
6. Use SECURITY DEFINER functions carefully - they bypass RLS
7. Audit logs are critical - ensure they cannot be tampered with
8. Storage policies must be set up separately in Supabase Dashboard
9. Review and update policies as requirements change
10. Document any policy changes in version control
*/

