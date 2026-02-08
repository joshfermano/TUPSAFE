-- Migration: SALN 2025 Additional Fields
-- Description: Adds missing SALN 2025 format fields for government ID, TIN, and spouse details
--
-- New Columns:
--   1. First Government ID fields (primary signature):
--      - government_id_type: Type of first government ID
--      - government_id_number: ID number
--      - government_id_date_issued: Date the ID was issued
--   2. TIN (Tax Identification Number) fields:
--      - declarant_tin: Declarant's TIN
--      - spouse_tin: Spouse's TIN (nullable, for joint filing)
--   3. Spouse Date of Birth:
--      - spouse_date_of_birth: Spouse's date of birth (nullable, for joint filing)
--
-- Backwards Compatibility: All new columns are nullable for backwards compatibility with existing records
-- Rollback Strategy: See rollback section at end of file
--
-- Author: Database Migration System
-- Date: 2026-02-05

-- ============================================================================
-- SECTION 1: ADD FIRST GOVERNMENT ID COLUMNS TO saln_submissions
-- ============================================================================

-- First Government ID fields (primary signature - 2025 format requires 2 IDs)
-- The second ID fields (government_id_type_2, etc.) were added in migration 0017
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS government_id_type TEXT,
ADD COLUMN IF NOT EXISTS government_id_number TEXT,
ADD COLUMN IF NOT EXISTS government_id_date_issued DATE;

-- Add column comments for first government ID
COMMENT ON COLUMN saln_submissions.government_id_type IS 'Type of first government-issued ID (e.g., Driver''s License, Passport, SSS ID, GSIS ID, PhilHealth ID, Postal ID, Voter''s ID, PRC ID)';
COMMENT ON COLUMN saln_submissions.government_id_number IS 'Number/ID of first government-issued ID';
COMMENT ON COLUMN saln_submissions.government_id_date_issued IS 'Date of issuance of first government-issued ID';

-- ============================================================================
-- SECTION 2: ADD TIN (TAX IDENTIFICATION NUMBER) COLUMNS
-- ============================================================================

-- Declarant TIN - required for all SALN filers per CSC guidelines
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS declarant_tin TEXT;

-- Spouse TIN - only required for joint filing
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS spouse_tin TEXT;

-- Add column comments for TIN fields
COMMENT ON COLUMN saln_submissions.declarant_tin IS 'Declarant''s Tax Identification Number (TIN) - 9 to 12 digits format (XXX-XXX-XXX or XXX-XXX-XXX-XXX)';
COMMENT ON COLUMN saln_submissions.spouse_tin IS 'Spouse''s Tax Identification Number (TIN) - nullable, required only for joint filing';

-- ============================================================================
-- SECTION 3: ADD SPOUSE DATE OF BIRTH COLUMN
-- ============================================================================

-- Spouse date of birth - for joint filing verification and age calculation
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS spouse_date_of_birth DATE;

-- Add column comment for spouse date of birth
COMMENT ON COLUMN saln_submissions.spouse_date_of_birth IS 'Spouse''s date of birth - nullable, required for joint filing to verify spouse identity and calculate age';

-- ============================================================================
-- SECTION 4: CREATE PERFORMANCE INDEXES FOR TIN FIELDS
-- ============================================================================

-- Index on declarant TIN for efficient lookup and duplicate detection
CREATE INDEX IF NOT EXISTS saln_submissions_declarant_tin_idx
ON saln_submissions(declarant_tin);

-- Index on spouse TIN for efficient lookup
CREATE INDEX IF NOT EXISTS saln_submissions_spouse_tin_idx
ON saln_submissions(spouse_tin);

-- Composite index for TIN lookups combined with year (common query pattern for tax compliance reports)
CREATE INDEX IF NOT EXISTS saln_submissions_declarant_tin_year_idx
ON saln_submissions(declarant_tin, year);

-- ============================================================================
-- SECTION 5: MIGRATION SUMMARY
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 0018_saln_2025_additional_fields.sql completed successfully';
    RAISE NOTICE 'New columns added to saln_submissions:';
    RAISE NOTICE '  - government_id_type (TEXT): Type of first government ID';
    RAISE NOTICE '  - government_id_number (TEXT): First government ID number';
    RAISE NOTICE '  - government_id_date_issued (DATE): First government ID issue date';
    RAISE NOTICE '  - declarant_tin (TEXT): Declarant Tax Identification Number';
    RAISE NOTICE '  - spouse_tin (TEXT): Spouse Tax Identification Number';
    RAISE NOTICE '  - spouse_date_of_birth (DATE): Spouse date of birth';
    RAISE NOTICE 'Indexes created:';
    RAISE NOTICE '  - saln_submissions_declarant_tin_idx';
    RAISE NOTICE '  - saln_submissions_spouse_tin_idx';
    RAISE NOTICE '  - saln_submissions_declarant_tin_year_idx';
    RAISE NOTICE 'Backwards compatibility: All new columns are nullable';
END $$;

-- ============================================================================
-- ROLLBACK STRATEGY (FOR REFERENCE - DO NOT EXECUTE IN PRODUCTION)
-- ============================================================================
-- To rollback this migration, execute the following SQL:
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS saln_submissions_declarant_tin_idx;
-- DROP INDEX IF EXISTS saln_submissions_spouse_tin_idx;
-- DROP INDEX IF EXISTS saln_submissions_declarant_tin_year_idx;
--
-- -- Drop columns from saln_submissions
-- ALTER TABLE saln_submissions
--   DROP COLUMN IF EXISTS government_id_type,
--   DROP COLUMN IF EXISTS government_id_number,
--   DROP COLUMN IF EXISTS government_id_date_issued,
--   DROP COLUMN IF EXISTS declarant_tin,
--   DROP COLUMN IF EXISTS spouse_tin,
--   DROP COLUMN IF EXISTS spouse_date_of_birth;
--
