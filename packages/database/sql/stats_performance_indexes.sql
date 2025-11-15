-- =========================================
-- Performance Indexes for Stats API Aggregations
-- Optimizes /api/users/stats endpoint queries
-- =========================================

-- Composite indexes for COUNT(*) GROUP BY queries used in stats endpoint
-- These dramatically speed up aggregation queries

-- Profile stats aggregations - role distribution
CREATE INDEX IF NOT EXISTS idx_profiles_role_count
ON profiles(role)
WHERE role IS NOT NULL;

-- Profile stats aggregations - account status distribution
CREATE INDEX IF NOT EXISTS idx_profiles_account_status_count
ON profiles(account_status)
WHERE account_status IS NOT NULL;

-- Profile stats aggregations - user type distribution
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_count
ON profiles(user_type)
WHERE user_type IS NOT NULL;

-- Profile stats aggregations - employment category (employees only)
CREATE INDEX IF NOT EXISTS idx_profiles_employment_category_count
ON profiles(employment_category)
WHERE user_type = 'employee' AND employment_category != 'not_applicable';

-- Profile stats - active users (most frequent query)
CREATE INDEX IF NOT EXISTS idx_profiles_active_status
ON profiles(is_active, account_status)
WHERE is_active = true AND account_status = 'active';

-- Profile stats - pending approvals
CREATE INDEX IF NOT EXISTS idx_profiles_pending_approvals
ON profiles(account_status)
WHERE account_status = 'pending';

-- Profile stats - suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended
ON profiles(account_status)
WHERE account_status = 'suspended';

-- Profile stats - recent registrations (time-based queries)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc
ON profiles(created_at DESC);

-- Covering index for complete profile queries (reduces table lookups)
-- Only include frequently accessed columns to keep index size reasonable
CREATE INDEX IF NOT EXISTS idx_profiles_stats_covering
ON profiles(
  user_type,
  role,
  account_status,
  employment_category,
  is_active,
  created_at
) WHERE account_status IS NOT NULL;

-- Update statistics for query planner optimization
ANALYZE profiles;

-- Vacuum to reclaim space and update visibility map
VACUUM ANALYZE profiles;
