-- Migration: Update chk_user_type_id constraint to allow NULL IDs for pending accounts
-- Date: 2025-12-19
-- Description: Modify the user_type_id check constraint to allow pending accounts
--              to have NULL employeeId or applicantId values. IDs will be assigned
--              during admin approval process.

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_user_type_id;

-- Add updated constraint that allows NULL IDs for pending accounts
ALTER TABLE profiles ADD CONSTRAINT chk_user_type_id CHECK (
  -- Allow NULL IDs for pending accounts (will be assigned on approval)
  account_status = 'pending' OR
  -- Otherwise enforce the ID requirement based on user type
  (user_type = 'employee' AND employee_id IS NOT NULL) OR
  (user_type = 'applicant' AND applicant_id IS NOT NULL)
);

-- Add helpful comment explaining the constraint logic
COMMENT ON CONSTRAINT chk_user_type_id ON profiles IS
  'Ensures user_type matches assigned ID. Pending accounts may have NULL IDs until admin approval.';
