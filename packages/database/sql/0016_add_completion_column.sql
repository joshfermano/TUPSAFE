-- Add completion column to pds_submissions and saln_submissions tables
-- This stores the computed completion percentage (0-100) based on submission readiness

-- Add completion column to pds_submissions
ALTER TABLE pds_submissions
ADD COLUMN IF NOT EXISTS completion INTEGER DEFAULT 0 NOT NULL;

-- Add completion column to saln_submissions  
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS completion INTEGER DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pds_submissions.completion IS 'Completion percentage (0-100) based on submission readiness. 100% means personal info is complete and has ≥3 character references.';
COMMENT ON COLUMN saln_submissions.completion IS 'Completion percentage (0-100) based on submission readiness. 100% means declarant info is complete and has at least one asset.';

