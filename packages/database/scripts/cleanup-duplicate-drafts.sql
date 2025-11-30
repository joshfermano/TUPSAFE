-- Cleanup Script: Remove Duplicate PDS Drafts
-- Keeps the most complete draft per user
-- Run this ONE TIME before deploying the auto-save fix

-- Calculate completion percentage for each draft
WITH draft_completion AS (
  SELECT
    ps.id,
    ps.user_id,
    ps.version,
    ps.updated_at,
    ps.created_at,
    -- Calculate completion % based on filled sections (6 main sections)
    (
      CASE WHEN ps.personal_info_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN ps.family_background_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM pds_civil_service
        WHERE pds_submission_id = ps.id
      ) THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM pds_work_experience
        WHERE pds_submission_id = ps.id
      ) THEN 1 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM pds_training
        WHERE pds_submission_id = ps.id
      ) THEN 1 ELSE 0 END +
      CASE WHEN ps.other_info_id IS NOT NULL THEN 1 ELSE 0 END
    )::float / 6.0 * 100 as completion_pct
  FROM pds_submissions ps
  WHERE ps.status = 'draft'
),
ranked_drafts AS (
  SELECT
    id,
    user_id,
    version,
    updated_at,
    created_at,
    completion_pct,
    -- Rank by completion % (highest first), then by updated_at (most recent first)
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY completion_pct DESC, updated_at DESC
    ) as rn
  FROM draft_completion
)
-- Delete all drafts except the most complete one per user
DELETE FROM pds_submissions
WHERE id IN (
  SELECT id FROM ranked_drafts WHERE rn > 1
);

-- Show summary of what was cleaned up
-- Run this after the DELETE to see results
SELECT
  'Total drafts deleted' as action,
  COUNT(*) as count
FROM ranked_drafts
WHERE rn > 1;
