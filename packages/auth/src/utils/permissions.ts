/**
 * Permission matrix for the TUPSAFE admin portal.
 *
 * Single source of truth for "who can do what." Route guards and UI gating should
 * import from here rather than repeating role arrays.
 *
 * Roles (see packages/database/src/schema.ts `roleEnum`):
 *   superadmin - bootstrap role; manages admins and changes any role
 *   admin      - full admin-portal powers except dangerous system ops and creating superadmins
 *   hr         - reviewer + employee manager; cannot create admins or delete submissions
 *   employee   - non-admin-portal user; no admin permissions
 *
 * Capability naming: `domain.action[.qualifier]`.
 */

import type { UserRole } from '@tupsafe/types';

export type Permission =
  // Submissions (PDS/SALN)
  | 'submissions.view'
  | 'submissions.approve'
  | 'submissions.reject'
  | 'submissions.delete'
  // Users
  | 'users.view'
  | 'users.create.employee'
  | 'users.create.hr'
  | 'users.create.admin'
  | 'users.create.superadmin'
  | 'users.edit'
  | 'users.reset_password'
  | 'users.change_role.any'
  | 'users.change_role.employee_hr'
  // Registrations (applicant approval)
  | 'registrations.view'
  | 'registrations.approve'
  | 'registrations.reject'
  // Organization (colleges, departments, positions)
  | 'organization.manage'
  // Audit / system
  | 'audit.view'
  | 'system.cleanup'
  | 'system.config';

const SUPERADMIN: Permission[] = [
  'submissions.view',
  'submissions.approve',
  'submissions.reject',
  'submissions.delete',
  'users.view',
  'users.create.employee',
  'users.create.hr',
  'users.create.admin',
  'users.create.superadmin',
  'users.edit',
  'users.reset_password',
  'users.change_role.any',
  'users.change_role.employee_hr',
  'registrations.view',
  'registrations.approve',
  'registrations.reject',
  'organization.manage',
  'audit.view',
  'system.cleanup',
  'system.config',
];

const ADMIN: Permission[] = [
  'submissions.view',
  'submissions.approve',
  'submissions.reject',
  'submissions.delete',
  'users.view',
  'users.create.employee',
  'users.create.hr',
  // NOT: users.create.admin (only superadmin)
  // NOT: users.create.superadmin
  'users.edit',
  'users.reset_password',
  'users.change_role.employee_hr',
  // NOT: users.change_role.any (only superadmin)
  'registrations.view',
  'registrations.approve',
  'registrations.reject',
  'organization.manage',
  'audit.view',
  // NOT: system.cleanup, system.config
];

const HR: Permission[] = [
  'submissions.view',
  'submissions.approve',
  'submissions.reject',
  // NOT: submissions.delete
  'users.view',
  'users.create.employee',
  // NOT: users.create.hr, users.create.admin, users.create.superadmin
  'users.edit',
  'users.reset_password',
  // NOT: role changes
  'registrations.view',
  'registrations.approve',
  'registrations.reject',
  // NOT: organization.manage
  'audit.view',
];

const EMPLOYEE: Permission[] = [];

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  superadmin: new Set(SUPERADMIN),
  admin: new Set(ADMIN),
  hr: new Set(HR),
  employee: new Set(EMPLOYEE),
};

export function hasPermission(
  role: UserRole | string | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  const set = ROLE_PERMISSIONS[role as UserRole];
  if (!set) return false;
  return set.has(permission);
}

/**
 * Returns the list of target roles a given actor is allowed to assign when
 * creating a new user or changing an existing user's role.
 *
 * Note: `superadmin` is deliberately never returned from this helper. Promotion
 * to superadmin goes through the dedicated `POST /api/users/[id]/role` flow,
 * not the general create/edit path.
 */
export function assignableRoles(
  actorRole: UserRole | string | null | undefined,
): UserRole[] {
  if (!actorRole) return [];
  switch (actorRole) {
    case 'superadmin':
      return ['admin', 'hr', 'employee'];
    case 'admin':
      return ['hr', 'employee'];
    case 'hr':
      return ['employee'];
    default:
      return [];
  }
}
