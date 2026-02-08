-- Migration: SALN 2025 Format Upgrade (from 2019 format)
-- Description: Updates SALN system to support the 2025 CSC SALN format with enhanced tracking
--              for property ownership, compliance types, spouse details, and government IDs
--
-- Changes:
--   1. New enums: property_owner, compliance_type
--   2. saln_submissions: 14 new columns for 2025 format requirements
--   3. saln_real_properties, saln_personal_properties, saln_liabilities, saln_business_interests: owner tracking
--   4. Performance indexes for new columns
--
-- Backwards Compatibility: All new columns are nullable or have defaults, existing 2019 SALNs continue working
-- Rollback Strategy: See rollback section at end of file
--
-- Author: Database Migration System
-- Date: 2026-02-04

-- ============================================================================
-- SECTION 1: CREATE NEW ENUMS
-- ============================================================================

-- Property Owner Enum - tracks who owns assets/liabilities
-- Values: declarant, spouse, child, joint (joint ownership)
DO $$ BEGIN
    CREATE TYPE property_owner AS ENUM ('declarant', 'spouse', 'child', 'joint');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Compliance Type Enum - tracks type of SALN filing
-- Values: assumption (upon assumption to office), annual (yearly), exit (upon separation)
DO $$ BEGIN
    CREATE TYPE compliance_type AS ENUM ('assumption', 'annual', 'exit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE property_owner IS 'Indicates ownership of properties, liabilities, and business interests in SALN';
COMMENT ON TYPE compliance_type IS 'Type of SALN filing: assumption (new position), annual (yearly), or exit (separation)';

-- ============================================================================
-- SECTION 2: ADD COLUMNS TO saln_submissions
-- ============================================================================

-- Compliance tracking fields
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS compliance_type compliance_type,
ADD COLUMN IF NOT EXISTS compliance_date DATE;

-- Multiple marriages tracking
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS has_multiple_marriages BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS previous_spouse_names TEXT;

-- Spouse as public official tracking
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS spouse_is_public_official BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS spouse_position TEXT,
ADD COLUMN IF NOT EXISTS spouse_agency TEXT,
ADD COLUMN IF NOT EXISTS spouse_office_address TEXT;

-- Unmarried children details (JSONB array)
-- Schema: [{name: string, dateOfBirth: string, age: number}]
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS unmarried_children JSONB;

-- Negative assertions (for empty sections)
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS has_no_business_interests BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS has_no_relatives_in_gov BOOLEAN DEFAULT false NOT NULL;

-- Additional government ID (2025 format requires 2 IDs)
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS government_id_type_2 TEXT,
ADD COLUMN IF NOT EXISTS government_id_number_2 TEXT,
ADD COLUMN IF NOT EXISTS government_id_date_issued_2 DATE;

-- Format version tracking (2019 or 2025)
ALTER TABLE saln_submissions
ADD COLUMN IF NOT EXISTS saln_format_version INTEGER DEFAULT 2019 NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN saln_submissions.compliance_type IS 'Type of SALN filing: assumption (upon taking office), annual (yearly requirement), or exit (upon separation)';
COMMENT ON COLUMN saln_submissions.compliance_date IS 'Date of compliance event (assumption date, year-end for annual, or separation date)';
COMMENT ON COLUMN saln_submissions.has_multiple_marriages IS 'Indicates if declarant has been married more than once';
COMMENT ON COLUMN saln_submissions.previous_spouse_names IS 'Comma-separated list of previous spouse names if has_multiple_marriages is true';
COMMENT ON COLUMN saln_submissions.spouse_is_public_official IS 'Indicates if current spouse is a public official';
COMMENT ON COLUMN saln_submissions.spouse_position IS 'Position/title of spouse if they are a public official';
COMMENT ON COLUMN saln_submissions.spouse_agency IS 'Agency/department where spouse works if they are a public official';
COMMENT ON COLUMN saln_submissions.spouse_office_address IS 'Office address of spouse if they are a public official';
COMMENT ON COLUMN saln_submissions.unmarried_children IS 'JSONB array of unmarried children details: [{name, dateOfBirth, age}]';
COMMENT ON COLUMN saln_submissions.has_no_business_interests IS 'Flag indicating declarant has no business interests (for tracking completion)';
COMMENT ON COLUMN saln_submissions.has_no_relatives_in_gov IS 'Flag indicating declarant has no relatives in government (for tracking completion)';
COMMENT ON COLUMN saln_submissions.government_id_type_2 IS 'Type of second government-issued ID (e.g., Passport, Drivers License)';
COMMENT ON COLUMN saln_submissions.government_id_number_2 IS 'Number of second government-issued ID';
COMMENT ON COLUMN saln_submissions.government_id_date_issued_2 IS 'Issue date of second government-issued ID';
COMMENT ON COLUMN saln_submissions.saln_format_version IS 'SALN format version: 2019 or 2025 (default 2019 for backwards compatibility)';

-- ============================================================================
-- SECTION 3: ADD OWNER COLUMNS TO PROPERTY/LIABILITY TABLES
-- ============================================================================

-- Add owner column to saln_real_properties
ALTER TABLE saln_real_properties
ADD COLUMN IF NOT EXISTS owner property_owner DEFAULT 'declarant' NOT NULL,
ADD COLUMN IF NOT EXISTS child_name TEXT;

COMMENT ON COLUMN saln_real_properties.owner IS 'Ownership of property: declarant, spouse, child, or joint';
COMMENT ON COLUMN saln_real_properties.child_name IS 'Name of child if owner is child (required when owner=child)';

-- Add owner column to saln_personal_properties
ALTER TABLE saln_personal_properties
ADD COLUMN IF NOT EXISTS owner property_owner DEFAULT 'declarant' NOT NULL,
ADD COLUMN IF NOT EXISTS child_name TEXT;

COMMENT ON COLUMN saln_personal_properties.owner IS 'Ownership of property: declarant, spouse, child, or joint';
COMMENT ON COLUMN saln_personal_properties.child_name IS 'Name of child if owner is child (required when owner=child)';

-- Add owner column to saln_liabilities
ALTER TABLE saln_liabilities
ADD COLUMN IF NOT EXISTS owner property_owner DEFAULT 'declarant' NOT NULL,
ADD COLUMN IF NOT EXISTS child_name TEXT;

COMMENT ON COLUMN saln_liabilities.owner IS 'Ownership of liability: declarant, spouse, child, or joint';
COMMENT ON COLUMN saln_liabilities.child_name IS 'Name of child if owner is child (required when owner=child)';

-- Add owner column to saln_business_interests
ALTER TABLE saln_business_interests
ADD COLUMN IF NOT EXISTS owner property_owner DEFAULT 'declarant' NOT NULL,
ADD COLUMN IF NOT EXISTS child_name TEXT;

COMMENT ON COLUMN saln_business_interests.owner IS 'Ownership of business interest: declarant, spouse, child, or joint';
COMMENT ON COLUMN saln_business_interests.child_name IS 'Name of child if owner is child (required when owner=child)';

-- ============================================================================
-- SECTION 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index on saln_format_version for filtering 2019 vs 2025 format SALNs
CREATE INDEX IF NOT EXISTS saln_submissions_format_version_idx
ON saln_submissions(saln_format_version);

-- Index on compliance_type for reporting and filtering
CREATE INDEX IF NOT EXISTS saln_submissions_compliance_type_idx
ON saln_submissions(compliance_type);

-- Composite index on format version + year for analytics
CREATE INDEX IF NOT EXISTS saln_submissions_format_year_idx
ON saln_submissions(saln_format_version, year);

-- Composite index on format version + status for admin filtering
CREATE INDEX IF NOT EXISTS saln_submissions_format_status_idx
ON saln_submissions(saln_format_version, status);

-- Owner indexes on property/liability tables for ownership filtering and reporting
CREATE INDEX IF NOT EXISTS saln_real_properties_owner_idx
ON saln_real_properties(owner);

CREATE INDEX IF NOT EXISTS saln_personal_properties_owner_idx
ON saln_personal_properties(owner);

CREATE INDEX IF NOT EXISTS saln_liabilities_owner_idx
ON saln_liabilities(owner);

CREATE INDEX IF NOT EXISTS saln_business_interests_owner_idx
ON saln_business_interests(owner);

-- Composite indexes for submission + owner filtering (performance optimization)
CREATE INDEX IF NOT EXISTS saln_real_properties_submission_owner_idx
ON saln_real_properties(saln_submission_id, owner);

CREATE INDEX IF NOT EXISTS saln_personal_properties_submission_owner_idx
ON saln_personal_properties(saln_submission_id, owner);

CREATE INDEX IF NOT EXISTS saln_liabilities_submission_owner_idx
ON saln_liabilities(saln_submission_id, owner);

CREATE INDEX IF NOT EXISTS saln_business_interests_submission_owner_idx
ON saln_business_interests(saln_submission_id, owner);

-- ============================================================================
-- SECTION 5: DATA VALIDATION CHECKS (OPTIONAL - FOR SAFETY)
-- ============================================================================

-- Check constraint: child_name is required when owner is 'child'
ALTER TABLE saln_real_properties
ADD CONSTRAINT saln_real_properties_child_name_check
CHECK (
    (owner = 'child' AND child_name IS NOT NULL AND length(trim(child_name)) > 0)
    OR owner != 'child'
);

ALTER TABLE saln_personal_properties
ADD CONSTRAINT saln_personal_properties_child_name_check
CHECK (
    (owner = 'child' AND child_name IS NOT NULL AND length(trim(child_name)) > 0)
    OR owner != 'child'
);

ALTER TABLE saln_liabilities
ADD CONSTRAINT saln_liabilities_child_name_check
CHECK (
    (owner = 'child' AND child_name IS NOT NULL AND length(trim(child_name)) > 0)
    OR owner != 'child'
);

ALTER TABLE saln_business_interests
ADD CONSTRAINT saln_business_interests_child_name_check
CHECK (
    (owner = 'child' AND child_name IS NOT NULL AND length(trim(child_name)) > 0)
    OR owner != 'child'
);

-- Check constraint: spouse details required when spouse_is_public_official is true
ALTER TABLE saln_submissions
ADD CONSTRAINT saln_submissions_spouse_official_check
CHECK (
    (spouse_is_public_official = true AND spouse_position IS NOT NULL AND spouse_agency IS NOT NULL)
    OR spouse_is_public_official = false
);

-- Check constraint: previous_spouse_names required when has_multiple_marriages is true
ALTER TABLE saln_submissions
ADD CONSTRAINT saln_submissions_multiple_marriages_check
CHECK (
    (has_multiple_marriages = true AND previous_spouse_names IS NOT NULL AND length(trim(previous_spouse_names)) > 0)
    OR has_multiple_marriages = false
);

-- Check constraint: saln_format_version must be 2019 or 2025
ALTER TABLE saln_submissions
ADD CONSTRAINT saln_submissions_format_version_check
CHECK (saln_format_version IN (2019, 2025));

-- ============================================================================
-- SECTION 6: MIGRATION SUMMARY
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 0017_saln_2025_format_upgrade.sql completed successfully';
    RAISE NOTICE 'New enums created: property_owner, compliance_type';
    RAISE NOTICE 'saln_submissions: 14 new columns added';
    RAISE NOTICE 'Property/liability tables: owner and child_name columns added';
    RAISE NOTICE 'Performance indexes created: 12 new indexes';
    RAISE NOTICE 'Data validation constraints added: 7 check constraints';
    RAISE NOTICE 'Backwards compatibility: All existing 2019 format SALNs continue working with defaults';
END $$;

-- ============================================================================
-- ROLLBACK STRATEGY (FOR REFERENCE - DO NOT EXECUTE)
-- ============================================================================
-- To rollback this migration, execute the following SQL:
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS saln_submissions_format_version_idx;
-- DROP INDEX IF EXISTS saln_submissions_compliance_type_idx;
-- DROP INDEX IF EXISTS saln_submissions_format_year_idx;
-- DROP INDEX IF EXISTS saln_submissions_format_status_idx;
-- DROP INDEX IF EXISTS saln_real_properties_owner_idx;
-- DROP INDEX IF EXISTS saln_personal_properties_owner_idx;
-- DROP INDEX IF EXISTS saln_liabilities_owner_idx;
-- DROP INDEX IF EXISTS saln_business_interests_owner_idx;
-- DROP INDEX IF EXISTS saln_real_properties_submission_owner_idx;
-- DROP INDEX IF EXISTS saln_personal_properties_submission_owner_idx;
-- DROP INDEX IF EXISTS saln_liabilities_submission_owner_idx;
-- DROP INDEX IF EXISTS saln_business_interests_submission_owner_idx;
--
-- -- Drop check constraints
-- ALTER TABLE saln_real_properties DROP CONSTRAINT IF EXISTS saln_real_properties_child_name_check;
-- ALTER TABLE saln_personal_properties DROP CONSTRAINT IF EXISTS saln_personal_properties_child_name_check;
-- ALTER TABLE saln_liabilities DROP CONSTRAINT IF EXISTS saln_liabilities_child_name_check;
-- ALTER TABLE saln_business_interests DROP CONSTRAINT IF EXISTS saln_business_interests_child_name_check;
-- ALTER TABLE saln_submissions DROP CONSTRAINT IF EXISTS saln_submissions_spouse_official_check;
-- ALTER TABLE saln_submissions DROP CONSTRAINT IF EXISTS saln_submissions_multiple_marriages_check;
-- ALTER TABLE saln_submissions DROP CONSTRAINT IF EXISTS saln_submissions_format_version_check;
--
-- -- Drop columns from property/liability tables
-- ALTER TABLE saln_real_properties DROP COLUMN IF EXISTS owner, DROP COLUMN IF EXISTS child_name;
-- ALTER TABLE saln_personal_properties DROP COLUMN IF EXISTS owner, DROP COLUMN IF EXISTS child_name;
-- ALTER TABLE saln_liabilities DROP COLUMN IF EXISTS owner, DROP COLUMN IF EXISTS child_name;
-- ALTER TABLE saln_business_interests DROP COLUMN IF EXISTS owner, DROP COLUMN IF EXISTS child_name;
--
-- -- Drop columns from saln_submissions
-- ALTER TABLE saln_submissions
--   DROP COLUMN IF EXISTS compliance_type,
--   DROP COLUMN IF EXISTS compliance_date,
--   DROP COLUMN IF EXISTS has_multiple_marriages,
--   DROP COLUMN IF EXISTS previous_spouse_names,
--   DROP COLUMN IF EXISTS spouse_is_public_official,
--   DROP COLUMN IF EXISTS spouse_position,
--   DROP COLUMN IF EXISTS spouse_agency,
--   DROP COLUMN IF EXISTS spouse_office_address,
--   DROP COLUMN IF EXISTS unmarried_children,
--   DROP COLUMN IF EXISTS has_no_business_interests,
--   DROP COLUMN IF EXISTS has_no_relatives_in_gov,
--   DROP COLUMN IF EXISTS government_id_type_2,
--   DROP COLUMN IF EXISTS government_id_number_2,
--   DROP COLUMN IF EXISTS government_id_date_issued_2,
--   DROP COLUMN IF EXISTS saln_format_version;
--
-- -- Drop enums
-- DROP TYPE IF EXISTS compliance_type;
-- DROP TYPE IF EXISTS property_owner;
