-- Add review_notes column to pds_submissions
-- Migration: 0007_add_review_notes
-- Created: 2025-01-06
-- Description: Adds optional review feedback column for admin/HR notes on PDS submissions

-- Add the review_notes column (nullable TEXT)
ALTER TABLE pds_submissions
ADD COLUMN review_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pds_submissions.review_notes IS
  'Optional review feedback from admin/HR. Can be used for approval notes or additional context for any submission status.';