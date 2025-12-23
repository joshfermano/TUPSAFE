/**
 * DEPRECATED: Legacy Registration API Route
 *
 * This endpoint is deprecated and returns 410 Gone.
 * 
 * Use the new multi-step registration flow instead:
 * 1. POST /api/auth/register/initiate - Start registration, create user, send OTP
 * 2. POST /api/auth/register/verify-otp - Verify email with OTP
 * 3. POST /api/auth/register/complete - Complete registration with employment/applicant details
 *
 * The new flow properly separates:
 * - Email verification (step 1-2)
 * - Profile completion (step 3)
 * - Applicant auto-activation vs Employee pending approval
 *
 * @deprecated Use /api/auth/register/initiate + /api/auth/register/complete instead
 * @module api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Error response structure
 */
interface DeprecationResponse {
  success: false;
  error: string;
  details: {
    message: string[];
    migration: {
      step1: string;
      step2: string;
      step3: string;
    };
  };
}

/**
 * POST /api/auth/register
 *
 * DEPRECATED: Returns 410 Gone with migration instructions
 */
export async function POST(
  _request: NextRequest
): Promise<NextResponse<DeprecationResponse>> {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Please use the new registration flow.',
      details: {
        message: [
          'The /api/auth/register endpoint has been deprecated.',
          'Please use the new multi-step registration flow for improved security and user experience.',
        ],
        migration: {
          step1: 'POST /api/auth/register/initiate - Start registration and send OTP',
          step2: 'POST /api/auth/register/verify-otp - Verify email with OTP',
          step3: 'POST /api/auth/register/complete - Complete registration',
        },
      },
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
