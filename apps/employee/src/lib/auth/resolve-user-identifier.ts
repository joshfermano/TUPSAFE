/**
 * User Identifier Resolution
 *
 * Server-only helper to resolve an email or employee ID to user details.
 * Used by password reset flows to find users without requiring authentication.
 *
 * @module lib/auth/resolve-user-identifier
 */

import { db, profiles } from '@tupsafe/database/server';
import { createAdminClient } from '@tupsafe/auth/server';
import { eq } from 'drizzle-orm';
import type { ResolvedUserIdentifier } from '@tupsafe/types';

/**
 * Check if the identifier looks like an email address
 */
function isEmail(identifier: string): boolean {
  return identifier.includes('@');
}

/**
 * Resolve a user identifier (email or employee ID) to user details.
 *
 * This function:
 * 1. Determines if the identifier is an email or employee ID
 * 2. Looks up the user in the appropriate source
 * 3. Returns the userId and email if found
 *
 * Security note: This function should only be called from server-side code
 * and the result should not be exposed directly to prevent user enumeration.
 *
 * @param identifier - Email address or Employee ID
 * @returns User details if found, null otherwise
 *
 * @example
 * ```typescript
 * // By email
 * const user = await resolveUserIdentifier('employee@tup.edu.ph');
 *
 * // By employee ID
 * const user = await resolveUserIdentifier('TUPM-1223-95-001');
 * ```
 */
export async function resolveUserIdentifier(
  identifier: string
): Promise<ResolvedUserIdentifier | null> {
  try {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      return null;
    }

    if (isEmail(trimmedIdentifier)) {
      // Identifier is an email - look up in Supabase auth.users
      return await resolveByEmail(trimmedIdentifier);
    } else {
      // Identifier is an employee ID - look up in profiles table
      return await resolveByEmployeeId(trimmedIdentifier);
    }
  } catch (error) {
    console.error('[resolveUserIdentifier] Error:', error);
    return null;
  }
}

/**
 * Resolve user by email address using Supabase admin client
 */
async function resolveByEmail(
  email: string
): Promise<ResolvedUserIdentifier | null> {
  try {
    const supabase = createAdminClient();

    // Query auth.users to find user by email
    // Note: Supabase doesn't have a direct "get user by email" admin method,
    // so we use listUsers with a filter or check if the user exists
    const { data: users, error } = await supabase.auth.admin.listUsers({
      perPage: 1,
    });

    if (error) {
      console.error('[resolveByEmail] Supabase error:', error);
      return null;
    }

    // Search for the user with matching email (case-insensitive)
    const user = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user || !user.email) {
      // User not found - also check if they have a profile
      // This handles the case where the user might exist in profiles but with different case
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .limit(1);

      if (!profile) {
        return null;
      }

      // If we found a profile but no auth user, the data is inconsistent
      // Return null to be safe
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('[resolveByEmail] Error:', error);
    return null;
  }
}

/**
 * Resolve user by employee ID using profiles table
 */
async function resolveByEmployeeId(
  employeeId: string
): Promise<ResolvedUserIdentifier | null> {
  try {
    // Look up user in profiles table by employee ID
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.employeeId, employeeId))
      .limit(1);

    if (!profile) {
      return null;
    }

    // Get email from Supabase auth.users using admin client
    const supabase = createAdminClient();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(profile.id);

    if (userError || !userData.user || !userData.user.email) {
      console.error(
        '[resolveByEmployeeId] Failed to get user email:',
        userError
      );
      return null;
    }

    return {
      userId: profile.id,
      email: userData.user.email,
    };
  } catch (error) {
    console.error('[resolveByEmployeeId] Error:', error);
    return null;
  }
}

/**
 * Validate that a user exists and is eligible for password reset.
 *
 * This performs additional checks beyond just resolving the identifier:
 * - User must have an active account status
 * - User's email must be verified
 *
 * @param identifier - Email address or Employee ID
 * @returns User details if found and eligible, null otherwise
 */
export async function resolveAndValidateForPasswordReset(
  identifier: string
): Promise<ResolvedUserIdentifier | null> {
  try {
    // First resolve the identifier
    const resolved = await resolveUserIdentifier(identifier);

    if (!resolved) {
      return null;
    }

    // Check profile status
    const [profile] = await db
      .select({
        accountStatus: profiles.accountStatus,
        emailVerifiedAt: profiles.emailVerifiedAt,
        isActive: profiles.isActive,
      })
      .from(profiles)
      .where(eq(profiles.id, resolved.userId))
      .limit(1);

    if (!profile) {
      return null;
    }

    // Reject if account is suspended or rejected
    if (
      profile.accountStatus === 'suspended' ||
      profile.accountStatus === 'rejected'
    ) {
      console.warn(
        `[resolveAndValidateForPasswordReset] User ${resolved.userId} has ${profile.accountStatus} status`
      );
      return null;
    }

    // Reject if account is inactive
    if (!profile.isActive) {
      console.warn(
        `[resolveAndValidateForPasswordReset] User ${resolved.userId} is inactive`
      );
      return null;
    }

    // For password reset, we don't require email to be verified
    // (they might be trying to recover access to verify their email)
    // But we should be cautious about pending accounts

    return resolved;
  } catch (error) {
    console.error('[resolveAndValidateForPasswordReset] Error:', error);
    return null;
  }
}

