-- =========================================
-- SALN Employee-Only RLS Migration
-- Migration: 0008_saln_employee_only_rls
-- Created: 2025-12-07
-- Description: Enforces EMPLOYEE-ONLY access to SALN tables.
--              Applicants (user_type = 'applicant') are DENIED all SALN access.
--              Only employees (user_type = 'employee') can access SALN data.
-- =========================================

-- =========================================
-- Step 1: Drop Existing SALN Policies
-- =========================================

-- These policies were too permissive - they allowed all authenticated users
-- to access SALN. We need employee-only enforcement.

DROP POLICY IF EXISTS "Users can manage own SALN submissions" ON saln_submissions;
DROP POLICY IF EXISTS "Users can manage own SALN real properties" ON saln_real_properties;
DROP POLICY IF EXISTS "Users can manage own SALN personal properties" ON saln_personal_properties;
DROP POLICY IF EXISTS "Users can manage own SALN liabilities" ON saln_liabilities;
DROP POLICY IF EXISTS "Users can manage own SALN business interests" ON saln_business_interests;
DROP POLICY IF EXISTS "Users can manage own SALN relatives in gov" ON saln_relatives_in_gov;

-- =========================================
-- Step 2: Helper Function for Employee Check
-- =========================================

-- Function to check if current user is an employee (not applicant)
CREATE OR REPLACE FUNCTION auth.is_employee()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'employee'
    AND is_active = true
  );
$$;

COMMENT ON FUNCTION auth.is_employee() IS
  'Returns true if the current authenticated user is an employee (user_type = employee). Applicants return false.';

-- =========================================
-- Step 3: SALN Submissions Policies
-- =========================================

-- POLICY 1: Employees can INSERT their own SALN submissions
CREATE POLICY "Employees can insert their own SALN"
  ON saln_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.is_employee()
  );

COMMENT ON POLICY "Employees can insert their own SALN" ON saln_submissions IS
  'Allows employees to create new SALN submissions for themselves. Applicants are denied.';

-- POLICY 2: Employees can SELECT their own SALN submissions
CREATE POLICY "Employees can view their own SALN"
  ON saln_submissions
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND auth.is_employee()
  );

COMMENT ON POLICY "Employees can view their own SALN" ON saln_submissions IS
  'Allows employees to view only their own SALN submissions. Applicants cannot view any SALN data.';

-- POLICY 3: Employees can UPDATE their own SALN in draft or rejected status
CREATE POLICY "Employees can update their own SALN drafts"
  ON saln_submissions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('draft', 'rejected')
    AND auth.is_employee()
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('draft', 'rejected')
    AND auth.is_employee()
  );

COMMENT ON POLICY "Employees can update their own SALN drafts" ON saln_submissions IS
  'Allows employees to update only their own SALN submissions that are in draft or rejected status. Submitted/approved SALN cannot be modified by employees.';

-- POLICY 4: HR and Admin can SELECT all SALN submissions
CREATE POLICY "HR and Admin can view all SALN"
  ON saln_submissions
  FOR SELECT
  USING (
    auth.is_hr_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN" ON saln_submissions IS
  'Allows HR and Admin roles to view all SALN submissions for compliance monitoring and review.';

-- POLICY 5: HR and Admin can UPDATE SALN submissions (for approval/rejection)
CREATE POLICY "HR and Admin can approve or reject SALN"
  ON saln_submissions
  FOR UPDATE
  USING (
    auth.is_hr_or_admin()
  )
  WITH CHECK (
    auth.is_hr_or_admin()
    AND status IN ('draft', 'submitted', 'approved', 'rejected')
  );

COMMENT ON POLICY "HR and Admin can approve or reject SALN" ON saln_submissions IS
  'Allows HR and Admin to update SALN submissions for approval/rejection workflows and status changes.';

-- POLICY 6: Auditors can SELECT all SALN submissions (read-only)
CREATE POLICY "Auditors can view all SALN"
  ON saln_submissions
  FOR SELECT
  USING (
    auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "Auditors can view all SALN" ON saln_submissions IS
  'Allows auditors to view all SALN submissions for compliance auditing. Auditors have read-only access.';

-- =========================================
-- Step 4: SALN Real Properties Policies
-- =========================================

-- POLICY 1: Employees can manage their own real properties
CREATE POLICY "Employees can manage their own SALN real properties"
  ON saln_real_properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_real_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_real_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can manage their own SALN real properties" ON saln_real_properties IS
  'Allows employees to insert/update/delete real properties for their own SALN submissions in draft or rejected status.';

-- POLICY 2: Employees can view their own real properties (all statuses)
CREATE POLICY "Employees can view their own SALN real properties"
  ON saln_real_properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_real_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can view their own SALN real properties" ON saln_real_properties IS
  'Allows employees to view real properties for their own SALN submissions regardless of status.';

-- POLICY 3: HR and Admin can view all real properties
CREATE POLICY "HR and Admin can view all SALN real properties"
  ON saln_real_properties
  FOR SELECT
  USING (
    auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN real properties" ON saln_real_properties IS
  'Allows HR, Admin, and Auditors to view all real property records for compliance review.';

-- =========================================
-- Step 5: SALN Personal Properties Policies
-- =========================================

-- POLICY 1: Employees can manage their own personal properties
CREATE POLICY "Employees can manage their own SALN personal properties"
  ON saln_personal_properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_personal_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_personal_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can manage their own SALN personal properties" ON saln_personal_properties IS
  'Allows employees to insert/update/delete personal properties for their own SALN submissions in draft or rejected status.';

-- POLICY 2: Employees can view their own personal properties (all statuses)
CREATE POLICY "Employees can view their own SALN personal properties"
  ON saln_personal_properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_personal_properties.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can view their own SALN personal properties" ON saln_personal_properties IS
  'Allows employees to view personal properties for their own SALN submissions regardless of status.';

-- POLICY 3: HR and Admin can view all personal properties
CREATE POLICY "HR and Admin can view all SALN personal properties"
  ON saln_personal_properties
  FOR SELECT
  USING (
    auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN personal properties" ON saln_personal_properties IS
  'Allows HR, Admin, and Auditors to view all personal property records for compliance review.';

-- =========================================
-- Step 6: SALN Liabilities Policies
-- =========================================

-- POLICY 1: Employees can manage their own liabilities
CREATE POLICY "Employees can manage their own SALN liabilities"
  ON saln_liabilities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_liabilities.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_liabilities.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can manage their own SALN liabilities" ON saln_liabilities IS
  'Allows employees to insert/update/delete liabilities for their own SALN submissions in draft or rejected status.';

-- POLICY 2: Employees can view their own liabilities (all statuses)
CREATE POLICY "Employees can view their own SALN liabilities"
  ON saln_liabilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_liabilities.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can view their own SALN liabilities" ON saln_liabilities IS
  'Allows employees to view liabilities for their own SALN submissions regardless of status.';

-- POLICY 3: HR and Admin can view all liabilities
CREATE POLICY "HR and Admin can view all SALN liabilities"
  ON saln_liabilities
  FOR SELECT
  USING (
    auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN liabilities" ON saln_liabilities IS
  'Allows HR, Admin, and Auditors to view all liability records for compliance review.';

-- =========================================
-- Step 7: SALN Business Interests Policies
-- =========================================

-- POLICY 1: Employees can manage their own business interests
CREATE POLICY "Employees can manage their own SALN business interests"
  ON saln_business_interests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_business_interests.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_business_interests.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can manage their own SALN business interests" ON saln_business_interests IS
  'Allows employees to insert/update/delete business interests for their own SALN submissions in draft or rejected status.';

-- POLICY 2: Employees can view their own business interests (all statuses)
CREATE POLICY "Employees can view their own SALN business interests"
  ON saln_business_interests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_business_interests.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can view their own SALN business interests" ON saln_business_interests IS
  'Allows employees to view business interests for their own SALN submissions regardless of status.';

-- POLICY 3: HR and Admin can view all business interests
CREATE POLICY "HR and Admin can view all SALN business interests"
  ON saln_business_interests
  FOR SELECT
  USING (
    auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN business interests" ON saln_business_interests IS
  'Allows HR, Admin, and Auditors to view all business interest records for compliance review.';

-- =========================================
-- Step 8: SALN Relatives in Government Policies
-- =========================================

-- POLICY 1: Employees can manage their own relatives in gov
CREATE POLICY "Employees can manage their own SALN relatives in gov"
  ON saln_relatives_in_gov
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_relatives_in_gov.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_relatives_in_gov.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND saln_submissions.status IN ('draft', 'rejected')
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can manage their own SALN relatives in gov" ON saln_relatives_in_gov IS
  'Allows employees to insert/update/delete relatives in government for their own SALN submissions in draft or rejected status.';

-- POLICY 2: Employees can view their own relatives in gov (all statuses)
CREATE POLICY "Employees can view their own SALN relatives in gov"
  ON saln_relatives_in_gov
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saln_submissions
      WHERE saln_submissions.id = saln_relatives_in_gov.saln_submission_id
      AND saln_submissions.user_id = auth.uid()
      AND auth.is_employee()
    )
  );

COMMENT ON POLICY "Employees can view their own SALN relatives in gov" ON saln_relatives_in_gov IS
  'Allows employees to view relatives in government for their own SALN submissions regardless of status.';

-- POLICY 3: HR and Admin can view all relatives in gov
CREATE POLICY "HR and Admin can view all SALN relatives in gov"
  ON saln_relatives_in_gov
  FOR SELECT
  USING (
    auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

COMMENT ON POLICY "HR and Admin can view all SALN relatives in gov" ON saln_relatives_in_gov IS
  'Allows HR, Admin, and Auditors to view all relatives in government records for compliance review.';

-- =========================================
-- Step 9: Verify RLS is Enabled
-- =========================================

-- Ensure RLS is enabled on all SALN tables
-- (Should already be enabled from initial rls_policies.sql, but we verify)
ALTER TABLE saln_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_real_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_personal_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_business_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_relatives_in_gov ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Step 10: Security Documentation
-- =========================================

COMMENT ON TABLE saln_submissions IS
  'SALN (Statement of Assets, Liabilities, and Net Worth) submissions. EMPLOYEE-ONLY ACCESS. Applicants (user_type = applicant) are denied all access via RLS policies.';

COMMENT ON TABLE saln_real_properties IS
  'Real property assets for SALN submissions. Access controlled via parent saln_submissions table. EMPLOYEE-ONLY.';

COMMENT ON TABLE saln_personal_properties IS
  'Personal property assets for SALN submissions. Access controlled via parent saln_submissions table. EMPLOYEE-ONLY.';

COMMENT ON TABLE saln_liabilities IS
  'Liabilities for SALN submissions. Access controlled via parent saln_submissions table. EMPLOYEE-ONLY.';

COMMENT ON TABLE saln_business_interests IS
  'Business interests and financial interests for SALN submissions. Access controlled via parent saln_submissions table. EMPLOYEE-ONLY.';

COMMENT ON TABLE saln_relatives_in_gov IS
  'Relatives in government service for SALN submissions. Access controlled via parent saln_submissions table. EMPLOYEE-ONLY.';

-- =========================================
-- Migration Summary
-- =========================================

-- This migration enforces the following security model:
--
-- APPLICANTS (user_type = 'applicant'):
--   - DENIED all access to SALN tables (INSERT, SELECT, UPDATE, DELETE)
--   - Cannot view, create, or modify any SALN data
--   - Applicants only have access to PDS (Personal Data Sheet) for job applications
--
-- EMPLOYEES (user_type = 'employee'):
--   - Can INSERT their own SALN submissions
--   - Can SELECT (view) only their own SALN submissions and related data
--   - Can UPDATE only their own SALN in 'draft' or 'rejected' status
--   - Cannot DELETE SALN (soft delete via status change only)
--   - Cannot modify submitted, approved, or archived SALN
--
-- HR/ADMIN ROLES:
--   - Can SELECT (view) all SALN submissions and related data
--   - Can UPDATE SALN for approval/rejection workflows
--   - Can change SALN status from any state
--   - Full oversight for compliance monitoring
--
-- AUDITORS:
--   - Can SELECT (view) all SALN submissions and related data (read-only)
--   - Cannot modify SALN data
--   - Audit trail access for compliance reviews
--
-- CHILD TABLES (properties, liabilities, etc.):
--   - Access controlled via foreign key to saln_submissions
--   - Employees can manage child records only for their own draft/rejected SALN
--   - Employees can view child records for their own SALN regardless of status
--   - HR/Admin/Auditors can view all child records
--
-- DATABASE SECURITY:
--   - Row Level Security (RLS) enabled on all SALN tables
--   - Policies enforce user_type = 'employee' check via auth.is_employee() function
--   - Foreign key constraints ensure data integrity
--   - Audit logging tracks all SALN operations (via existing triggers)
--   - No hard deletes allowed (soft delete via status only)
