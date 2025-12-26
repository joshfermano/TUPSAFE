/**
 * OTP (One-Time Password) System
 * Handles generation, verification, and cleanup of OTP codes
 */

import { db } from '@tupsafe/database/server';
import { otpVerifications } from '@tupsafe/database/server';
import { eq, and, gt, isNull, lt } from 'drizzle-orm';

export type OTPType =
  | 'email_verification'
  | 'login_challenge'
  | 'password_reset';

interface OTPResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Generate a random 6-digit OTP code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store a new OTP code
 * @param userId - User ID to associate with the OTP
 * @param type - Type of OTP (email_verification, login_challenge, password_reset)
 * @param expiryMinutes - Minutes until OTP expires (default: 15)
 */
export async function generateOTP(
  userId: string,
  type: OTPType,
  expiryMinutes: number = 15
): Promise<OTPResult> {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await db.insert(otpVerifications).values({
      userId,
      code,
      type,
      expiresAt,
    });

    return {
      success: true,
      code,
      expiresAt,
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      error: 'Failed to generate OTP',
    };
  }
}

/**
 * Verify an OTP code
 * @param userId - User ID
 * @param code - 6-digit OTP code
 * @param type - Type of OTP to verify
 */
export async function verifyOTP(
  userId: string,
  code: string,
  type: OTPType
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[verifyOTP] Attempting verification:`, {
      userId,
      code,
      type,
      now: new Date().toISOString(),
    });

    // First, let's see what OTPs exist for this user
    const existingOtps = await db
      .select()
      .from(otpVerifications)
      .where(eq(otpVerifications.userId, userId));

    console.log(`[verifyOTP] Existing OTPs for user ${userId}:`, existingOtps.map(o => ({
      id: o.id,
      code: o.code,
      type: o.type,
      expiresAt: o.expiresAt,
      verifiedAt: o.verifiedAt,
      createdAt: o.createdAt,
    })));

    // Find valid OTP (not expired, not verified)
    const [otp] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, userId),
          eq(otpVerifications.code, code),
          eq(otpVerifications.type, type),
          gt(otpVerifications.expiresAt, new Date()),
          isNull(otpVerifications.verifiedAt)
        )
      )
      .limit(1);

    if (!otp) {
      console.log(`[verifyOTP] No valid OTP found for userId=${userId}, code=${code}, type=${type}`);
      return {
        success: false,
        error: 'Invalid or expired OTP code',
      };
    }

    console.log(`[verifyOTP] Found valid OTP:`, otp.id);

    // Mark as verified
    await db
      .update(otpVerifications)
      .set({ verifiedAt: new Date() })
      .where(eq(otpVerifications.id, otp.id));

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: 'Failed to verify OTP',
    };
  }
}

/**
 * Check rate limit for OTP requests
 * @param userId - User ID
 * @param type - Type of OTP
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMinutes - Time window in minutes (default: 60)
 */
export async function checkOTPRateLimit(
  userId: string,
  type: OTPType,
  maxAttempts: number = 5,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const attempts = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.userId, userId),
          eq(otpVerifications.type, type),
          gt(otpVerifications.createdAt, windowStart)
        )
      );

    const remaining = Math.max(0, maxAttempts - attempts.length);
    const resetAt = new Date(Date.now() + windowMinutes * 60 * 1000);

    return {
      allowed: attempts.length < maxAttempts,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Error checking OTP rate limit:', error);
    // Fail open to prevent blocking users
    return { allowed: true, remaining: maxAttempts };
  }
}

/**
 * Resend OTP with rate limiting
 * @param userId - User ID
 * @param type - Type of OTP
 */
export async function resendOTP(
  userId: string,
  type: OTPType
): Promise<OTPResult & { remaining?: number }> {
  // Check rate limit
  const rateLimit = await checkOTPRateLimit(userId, type);

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many OTP requests. Please try again after ${rateLimit.resetAt?.toLocaleTimeString()}`,
    };
  }

  const result = await generateOTP(userId, type);

  return {
    ...result,
    remaining: rateLimit.remaining - 1,
  };
}

/**
 * Cleanup expired OTPs (background task)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(otpVerifications)
      .where(
        and(
          lt(otpVerifications.expiresAt, now),
          isNull(otpVerifications.verifiedAt)
        )
      )
      .returning();

    return result.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
}

/**
 * Get recent OTP attempts for debugging (admin only)
 */
export async function getRecentOTPAttempts(userId: string, limit: number = 10) {
  try {
    return await db
      .select({
        id: otpVerifications.id,
        type: otpVerifications.type,
        createdAt: otpVerifications.createdAt,
        expiresAt: otpVerifications.expiresAt,
        verifiedAt: otpVerifications.verifiedAt,
      })
      .from(otpVerifications)
      .where(eq(otpVerifications.userId, userId))
      .orderBy(otpVerifications.createdAt)
      .limit(limit);
  } catch (error) {
    console.error('Error fetching OTP attempts:', error);
    return [];
  }
}
