-- =========================================
-- SALN RLS Policy Testing Script
-- =========================================
-- Use this script to verify that the employee-only RLS policies
-- are working correctly after applying migration 0008.
--
-- Run these tests with different user contexts:
-- 1. As an employee user (should succeed)
-- 2. As an applicant user (should fail/return 0 rows)
-- 3. As an HR/Admin user (should see all data)
-- =========================================

-- =========================================
-- Pre-Test: Verify Policy Installation
-- =========================================

-- Check that all SALN policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE tablename LIKE 'saln%'
ORDER BY tablename, policyname;

-- Expected: 18 policies total (3 per table × 6 tables)
-- - saln_submissions: 6 policies
-- - saln_real_properties: 3 policies
-- - saln_personal_properties: 3 policies
-- - saln_liabilities: 3 policies
-- - saln_business_interests: 3 policies
-- - saln_relatives_in_gov: 3 policies

-- =========================================
-- Pre-Test: Verify Helper Functions
-- =========================================

-- Check that auth.is_employee() function exists
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'is_employee'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- Expected: Should return the is_employee() function definition

-- =========================================
-- Test Setup: Create Test Users
-- =========================================

-- NOTE: This is for reference only. In practice, you'll need to:
-- 1. Create users via Supabase Auth UI or API
-- 2. Insert corresponding profiles via application code
-- 3. Set auth context using supabase.auth.signIn()

-- Example profiles structure:
-- Employee: { id: '...', user_type: 'employee', role: 'employee', is_active: true }
-- Applicant: { id: '...', user_type: 'applicant', role: 'applicant', is_active: true }
-- HR: { id: '...', user_type: 'employee', role: 'hr', is_active: true }

-- =========================================
-- Test 1: Verify RLS is Enabled
-- =========================================

-- Check that RLS is enabled on all SALN tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename LIKE 'saln%'
  AND schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should have rls_enabled = true

-- =========================================
-- Test 2: Employee Access Tests
-- =========================================

-- As an EMPLOYEE user, these should SUCCEED:

-- Test 2.1: View own SALN submissions
SELECT COUNT(*) AS my_saln_count
FROM saln_submissions
WHERE user_id = auth.uid();
-- Expected: Returns count of employee's own SALN submissions

-- Test 2.2: View own real properties
SELECT COUNT(*) AS my_properties_count
FROM saln_real_properties rp
WHERE EXISTS (
  SELECT 1 FROM saln_submissions ss
  WHERE ss.id = rp.saln_submission_id
  AND ss.user_id = auth.uid()
);
-- Expected: Returns count of employee's own real properties

-- Test 2.3: Insert new SALN submission (draft)
INSERT INTO saln_submissions (id, user_id, year, status, total_assets, total_liabilities, net_worth)
VALUES (
  gen_random_uuid(),
  auth.uid(),
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  'draft',
  0,
  0,
  0
)
RETURNING id, status;
-- Expected: Successfully creates new SALN in draft status

-- Test 2.4: Insert real property for draft SALN
-- (Use the ID from Test 2.3)
INSERT INTO saln_real_properties (
  id,
  saln_submission_id,
  description,
  kind,
  exact_location,
  assessed_value,
  current_fair_market_value,
  acquisition_year,
  acquisition_mode,
  acquisition_cost
)
VALUES (
  gen_random_uuid(),
  '<insert-saln-id-from-test-2.3>',
  'Residential House',
  'residential',
  'Manila, Philippines',
  1000000.00,
  1500000.00,
  2020,
  'Purchase',
  1200000.00
)
RETURNING id, description;
-- Expected: Successfully creates real property record

-- Test 2.5: Update own draft SALN
UPDATE saln_submissions
SET total_assets = 1500000.00
WHERE user_id = auth.uid()
  AND status = 'draft'
RETURNING id, total_assets;
-- Expected: Successfully updates draft SALN

-- Test 2.6: Try to update submitted SALN (should FAIL)
UPDATE saln_submissions
SET total_assets = 2000000.00
WHERE user_id = auth.uid()
  AND status = 'submitted'
RETURNING id;
-- Expected: 0 rows updated (policy blocks modification of submitted SALN)

-- =========================================
-- Test 3: Applicant Access Tests (Should FAIL)
-- =========================================

-- As an APPLICANT user, these should FAIL or return 0 rows:

-- Test 3.1: View SALN submissions (should return 0 rows)
SELECT COUNT(*) AS saln_count
FROM saln_submissions;
-- Expected: Returns 0 (applicants cannot see any SALN data)

-- Test 3.2: Insert SALN submission (should FAIL)
INSERT INTO saln_submissions (id, user_id, year, status, total_assets, total_liabilities, net_worth)
VALUES (
  gen_random_uuid(),
  auth.uid(),
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  'draft',
  0,
  0,
  0
);
-- Expected: ERROR - new row violates row-level security policy

-- Test 3.3: View real properties (should return 0 rows)
SELECT COUNT(*) AS properties_count
FROM saln_real_properties;
-- Expected: Returns 0 (applicants cannot see any SALN data)

-- Test 3.4: Insert real property (should FAIL)
INSERT INTO saln_real_properties (
  id,
  saln_submission_id,
  description,
  kind,
  exact_location,
  assessed_value,
  current_fair_market_value,
  acquisition_year,
  acquisition_mode,
  acquisition_cost
)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Test Property',
  'residential',
  'Test Location',
  100000.00,
  150000.00,
  2020,
  'Purchase',
  120000.00
);
-- Expected: ERROR - new row violates row-level security policy

-- =========================================
-- Test 4: HR/Admin Access Tests
-- =========================================

-- As an HR or ADMIN user, these should SUCCEED:

-- Test 4.1: View all SALN submissions
SELECT
  COUNT(*) AS total_saln_count,
  COUNT(DISTINCT user_id) AS unique_employees
FROM saln_submissions;
-- Expected: Returns counts of all SALN submissions across all employees

-- Test 4.2: View all real properties
SELECT COUNT(*) AS total_properties
FROM saln_real_properties;
-- Expected: Returns count of all real properties across all employees

-- Test 4.3: View specific employee's SALN
SELECT
  ss.id,
  ss.year,
  ss.status,
  p.first_name,
  p.last_name
FROM saln_submissions ss
JOIN profiles p ON p.id = ss.user_id
WHERE p.user_type = 'employee'
LIMIT 5;
-- Expected: Returns SALN submissions with employee details

-- Test 4.4: Approve a SALN submission
UPDATE saln_submissions
SET
  status = 'approved',
  approved_by = auth.uid(),
  approved_at = NOW()
WHERE status = 'submitted'
  AND id = '<some-submitted-saln-id>'
RETURNING id, status, approved_at;
-- Expected: Successfully updates SALN to approved status

-- =========================================
-- Test 5: Auditor Access Tests
-- =========================================

-- As an AUDITOR user:

-- Test 5.1: View all SALN submissions (read-only)
SELECT
  COUNT(*) AS total_saln,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_saln,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_saln
FROM saln_submissions;
-- Expected: Returns counts of all SALN submissions

-- Test 5.2: View all child table data
SELECT
  'real_properties' AS table_name,
  COUNT(*) AS record_count
FROM saln_real_properties
UNION ALL
SELECT
  'personal_properties',
  COUNT(*)
FROM saln_personal_properties
UNION ALL
SELECT
  'liabilities',
  COUNT(*)
FROM saln_liabilities
UNION ALL
SELECT
  'business_interests',
  COUNT(*)
FROM saln_business_interests
UNION ALL
SELECT
  'relatives_in_gov',
  COUNT(*)
FROM saln_relatives_in_gov;
-- Expected: Returns counts for all child tables

-- Test 5.3: Try to update SALN (should FAIL)
UPDATE saln_submissions
SET total_assets = 9999999.99
WHERE id = '<some-saln-id>';
-- Expected: 0 rows updated (auditors have read-only access)

-- =========================================
-- Test 6: Cross-User Access Tests
-- =========================================

-- Test 6.1: Employee A tries to view Employee B's SALN (should return 0 rows)
-- As Employee A:
SELECT COUNT(*)
FROM saln_submissions
WHERE user_id != auth.uid();
-- Expected: Returns 0 (employees can only see their own data)

-- Test 6.2: Employee tries to update another employee's SALN (should FAIL)
-- As Employee A:
UPDATE saln_submissions
SET total_assets = 1000000.00
WHERE user_id = '<employee-b-user-id>'
  AND status = 'draft';
-- Expected: 0 rows updated (can only update own SALN)

-- =========================================
-- Test 7: Status-Based Update Tests
-- =========================================

-- Test 7.1: Employee updates draft SALN (should SUCCEED)
UPDATE saln_submissions
SET total_assets = 500000.00
WHERE user_id = auth.uid()
  AND status = 'draft'
RETURNING id, status, total_assets;
-- Expected: Successfully updates

-- Test 7.2: Employee updates rejected SALN (should SUCCEED)
UPDATE saln_submissions
SET total_assets = 600000.00
WHERE user_id = auth.uid()
  AND status = 'rejected'
RETURNING id, status, total_assets;
-- Expected: Successfully updates

-- Test 7.3: Employee updates submitted SALN (should FAIL)
UPDATE saln_submissions
SET total_assets = 700000.00
WHERE user_id = auth.uid()
  AND status = 'submitted'
RETURNING id, status;
-- Expected: 0 rows updated (cannot modify submitted SALN)

-- Test 7.4: Employee updates approved SALN (should FAIL)
UPDATE saln_submissions
SET total_assets = 800000.00
WHERE user_id = auth.uid()
  AND status = 'approved'
RETURNING id, status;
-- Expected: 0 rows updated (cannot modify approved SALN)

-- =========================================
-- Test 8: Child Table Update Tests
-- =========================================

-- Test 8.1: Update property in draft SALN (should SUCCEED)
UPDATE saln_real_properties
SET assessed_value = 1100000.00
WHERE id IN (
  SELECT rp.id
  FROM saln_real_properties rp
  JOIN saln_submissions ss ON ss.id = rp.saln_submission_id
  WHERE ss.user_id = auth.uid()
    AND ss.status = 'draft'
  LIMIT 1
)
RETURNING id, assessed_value;
-- Expected: Successfully updates

-- Test 8.2: Update property in submitted SALN (should FAIL)
UPDATE saln_real_properties
SET assessed_value = 1200000.00
WHERE id IN (
  SELECT rp.id
  FROM saln_real_properties rp
  JOIN saln_submissions ss ON ss.id = rp.saln_submission_id
  WHERE ss.user_id = auth.uid()
    AND ss.status = 'submitted'
  LIMIT 1
)
RETURNING id;
-- Expected: 0 rows updated (cannot modify child data in submitted SALN)

-- Test 8.3: Delete property from draft SALN (should SUCCEED)
DELETE FROM saln_real_properties
WHERE id IN (
  SELECT rp.id
  FROM saln_real_properties rp
  JOIN saln_submissions ss ON ss.id = rp.saln_submission_id
  WHERE ss.user_id = auth.uid()
    AND ss.status = 'draft'
  LIMIT 1
)
RETURNING id;
-- Expected: Successfully deletes
-- NOTE: Generally avoid DELETE; use soft delete in production

-- =========================================
-- Test 9: Performance Tests
-- =========================================

-- Test 9.1: Check query plan for employee viewing own SALN
EXPLAIN ANALYZE
SELECT *
FROM saln_submissions
WHERE user_id = auth.uid();
-- Expected: Should use index on user_id, fast execution

-- Test 9.2: Check query plan for child table access
EXPLAIN ANALYZE
SELECT *
FROM saln_real_properties rp
WHERE EXISTS (
  SELECT 1 FROM saln_submissions ss
  WHERE ss.id = rp.saln_submission_id
  AND ss.user_id = auth.uid()
);
-- Expected: Should use indexes efficiently, no table scans

-- =========================================
-- Test 10: Helper Function Tests
-- =========================================

-- Test 10.1: Check is_employee() for employee user
SELECT auth.is_employee() AS is_employee;
-- Expected: Returns true (when run as employee)

-- Test 10.2: Check is_employee() for applicant user
SELECT auth.is_employee() AS is_employee;
-- Expected: Returns false (when run as applicant)

-- Test 10.3: Check is_employee() for inactive employee
-- (Requires setting is_active = false in profiles first)
SELECT auth.is_employee() AS is_employee;
-- Expected: Returns false (inactive users denied)

-- =========================================
-- Test 11: Cleanup (Optional)
-- =========================================

-- Delete test data created during testing
-- WARNING: Only run if you created test data specifically for these tests

-- Delete test real properties
DELETE FROM saln_real_properties
WHERE saln_submission_id IN (
  SELECT id FROM saln_submissions
  WHERE user_id = auth.uid()
  AND status = 'draft'
  AND created_at > NOW() - INTERVAL '1 hour'
);

-- Delete test SALN submissions
DELETE FROM saln_submissions
WHERE user_id = auth.uid()
  AND status = 'draft'
  AND created_at > NOW() - INTERVAL '1 hour';

-- =========================================
-- Summary
-- =========================================

-- After running all tests, you should have verified:
-- ✅ RLS is enabled on all SALN tables
-- ✅ Helper function auth.is_employee() works correctly
-- ✅ Employees can access only their own SALN data
-- ✅ Employees can modify only draft/rejected SALN
-- ✅ Applicants are completely denied SALN access
-- ✅ HR/Admin can view and modify all SALN
-- ✅ Auditors have read-only access to all SALN
-- ✅ Cross-user access is prevented
-- ✅ Child table access is controlled via parent submission
-- ✅ Query performance is acceptable
