-- ROLLBACK SCRIPT for Migration 0017: SALN 2025 Format Upgrade
-- WARNING: This will DROP all columns and data added in migration 0017
-- CRITICAL: Ensure you have a database backup before executing
--
-- This script reverses all changes from 0017_saln_2025_format_upgrade.sql
-- Execution time: ~10-30 seconds depending on data volume
--
-- Author: Database Migration System
-- Date: 2026-02-04

-- ============================================================================
-- VERIFICATION PROMPT
-- ============================================================================

DO $$
BEGIN
    RAISE WARNING 'You are about to ROLLBACK migration 0017 (SALN 2025 Format Upgrade)';
    RAISE WARNING 'This will DROP:';
    RAISE WARNING '  - 14 columns from saln_submissions (including format_version, compliance_type, etc.)';
    RAISE WARNING '  - 2 columns from 4 tables (saln_real_properties, saln_personal_properties, saln_liabilities, saln_business_interests)';
    RAISE WARNING '  - 12 performance indexes';
    RAISE WARNING '  - 7 check constraints';
    RAISE WARNING '  - 2 enum types (property_owner, compliance_type)';
    RAISE WARNING '';
    RAISE WARNING 'ALL DATA IN THESE COLUMNS WILL BE PERMANENTLY DELETED';
    RAISE WARNING '';
    RAISE WARNING 'Press Ctrl+C to ABORT within 5 seconds...';
    PERFORM pg_sleep(5);
    RAISE NOTICE 'Proceeding with rollback...';
END $$;

-- ============================================================================
-- SECTION 1: DROP INDEXES
-- ============================================================================

RAISE NOTICE 'Dropping indexes...';

-- Drop saln_submissions indexes
DROP INDEX IF EXISTS saln_submissions_format_version_idx;
DROP INDEX IF EXISTS saln_submissions_compliance_type_idx;
DROP INDEX IF EXISTS saln_submissions_format_year_idx;
DROP INDEX IF EXISTS saln_submissions_format_status_idx;

-- Drop property table indexes
DROP INDEX IF EXISTS saln_real_properties_owner_idx;
DROP INDEX IF EXISTS saln_real_properties_submission_owner_idx;
DROP INDEX IF EXISTS saln_personal_properties_owner_idx;
DROP INDEX IF EXISTS saln_personal_properties_submission_owner_idx;
DROP INDEX IF EXISTS saln_liabilities_owner_idx;
DROP INDEX IF EXISTS saln_liabilities_submission_owner_idx;
DROP INDEX IF EXISTS saln_business_interests_owner_idx;
DROP INDEX IF EXISTS saln_business_interests_submission_owner_idx;

RAISE NOTICE 'Indexes dropped: 12 indexes removed';

-- ============================================================================
-- SECTION 2: DROP CHECK CONSTRAINTS
-- ============================================================================

RAISE NOTICE 'Dropping check constraints...';

-- Drop child_name constraints
ALTER TABLE saln_real_properties
DROP CONSTRAINT IF EXISTS saln_real_properties_child_name_check;

ALTER TABLE saln_personal_properties
DROP CONSTRAINT IF EXISTS saln_personal_properties_child_name_check;

ALTER TABLE saln_liabilities
DROP CONSTRAINT IF EXISTS saln_liabilities_child_name_check;

ALTER TABLE saln_business_interests
DROP CONSTRAINT IF EXISTS saln_business_interests_child_name_check;

-- Drop saln_submissions constraints
ALTER TABLE saln_submissions
DROP CONSTRAINT IF EXISTS saln_submissions_spouse_official_check;

ALTER TABLE saln_submissions
DROP CONSTRAINT IF EXISTS saln_submissions_multiple_marriages_check;

ALTER TABLE saln_submissions
DROP CONSTRAINT IF EXISTS saln_submissions_format_version_check;

RAISE NOTICE 'Check constraints dropped: 7 constraints removed';

-- ============================================================================
-- SECTION 3: DROP COLUMNS FROM PROPERTY/LIABILITY TABLES
-- ============================================================================

RAISE NOTICE 'Dropping columns from property and liability tables...';

-- Drop from saln_real_properties
ALTER TABLE saln_real_properties
DROP COLUMN IF EXISTS owner CASCADE,
DROP COLUMN IF EXISTS child_name CASCADE;

-- Drop from saln_personal_properties
ALTER TABLE saln_personal_properties
DROP COLUMN IF EXISTS owner CASCADE,
DROP COLUMN IF EXISTS child_name CASCADE;

-- Drop from saln_liabilities
ALTER TABLE saln_liabilities
DROP COLUMN IF EXISTS owner CASCADE,
DROP COLUMN IF EXISTS child_name CASCADE;

-- Drop from saln_business_interests
ALTER TABLE saln_business_interests
DROP COLUMN IF EXISTS owner CASCADE,
DROP COLUMN IF EXISTS child_name CASCADE;

RAISE NOTICE 'Property/liability columns dropped: 8 columns removed (2 per table × 4 tables)';

-- ============================================================================
-- SECTION 4: DROP COLUMNS FROM saln_submissions
-- ============================================================================

RAISE NOTICE 'Dropping columns from saln_submissions...';

ALTER TABLE saln_submissions
DROP COLUMN IF EXISTS compliance_type CASCADE,
DROP COLUMN IF EXISTS compliance_date CASCADE,
DROP COLUMN IF EXISTS has_multiple_marriages CASCADE,
DROP COLUMN IF EXISTS previous_spouse_names CASCADE,
DROP COLUMN IF EXISTS spouse_is_public_official CASCADE,
DROP COLUMN IF EXISTS spouse_position CASCADE,
DROP COLUMN IF EXISTS spouse_agency CASCADE,
DROP COLUMN IF EXISTS spouse_office_address CASCADE,
DROP COLUMN IF EXISTS unmarried_children CASCADE,
DROP COLUMN IF EXISTS has_no_business_interests CASCADE,
DROP COLUMN IF EXISTS has_no_relatives_in_gov CASCADE,
DROP COLUMN IF EXISTS government_id_type_2 CASCADE,
DROP COLUMN IF EXISTS government_id_number_2 CASCADE,
DROP COLUMN IF EXISTS government_id_date_issued_2 CASCADE,
DROP COLUMN IF EXISTS saln_format_version CASCADE;

RAISE NOTICE 'saln_submissions columns dropped: 14 columns removed';

-- ============================================================================
-- SECTION 5: DROP ENUM TYPES
-- ============================================================================

RAISE NOTICE 'Dropping enum types...';

-- Drop compliance_type enum
DROP TYPE IF EXISTS compliance_type CASCADE;

-- Drop property_owner enum
DROP TYPE IF EXISTS property_owner CASCADE;

RAISE NOTICE 'Enum types dropped: 2 enums removed';

-- ============================================================================
-- SECTION 6: VACUUM AND ANALYZE
-- ============================================================================

RAISE NOTICE 'Running VACUUM ANALYZE to reclaim space...';

-- Vacuum affected tables to reclaim disk space
VACUUM ANALYZE saln_submissions;
VACUUM ANALYZE saln_real_properties;
VACUUM ANALYZE saln_personal_properties;
VACUUM ANALYZE saln_liabilities;
VACUUM ANALYZE saln_business_interests;

RAISE NOTICE 'VACUUM ANALYZE completed';

-- ============================================================================
-- SECTION 7: ROLLBACK SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration 0017 has been rolled back';
    RAISE NOTICE '';
    RAISE NOTICE 'Removed:';
    RAISE NOTICE '  - 2 enum types (property_owner, compliance_type)';
    RAISE NOTICE '  - 14 columns from saln_submissions';
    RAISE NOTICE '  - 8 columns from property/liability tables';
    RAISE NOTICE '  - 12 performance indexes';
    RAISE NOTICE '  - 7 check constraints';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now back to pre-migration state';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT NEXT STEPS:';
    RAISE NOTICE '  1. Revert Drizzle schema changes in src/schema.ts';
    RAISE NOTICE '  2. Rebuild database package: npm run build';
    RAISE NOTICE '  3. Restart application to use old schema';
    RAISE NOTICE '  4. Update any frontend code that referenced new fields';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback timestamp: ' || NOW();
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- POST-ROLLBACK VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify rollback was successful:
--
-- 1. Verify enums are gone:
-- SELECT typname FROM pg_type WHERE typname IN ('property_owner', 'compliance_type');
-- Expected: 0 rows
--
-- 2. Verify saln_submissions columns are gone:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'saln_submissions'
--   AND column_name IN ('compliance_type', 'saln_format_version', 'owner');
-- Expected: 0 rows
--
-- 3. Verify indexes are gone:
-- SELECT indexname FROM pg_indexes
-- WHERE indexname LIKE '%owner%' OR indexname LIKE '%format%' OR indexname LIKE '%compliance%';
-- Expected: 0 rows (or only unrelated indexes)
--
-- 4. Verify constraints are gone:
-- SELECT conname FROM pg_constraint
-- WHERE conname LIKE '%child_name%'
--    OR conname LIKE '%spouse_official%'
--    OR conname LIKE '%multiple_marriages%'
--    OR conname LIKE '%format_version%';
-- Expected: 0 rows
