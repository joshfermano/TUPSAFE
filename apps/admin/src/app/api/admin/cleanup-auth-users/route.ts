/**
 * Admin Auth Users Cleanup Endpoint
 *
 * One-time endpoint to clean up auth.users table, preserving only admin accounts.
 *
 * IMPORTANT: This endpoint should be called with caution as it permanently deletes
 * users from the authentication system.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  checkUserRoleFromSupabase,
} from '@tupsafe/auth/server';
import { createAdminClient } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
/**
 * Admin account to preserve
 */
const PRESERVE_ADMIN = {
  id: 'fd65b88b-036e-455c-8b7c-792dc2cf36e4',
  email: 'admin@tup.edu.ph',
};

/**
 * Known users to delete (for logging purposes)
 */
const KNOWN_DELETIONS = [
  {
    id: 'f37ec065-2daf-48b7-bb5f-7c35dc99a230',
    email: 'joshkhovick.fermano@tup.edu.ph',
  },
  {
    id: 'c05d93cc-0fde-4509-b464-49510feef0af',
    email: 'justinesimbajon9@gmail.com',
  },
  {
    id: '987fcfeb-07b0-407b-b5c5-1f17fcd48a94',
    email: 'earljustine.simbajon@tup.edu.ph',
  },
  {
    id: 'adb161cc-95d6-4573-9406-9936ea7f4ee7',
    email: 'dennis.delossantos@tup.edu.ph',
  },
];

export async function POST(_request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Auth Cleanup] Starting auth users cleanup process...');

    // 1. Verify admin permissions
    console.log('[Auth Cleanup] Step 1: Verifying admin permissions...');
    const sessionUser = await getUserFromSupabase('admin');

    if (!sessionUser) {
      console.error('[Auth Cleanup] Authentication failed - no session user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRoleFromSupabase(['admin'], 'admin');

    if (!hasPermission) {
      console.error(
        '[Auth Cleanup] Authorization failed - user lacks admin role',
        {
          userId: sessionUser.id,
          userRole: sessionUser.role,
        }
      );
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    console.log('[Auth Cleanup] User authorized:', {
      userId: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    });

    // 2. Get all admin/hr user IDs from profiles
    console.log('[Auth Cleanup] Step 2: Fetching admin/hr profiles...');
    const adminProfiles = await db
      .select({
        id: profiles.id,
        role: profiles.role,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(profiles)
      .where(or(eq(profiles.role, 'admin'), eq(profiles.role, 'hr')));

    const adminIds = adminProfiles.map((p) => p.id);

    console.log('[Auth Cleanup] Found admin/hr profiles:', {
      count: adminProfiles.length,
      profiles: adminProfiles.map((p) => ({
        id: p.id,
        role: p.role,
        name: `${p.firstName} ${p.lastName}`,
      })),
    });

    // Verify the main admin is in the list
    if (!adminIds.includes(PRESERVE_ADMIN.id)) {
      console.warn(
        '[Auth Cleanup] Warning: Main admin not found in profiles, adding to preserve list'
      );
      adminIds.push(PRESERVE_ADMIN.id);
    }

    // 3. Get all auth users
    console.log('[Auth Cleanup] Step 3: Fetching all auth users...');
    const supabase = await createAdminClient();

    const { data: authUsersData, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError || !authUsersData) {
      console.error(
        '[Auth Cleanup] Failed to list auth users:',
        listError?.message
      );
      throw new Error(
        `Failed to list auth users: ${listError?.message || 'Unknown error'}`
      );
    }

    const authUsers = authUsersData.users;

    console.log('[Auth Cleanup] Found auth users:', {
      total: authUsers.length,
      users: authUsers.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
      })),
    });

    // 4. Identify users to delete and preserve
    const usersToDelete = authUsers.filter(
      (user) => !adminIds.includes(user.id)
    );
    const usersToPreserve = authUsers.filter((user) =>
      adminIds.includes(user.id)
    );

    console.log('[Auth Cleanup] Step 4: Deletion plan:', {
      toPreserve: usersToPreserve.length,
      toDelete: usersToDelete.length,
      preserveList: usersToPreserve.map((u) => ({
        id: u.id,
        email: u.email,
      })),
      deleteList: usersToDelete.map((u) => ({
        id: u.id,
        email: u.email,
      })),
    });

    // 5. Delete non-admin users
    console.log('[Auth Cleanup] Step 5: Starting deletion process...');
    const deletions: Array<{ id: string; email: string | undefined }> = [];
    const errors: Array<{
      id: string;
      email: string | undefined;
      error: string;
    }> = [];

    for (const user of usersToDelete) {
      console.log(
        `[Auth Cleanup] Attempting to delete user: ${user.email} (${user.id})`
      );

      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error(
          `[Auth Cleanup] Failed to delete user ${user.email}:`,
          deleteError.message
        );
        errors.push({
          id: user.id,
          email: user.email,
          error: deleteError.message,
        });
      } else {
        console.log(`[Auth Cleanup] Successfully deleted user: ${user.email}`);
        deletions.push({
          id: user.id,
          email: user.email,
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 6. Build detailed report
    const report = {
      success: true,
      message: 'Auth users cleanup completed',
      timestamp: new Date().toISOString(),
      executedBy: {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
      },
      summary: {
        totalAuthUsers: authUsers.length,
        adminsPreserved: usersToPreserve.length,
        usersDeleted: deletions.length,
        deletionsFailed: errors.length,
        duration: `${duration}ms`,
      },
      preserved: usersToPreserve.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
      })),
      deleted: deletions,
      errors: errors.length > 0 ? errors : undefined,
      knownDeletions: KNOWN_DELETIONS.map((known) => ({
        ...known,
        deleted: deletions.some((d) => d.id === known.id),
      })),
    };

    console.log('[Auth Cleanup] Cleanup completed:', {
      duration: `${duration}ms`,
      deleted: deletions.length,
      errors: errors.length,
    });

    // Return detailed report
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Auth Cleanup] Fatal error during cleanup:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup auth users',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
