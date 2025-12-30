-- Migration: Add co_admin role
-- Description: Adds co_admin role value to the role enum for HR-based administrators
-- Date: 2025-01-01

-- Add co_admin to the role enum
-- Note: PostgreSQL enums require ALTER TYPE ADD VALUE
-- The IF NOT EXISTS clause prevents errors if already applied
ALTER TYPE role ADD VALUE IF NOT EXISTS 'co_admin' AFTER 'admin';

-- Comment explaining the role
COMMENT ON TYPE role IS 'User roles: employee (standard), hr (HR personnel), admin (full administrator), co_admin (co-administrator with admin privileges, must be from HR office), supervisor (department supervisor), auditor (audit access)';

