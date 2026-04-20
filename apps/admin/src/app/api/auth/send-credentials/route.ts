/**
 * Send Credentials API - POST /api/auth/send-credentials
 *
 * Sends user credentials via email using Supabase Edge Function + SendGrid SMTP.
 * Used when HR/Admin creates a new user account.
 *
 * Features:
 * - Sends welcome email with employee ID and temporary password
 * - Uses SendGrid SMTP via Supabase Edge Functions
 * - Professional email template with login instructions
 * - Audit logging for security compliance
 *
 * Security:
 * - Requires admin or hr role
 * - Validates email format
 * - Does not expose credentials in response
 * - Creates audit log entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
} from '@tupsafe/auth/server';
import { sendCredentialsEmail } from '@tupsafe/auth/server';
import { createAuditLogFromRequest } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
// Request body validation schema
const sendCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  temporaryPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
});

type SendCredentialsData = z.infer<typeof sendCredentialsSchema>;

/**
 * POST /api/auth/send-credentials
 * Send user credentials via email
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['superadmin', 'admin', 'hr'],
      'admin'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = sendCredentialsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: SendCredentialsData = validationResult.data;

    // Send credentials email via Supabase Edge Function + SendGrid SMTP
    const emailResult = await sendCredentialsEmail(
      data.email,
      data.employeeId,
      data.temporaryPassword,
      data.firstName
    );

    if (!emailResult.success) {
      console.error('Failed to send credentials email:', emailResult.error);
      return NextResponse.json(
        {
          error: 'Failed to send credentials email',
          details: emailResult.error || 'Email service error',
        },
        { status: 500 }
      );
    }

    // Create audit log entry
    try {
      await createAuditLogFromRequest(
        sessionUser.userId,
        'SEND_CREDENTIALS',
        'user_credentials',
        undefined,
        {
          after: {
            email: data.email,
            employeeId: data.employeeId,
            sentBy: sessionUser.userId,
            messageId: emailResult.messageId,
          },
        },
        request.headers
      );
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Non-critical, continue
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Credentials sent successfully',
        messageId: emailResult.messageId,
      },
      {
        status: 200,
        headers: {
          // No caching for email operations
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Send credentials error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
