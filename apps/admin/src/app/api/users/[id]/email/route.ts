/**
 * User Email API - GET /api/users/[id]/email
 *
 * Fetches user email from Supabase Auth system.
 * Email is stored in auth.users table, not in profiles table.
 *
 * Security:
 * - Requires admin or hr role
 * - Returns only the email address (no other auth data)
 * - No caching (auth data should be fresh)
 *
 * Use Case:
 * - Edit user page needs email for display/editing
 * - User management operations requiring email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, createAdminClient } from '@tupsafe/auth/server';

/**
 * GET /api/users/[id]/email
 * Fetch user email address from Supabase Auth
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch email from Supabase Auth
    const adminClient = await createAdminClient();
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error) {
      console.error('Supabase Auth error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch user from authentication system',
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      );
    }

    // Return email address and verification status
    return NextResponse.json(
      {
        email: data.user.email || null,
        emailVerified: data.user.email_confirmed_at !== null,
      },
      {
        status: 200,
        headers: {
          // No caching for auth data
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Get user email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
