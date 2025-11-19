/**
 * Session API Route
 * Validates and returns current session data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateSession,
  getRemainingSessionTime,
} from '@tupsafe/auth/server';

export async function GET(_request: NextRequest) {
  try {
    // Validate current session
    const validation = await validateSession();

    if (!validation.valid || !validation.session) {
      return NextResponse.json(
        {
          error: 'No valid session',
          reason: validation.reason || 'Session not found',
        },
        { status: 401 }
      );
    }

    const session = validation.session;

    // Calculate remaining session time
    const remainingTime = getRemainingSessionTime(session);

    return NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        email: session.email,
        employeeId: session.employeeId,
        role: session.role,
        lastActivity: session.lastActivity,
        remainingTime, // in milliseconds
        remainingMinutes: Math.floor(remainingTime / 60000),
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while validating session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
