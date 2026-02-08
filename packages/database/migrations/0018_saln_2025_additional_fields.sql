-- Migration: Add Additional SALN 2025 Fields
-- Description: Adds first government ID, TIN fields, and spouse date of birth
-- for complete 2025 SALN compliance
--
-- Fields Added:
-- 1. First Government ID (for primary signature section)
-- 2. Declarant TIN and Spouse TIN
-- 3. Spouse Date of Birth

-- ============================================================================
-- FIRST GOVERNMENT ID FIELDS
-- The 2025 SALN format requires two government IDs (one for each signature)
-- The second ID fields already exist, now adding the first/primary ID fields
-- ============================================================================

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS government_id_type TEXT;

COMMENT ON COLUMN saln_submissions.government_id_type IS 'Type of first/primary government-issued ID (e.g., Driver''s License, Passport)';

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS government_id_number TEXT;

COMMENT ON COLUMN saln_submissions.government_id_number IS 'Number of first/primary government-issued ID';

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS government_id_date_issued DATE;

COMMENT ON COLUMN saln_submissions.government_id_date_issued IS 'Issue date of first/primary government-issued ID';

-- ============================================================================
-- TIN FIELDS
-- Tax Identification Numbers for declarant and spouse (2025 SALN requirement)
-- ============================================================================

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS declarant_tin TEXT;

COMMENT ON COLUMN saln_submissions.declarant_tin IS 'Tax Identification Number of the declarant';

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS spouse_tin TEXT;

COMMENT ON COLUMN saln_submissions.spouse_tin IS 'Tax Identification Number of the spouse (for joint filing)';

-- ============================================================================
-- SPOUSE DATE OF BIRTH
-- For joint filing, spouse date of birth improves compliance verification
-- ============================================================================

ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS spouse_date_of_birth DATE;

COMMENT ON COLUMN saln_submissions.spouse_date_of_birth IS 'Date of birth of the spouse (for joint filing)';

-- ============================================================================
-- INDEXES
-- Add indexes for TIN lookup (commonly queried for verification)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_saln_submissions_declarant_tin
ON saln_submissions (declarant_tin)
WHERE declarant_tin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saln_submissions_spouse_tin
ON saln_submissions (spouse_tin)
WHERE spouse_tin IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
    -- Check government_id_type exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saln_submissions' AND column_name = 'government_id_type'
    ) THEN
        RAISE EXCEPTION 'Column government_id_type was not created';
    END IF;

    -- Check government_id_number exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saln_submissions' AND column_name = 'government_id_number'
    ) THEN
        RAISE EXCEPTION 'Column government_id_number was not created';
    END IF;

    -- Check declarant_tin exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saln_submissions' AND column_name = 'declarant_tin'
    ) THEN
        RAISE EXCEPTION 'Column declarant_tin was not created';
    END IF;

    -- Check spouse_tin exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saln_submissions' AND column_name = 'spouse_tin'
    ) THEN
        RAISE EXCEPTION 'Column spouse_tin was not created';
    END IF;

    -- Check spouse_date_of_birth exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'saln_submissions' AND column_name = 'spouse_date_of_birth'
    ) THEN
        RAISE EXCEPTION 'Column spouse_date_of_birth was not created';
    END IF;

    RAISE NOTICE 'All SALN 2025 additional columns created successfully';
END $$;
