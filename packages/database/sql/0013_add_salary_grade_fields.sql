-- Migration: Add salary_grade and position_title columns to profiles table
-- These fields support the new employee profile editing capabilities

-- Salary grade column (1-33 per Philippine Salary Standardization Law V)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_grade INTEGER;

-- Position title column (custom text for manual entry)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position_title TEXT;

-- Add check constraint for salary grade (1-33 range)
ALTER TABLE profiles ADD CONSTRAINT profiles_salary_grade_check
CHECK (salary_grade IS NULL OR (salary_grade >= 1 AND salary_grade <= 33));

-- Index for salary grade queries
CREATE INDEX IF NOT EXISTS profiles_salary_grade_idx ON profiles(salary_grade);

-- Comment on columns for documentation
COMMENT ON COLUMN profiles.salary_grade IS 'Salary Grade (SG) per Philippine Salary Standardization Law V (SSL V), range 1-33';
COMMENT ON COLUMN profiles.position_title IS 'Custom position title for manual entry, can be used alongside or instead of position_id';
