-- Migration: Add Government ID column to PDS Other Info table
-- CS Form No. 212 (Revised 2025) Item 42 - Government Issued ID
-- This migration adds a JSONB column to store government ID information
-- for signature verification purposes on Page 4 of the PDS form.

-- ============================================================================
-- MIGRATION: Add government_id column to pds_other_info table
-- ============================================================================

-- Add the government_id column as JSONB to store ID details
-- Structure: { idType, idNumber, dateIssued, placeIssued }
ALTER TABLE pds_other_info
ADD COLUMN IF NOT EXISTS government_id JSONB;

-- Add a comment explaining the column
COMMENT ON COLUMN pds_other_info.government_id IS 'Government Issued ID (Item 42) - CS Form No. 212 Revised 2025. JSON structure: { idType: string, idNumber: string, dateIssued: date, placeIssued: string }';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if column was created successfully
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pds_other_info' AND column_name = 'government_id'
    ) INTO col_exists;

    IF NOT col_exists THEN
        RAISE EXCEPTION 'Column government_id was not created in pds_other_info table';
    END IF;

    RAISE NOTICE 'Migration 0019 completed successfully';
    RAISE NOTICE '  - Added government_id (JSONB) column to pds_other_info table';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (commented out for safety)
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE pds_other_info DROP COLUMN IF EXISTS government_id;
