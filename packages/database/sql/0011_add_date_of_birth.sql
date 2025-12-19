-- Migration: Add date_of_birth column to profiles table
-- Date: 2025-12-19
-- Purpose: Support birth date-based employee ID generation (TUPM-MMDD-YY-###)

-- Add date_of_birth column to profiles table
ALTER TABLE profiles
ADD COLUMN date_of_birth DATE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.date_of_birth IS 'User birth date - required for employee ID generation (TUPM-MMDD-YY-###)';

-- Note: NOT NULL constraint added later in migration 0013_enforce_date_of_birth_constraint.sql
-- to allow gradual migration of existing employee records
