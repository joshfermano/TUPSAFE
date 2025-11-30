-- Migration: Add PhilSys Number (PSN) to pds_personal_info
-- Description: CS Form No. 212 (Revised 2025) requires a PhilSys Number field (Item 13)
-- Format: XX-XXXXXXXXX-X (e.g., 12-345678901-2)

-- Add philsys_no column to pds_personal_info table
ALTER TABLE pds_personal_info
ADD COLUMN IF NOT EXISTS philsys_no VARCHAR(14) UNIQUE;

-- Add comment for documentation
COMMENT ON COLUMN pds_personal_info.philsys_no IS 'Philippine Identification System (PhilSys) Number - CS Form No. 212 Item 13. Format: XX-XXXXXXXXX-X';

-- Create index for faster lookups (optional, useful for verification queries)
CREATE INDEX IF NOT EXISTS idx_pds_personal_info_philsys_no
ON pds_personal_info(philsys_no)
WHERE philsys_no IS NOT NULL;
