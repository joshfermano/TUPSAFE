-- Migration: Add year column to pds_submissions
-- Description: Implements annual PDS naming convention "Annual PDS - CY {year}"
-- Date: 2025-12-04

-- Step 1: Add year column (allow null temporarily for migration)
ALTER TABLE pds_submissions
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Step 2: Migrate existing data - extract year from submittedAt or createdAt
-- For submitted PDS, use submittedAt year
-- For drafts (no submittedAt), use createdAt year
UPDATE pds_submissions
SET year = EXTRACT(YEAR FROM COALESCE(submitted_at, created_at))::INTEGER
WHERE year IS NULL;

-- Step 3: Make the column NOT NULL after data migration
ALTER TABLE pds_submissions
ALTER COLUMN year SET NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN pds_submissions.year IS 'Calendar year for this PDS submission (e.g., 2025 for "Annual PDS - CY 2025"). Version numbers are per-year.';

-- Step 5: Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS pds_submissions_year_idx
ON pds_submissions(year);

CREATE INDEX IF NOT EXISTS pds_submissions_user_year_idx
ON pds_submissions(user_id, year);

CREATE INDEX IF NOT EXISTS pds_submissions_year_status_idx
ON pds_submissions(year, status);

-- Step 6: Create composite index for version calculation per user per year
CREATE INDEX IF NOT EXISTS pds_submissions_user_year_version_idx
ON pds_submissions(user_id, year, version);
