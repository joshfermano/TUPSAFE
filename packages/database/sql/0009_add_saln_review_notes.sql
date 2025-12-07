-- Add review_notes column to saln_submissions
-- Migration: 0009_add_saln_review_notes
-- Created: 2025-12-07
-- Description: Adds optional review feedback column for admin/HR notes on SALN submissions

-- Add the review_notes column (nullable TEXT)
ALTER TABLE saln_submissions
ADD COLUMN review_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN saln_submissions.review_notes IS
  'Optional review feedback from admin/HR. Can be used for approval notes or additional context for any submission status.';
