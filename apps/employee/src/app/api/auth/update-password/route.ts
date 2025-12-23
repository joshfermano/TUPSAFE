/**
 * Update Password API Route (Deprecated)
 *
 * This endpoint has been replaced by:
 * - POST /api/auth/change-password - For logged-in users changing their password
 * - POST /api/auth/reset-password - For OTP-based password reset
 *
 * This route returns a 410 Gone status with guidance on which endpoint to use.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/update-password
 *
 * @deprecated Use /api/auth/change-password or /api/auth/reset-password instead
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint deprecated',
      message:
        'This endpoint has been replaced. ' +
        'Use POST /api/auth/change-password for logged-in password changes, ' +
        'or POST /api/auth/reset-password for OTP-based password reset.',
      alternatives: {
        changePassword: {
          endpoint: '/api/auth/change-password',
          description: 'Change password while logged in (requires current password)',
        },
        resetPassword: {
          endpoint: '/api/auth/reset-password',
          description: 'Reset password using OTP verification (for forgot password flow)',
        },
      },
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}
