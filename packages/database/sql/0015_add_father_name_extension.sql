-- Migration: Add father_name_extension column to pds_family_background
-- This column stores the name suffix/extension for the father (Jr., Sr., II, III, IV, V)
-- Required for CS Form No. 212 compliance

ALTER TABLE pds_family_background
ADD COLUMN IF NOT EXISTS father_name_extension TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pds_family_background.father_name_extension IS 'Name suffix/extension for father (Jr., Sr., II, III, IV, V)';

