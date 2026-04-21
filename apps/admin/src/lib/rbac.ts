/**
 * Admin Portal RBAC helpers.
 *
 * Design rule (load-bearing):
 *   `superadmin` is a STRICT SUPERSET of `admin`. Every check that currently
 *   accepts `admin` MUST also accept `superadmin`. No RBAC decision anywhere
 *   in the admin portal should admit `admin` while rejecting `superadmin`.
 *
 * Use these helpers for any jobs/applications gating (and for any new
 * admin-or-above gating) instead of hand-rolled role equality checks.
 */

export const ADMIN_PORTAL_ROLES = ['superadmin', 'admin', 'hr'] as const;
export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

/** Admin-equivalent roles: superadmin is always admin-equivalent-or-higher. */
export const ADMIN_OR_ABOVE_ROLES = ['superadmin', 'admin'] as const;
export type AdminOrAboveRole = (typeof ADMIN_OR_ABOVE_ROLES)[number];

/**
 * Roles allowed to view, create, edit, and close job postings and triage
 * applications. HR retains all job-management rights they had before.
 */
export const MANAGE_JOBS_ROLES = ['superadmin', 'admin', 'hr'] as const;
export type ManageJobsRole = (typeof MANAGE_JOBS_ROLES)[number];

/**
 * Roles allowed to hard/soft-delete (cancel) job postings.
 * Historically admin-only; superadmin is always at least as privileged.
 */
export const DELETE_JOBS_ROLES = ['superadmin', 'admin'] as const;
export type DeleteJobsRole = (typeof DELETE_JOBS_ROLES)[number];

function hasRole<T extends readonly string[]>(
  role: string | null | undefined,
  allowed: T
): boolean {
  if (!role) return false;
  return (allowed as readonly string[]).includes(role);
}

/** True if the role can access the admin portal at all. */
export function isAdminPortalRole(role?: string | null): boolean {
  return hasRole(role, ADMIN_PORTAL_ROLES);
}

/** True if role is admin-or-above (admin | superadmin). */
export function isAdminOrAbove(role?: string | null): boolean {
  return hasRole(role, ADMIN_OR_ABOVE_ROLES);
}

/** True if role may view/create/edit/close jobs and triage applications. */
export function canManageJobs(role?: string | null): boolean {
  return hasRole(role, MANAGE_JOBS_ROLES);
}

/** True if role may delete (cancel) job postings. */
export function canDeleteJobs(role?: string | null): boolean {
  return hasRole(role, DELETE_JOBS_ROLES);
}
