-- =========================================
-- Performance Indexes for Reports API Aggregations
-- Optimizes /api/reports endpoint queries
-- =========================================

-- Composite indexes for aggregation queries used in reports endpoint
-- These dramatically speed up time-series and aggregation queries

-- =====================================
-- PDS Submissions Indexes
-- =====================================

-- PDS submissions by status and creation date (for trends and status distribution)
CREATE INDEX IF NOT EXISTS idx_pds_submissions_status_created
ON pds_submissions(status, created_at DESC)
WHERE status IS NOT NULL;

-- PDS submissions by approval status and date (for compliance metrics)
CREATE INDEX IF NOT EXISTS idx_pds_submissions_approved_date
ON pds_submissions(status, approved_at DESC)
WHERE status = 'approved' AND approved_at IS NOT NULL;

-- PDS submissions for monthly aggregations (6-month trends)
-- Removed WHERE clause with CURRENT_DATE as it requires IMMUTABLE function
CREATE INDEX IF NOT EXISTS idx_pds_submissions_monthly_aggregation
ON pds_submissions(created_at DESC);

-- =====================================
-- SALN Submissions Indexes
-- =====================================

-- SALN submissions by status, year, and creation date (for trends and status distribution)
CREATE INDEX IF NOT EXISTS idx_saln_submissions_status_year_created
ON saln_submissions(status, year, created_at DESC)
WHERE status IS NOT NULL;

-- SALN submissions by approval status and date (for compliance metrics)
CREATE INDEX IF NOT EXISTS idx_saln_submissions_approved_date
ON saln_submissions(status, year, approved_at DESC)
WHERE status = 'approved' AND approved_at IS NOT NULL;

-- SALN submissions for monthly aggregations (6-month trends)
-- Removed WHERE clause with CURRENT_DATE as it requires IMMUTABLE function
CREATE INDEX IF NOT EXISTS idx_saln_submissions_monthly_aggregation
ON saln_submissions(year, created_at DESC);

-- =====================================
-- Profiles Indexes for Compliance
-- =====================================

-- Profiles by department and status (for department compliance aggregations)
CREATE INDEX IF NOT EXISTS idx_profiles_department_status_active
ON profiles(department_id, account_status, is_active)
WHERE user_type = 'employee' AND department_id IS NOT NULL;

-- Active employees for compliance rate calculations
CREATE INDEX IF NOT EXISTS idx_profiles_active_employees
ON profiles(user_type, account_status, is_active)
WHERE user_type = 'employee' AND account_status = 'active' AND is_active = true;

-- =====================================
-- Audit Logs Indexes
-- =====================================

-- Audit logs by date and entity type (for recent activity feed)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_entity_desc
ON audit_logs(created_at DESC, entity_type)
WHERE entity_type IN ('pds', 'saln', 'user', 'system');

-- Audit logs entity type filter (for activity filtering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_recent
ON audit_logs(entity_type, created_at DESC)
WHERE entity_type IN ('pds', 'saln', 'user', 'system');

-- =====================================
-- Departments Indexes
-- =====================================

-- Departments for JOIN operations in compliance queries
CREATE INDEX IF NOT EXISTS idx_departments_id_name_code
ON departments(id, name, code)
WHERE is_active = true;

-- =====================================
-- Composite Covering Indexes
-- =====================================

-- PDS submissions covering index (reduces table lookups)
CREATE INDEX IF NOT EXISTS idx_pds_submissions_reports_covering
ON pds_submissions(
  user_id,
  status,
  created_at,
  approved_at
) WHERE status IS NOT NULL;

-- SALN submissions covering index (reduces table lookups)
CREATE INDEX IF NOT EXISTS idx_saln_submissions_reports_covering
ON saln_submissions(
  user_id,
  year,
  status,
  created_at,
  approved_at
) WHERE status IS NOT NULL;

-- =====================================
-- Update Statistics & Optimize
-- =====================================

-- Update statistics for query planner optimization
ANALYZE pds_submissions;
ANALYZE saln_submissions;
ANALYZE profiles;
ANALYZE audit_logs;
ANALYZE departments;

-- Vacuum to reclaim space and update visibility map
VACUUM ANALYZE pds_submissions;
VACUUM ANALYZE saln_submissions;
VACUUM ANALYZE profiles;
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE departments;
