/**
 * Migration 0011: Relax User Type ID Constraint for Rejected/Inactive Users
 *
 * Problem: The current constraint prevents deletion of employees without employee_id
 * Solution: Allow NULL employee_id/applicant_id for rejected or inactive accounts
 *
 * This allows:
 * - Pending users without IDs (for registration flow)
 * - Rejected users without IDs (for failed registrations or deletions)
 * - Inactive users without IDs (for soft deletes)
 *
 * Still enforces:
 * - Active employees MUST have employee_id
 * - Active applicants MUST have applicant_id
 */

-- Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_user_type_id;

-- Add the updated constraint with relaxed rules for rejected/inactive
ALTER TABLE profiles ADD CONSTRAINT chk_user_type_id CHECK (
  -- Allow NULL IDs for pending accounts (registration in progress)
  account_status = 'pending' OR
  -- Allow NULL IDs for rejected accounts (failed registration or admin rejection)
  account_status = 'rejected' OR
  -- Allow NULL IDs for inactive accounts (soft deleted)
  is_active = false OR
  -- Otherwise enforce the ID requirement based on user type for active accounts
  (user_type = 'employee' AND employee_id IS NOT NULL) OR
  (user_type = 'applicant' AND applicant_id IS NOT NULL)
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT chk_user_type_id ON profiles IS
  'Ensures user_type matches the assigned ID, but allows NULL IDs for pending, rejected, or inactive users';
