-- =====================================================================
-- ID Generation Functions for TUPSAFE
-- =====================================================================
-- These functions generate unique IDs for employees and applicants
-- following the specified format requirements.
--
-- Employee ID Format: TUPM-MMDD-YY-###
--   - TUPM: TUP Manila prefix
--   - MMDD: Month and day from BIRTH DATE (e.g., 0115 for January 15)
--   - YY: Two-digit year of HIRE (current year, e.g., 25 for 2025)
--   - ###: Three-digit sequence number (001, 002, etc.)
--   - Example: TUPM-0115-25-001 (born Jan 15, hired in 2025)
--
-- Applicant ID Format: APPL-YYYY-XXXX
--   - APPL: Applicant prefix
--   - YYYY: Four-digit year (e.g., 2025)
--   - XXXX: Four-digit sequence number (0001, 0002, etc.)
--   - Example: APPL-2025-0001 (first applicant of 2025)
-- =====================================================================

-- =====================================================================
-- Function: generate_employee_id
-- Purpose: Generate unique employee ID based on birth date
-- Parameters: birth_date DATE - The employee's birth date
-- Returns: TEXT - Generated employee ID in format TUPM-MMDD-YY-###
-- =====================================================================
CREATE OR REPLACE FUNCTION generate_employee_id(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  year_part TEXT;
  sequence_num INTEGER;
  new_id TEXT;
BEGIN
  -- Validate input
  IF birth_date IS NULL THEN
    RAISE EXCEPTION 'Birth date cannot be NULL for employee ID generation';
  END IF;

  -- Extract date components
  -- Format: TUPM-MMDD-YY
  -- MMDD from birth date (month and day)
  date_part := TO_CHAR(birth_date, 'MMDD');
  -- YY from birth year (e.g., 04 for 2004)
  year_part := TO_CHAR(birth_date, 'YY');

  -- Find the next sequence number for this birth date + hire year combination
  -- Count existing employee IDs with the same MMDD-YY prefix
  -- Use regex to extract the sequence number from existing IDs
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(employee_id FROM 'TUPM-\d{4}-\d{2}-(\d{3})') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM profiles
  WHERE employee_id LIKE 'TUPM-' || date_part || '-' || year_part || '-%'
    AND employee_id ~ '^TUPM-\d{4}-\d{2}-\d{3}$';

  -- Generate the ID: TUPM-MMDD-YY-###
  -- LPAD ensures the sequence is always 3 digits (001, 002, etc.)
  new_id := 'TUPM-' || date_part || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Function: generate_applicant_id
-- Purpose: Generate unique applicant ID for the current year
-- Parameters: None
-- Returns: TEXT - Generated applicant ID in format APPL-YYYY-XXXX
-- =====================================================================
CREATE OR REPLACE FUNCTION generate_applicant_id()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_id TEXT;
BEGIN
  -- Format: APPL-YYYY-XXXX
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Find the next sequence number for this year
  -- Use regex to extract the sequence number from existing IDs
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(applicant_id FROM 'APPL-\d{4}-(\d{4})') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM profiles
  WHERE applicant_id LIKE 'APPL-' || year_part || '-%'
    AND applicant_id ~ '^APPL-\d{4}-\d{4}$';

  -- Generate the ID: APPL-YYYY-XXXX
  -- LPAD ensures the sequence is always 4 digits (0001, 0002, etc.)
  new_id := 'APPL-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Grant execute permissions to authenticated users
-- =====================================================================
GRANT EXECUTE ON FUNCTION generate_employee_id(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_applicant_id() TO authenticated;

-- =====================================================================
-- Usage Examples:
-- =====================================================================
-- Generate employee ID for birth date January 15, 1990 (hired in 2025):
--   SELECT generate_employee_id('1990-01-15');
--   Result: TUPM-0115-25-001
--
-- Generate employee ID for birth date May 13, 1985 (hired in 2025):
--   SELECT generate_employee_id('1985-05-13');
--   Result: TUPM-0513-25-001
--
-- Generate applicant ID for current year:
--   SELECT generate_applicant_id();
--   Result: APPL-2025-0001
-- =====================================================================
