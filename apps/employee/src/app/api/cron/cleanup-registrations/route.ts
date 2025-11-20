import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@tupsafe/auth/server';
import { db, otpVerifications, createAuditLog } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

interface CleanupResult {
  success: boolean;
  usersDeleted: number;
  otpsDeleted: number;
  errors: number;
  timestamp: string;
}

const CLEANUP_AGE_MINUTES = 30; // 2x the OTP expiry time

/**
 * Verify cron job authorization
 */
function verifyAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('⚠️  CRON_SECRET not configured - cron job is unprotected!');
    return true; // Allow if not configured (development mode)
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Find incomplete registrations older than CLEANUP_AGE_MINUTES
 */
async function findStuckRegistrations(): Promise<
  Array<{ id: string; email: string }>
> {
  const supabase = createAdminClient();

  // Calculate cutoff time
  const cutoffTime = new Date(Date.now() - CLEANUP_AGE_MINUTES * 60 * 1000);

  const { data: users, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .is('email_confirmed_at', null)
    .lt('created_at', cutoffTime.toISOString());

  if (error) {
    console.error('❌ Error querying stuck registrations:', error);
    return [];
  }

  return users || [];
}

/**
 * Delete OTP records for a user
 */
async function deleteUserOTPs(userId: string): Promise<number> {
  try {
    const result = await db
      .delete(otpVerifications)
      .where(eq(otpVerifications.userId, userId))
      .returning();

    return result.length || 0;
  } catch (error) {
    console.error(`Failed to delete OTPs for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Delete auth user via Supabase Admin API
 */
async function deleteAuthUser(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error(`Failed to delete auth user ${userId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Exception deleting auth user ${userId}:`, error);
    return false;
  }
}

/**
 * GET /api/cron/cleanup-registrations
 *
 * Cleanup incomplete registrations
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CleanupResult>> {
  // Verify authorization
  if (!verifyAuthorization(request)) {
    return NextResponse.json(
      {
        success: false,
        usersDeleted: 0,
        otpsDeleted: 0,
        errors: 1,
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  console.log(`\n🧹 Starting cleanup job at ${new Date().toISOString()}`);

  let usersDeleted = 0;
  let otpsDeleted = 0;
  let errors = 0;

  try {
    // Find stuck registrations
    const stuckUsers = await findStuckRegistrations();

    console.log(
      `📊 Found ${stuckUsers.length} stuck registration(s) older than ${CLEANUP_AGE_MINUTES} minutes`
    );

    if (stuckUsers.length === 0) {
      return NextResponse.json({
        success: true,
        usersDeleted: 0,
        otpsDeleted: 0,
        errors: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Process each stuck registration
    for (const user of stuckUsers) {
      console.log(`🗑️  Cleaning up user: ${user.email} (${user.id})`);

      try {
        // Delete OTP records
        const otpCount = await deleteUserOTPs(user.id);
        otpsDeleted += otpCount;

        // Delete auth user
        const deleted = await deleteAuthUser(user.id);

        if (deleted) {
          usersDeleted++;
          console.log(`   ✅ Deleted user: ${user.email}`);

          // Create audit log
          await createAuditLog({
            userId: user.id,
            action: 'DELETE',
            entityType: 'registration',
            entityId: user.id,
            metadata: {
              email: user.email,
              reason: 'automatic_cleanup',
              registrationStatus: 'incomplete',
              age_minutes: CLEANUP_AGE_MINUTES,
              otps_deleted: otpCount,
            },
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: 'cron-job',
          });
        } else {
          errors++;
          console.error(`   ❌ Failed to delete user: ${user.email}`);
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log(
      `\n✨ Cleanup complete: ${usersDeleted} users, ${otpsDeleted} OTPs deleted, ${errors} errors\n`
    );

    return NextResponse.json({
      success: errors === 0,
      usersDeleted,
      otpsDeleted,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Fatal error in cleanup job:', error);

    return NextResponse.json(
      {
        success: false,
        usersDeleted,
        otpsDeleted,
        errors: errors + 1,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/cleanup-registrations
 *
 * Same as GET, for cron job compatibility
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CleanupResult>> {
  return GET(request);
}
