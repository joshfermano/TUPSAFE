/**
 * Device Fingerprinting and Trust Management
 * Handles device identification and 30-day trust system
 */

import { db, trustedDevices } from '@tupsafe/database';
import { eq, and, gt, lt } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a device fingerprint from IP and User-Agent
 * @param ipAddress - Client IP address
 * @param userAgent - Browser User-Agent string
 */
export function generateDeviceFingerprint(
  ipAddress: string,
  userAgent: string
): string {
  const combined = `${ipAddress}|${userAgent}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Check if a device is trusted
 * @param userId - User ID
 * @param deviceFingerprint - Device fingerprint hash
 */
export async function checkTrustedDevice(
  userId: string,
  deviceFingerprint: string
): Promise<{
  trusted: boolean;
  device?: {
    id: string;
    trustedAt: Date;
    expiresAt: Date;
    lastUsedAt: Date;
  };
}> {
  try {
    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, userId),
          eq(trustedDevices.deviceFingerprint, deviceFingerprint),
          gt(trustedDevices.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!device) {
      return { trusted: false };
    }

    // Update last used timestamp
    await db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(eq(trustedDevices.id, device.id));

    return {
      trusted: true,
      device: {
        id: device.id,
        trustedAt: device.trustedAt,
        expiresAt: device.expiresAt,
        lastUsedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return { trusted: false };
  }
}

/**
 * Trust a device for 30 days
 * @param userId - User ID
 * @param deviceFingerprint - Device fingerprint hash
 * @param browserInfo - User-Agent string for display
 * @param ipAddress - IP address for audit
 */
export async function trustDevice(
  userId: string,
  deviceFingerprint: string,
  browserInfo: string,
  ipAddress: string
): Promise<{ success: boolean; expiresAt?: Date; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if device already exists
    const [existing] = await db
      .select()
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, userId),
          eq(trustedDevices.deviceFingerprint, deviceFingerprint)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing device trust
      await db
        .update(trustedDevices)
        .set({
          trustedAt: now,
          expiresAt,
          lastUsedAt: now,
          browserInfo,
          ipAddress,
        })
        .where(eq(trustedDevices.id, existing.id));
    } else {
      // Insert new trusted device
      await db.insert(trustedDevices).values({
        userId,
        deviceFingerprint,
        browserInfo,
        ipAddress,
        trustedAt: now,
        expiresAt,
        lastUsedAt: now,
      });
    }

    return {
      success: true,
      expiresAt,
    };
  } catch (error) {
    console.error('Error trusting device:', error);
    return {
      success: false,
      error: 'Failed to trust device',
    };
  }
}

/**
 * Revoke trust from a specific device
 * @param userId - User ID
 * @param deviceId - Device ID to revoke
 */
export async function revokeDeviceTrust(
  userId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(trustedDevices)
      .where(
        and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, userId))
      );

    return { success: true };
  } catch (error) {
    console.error('Error revoking device trust:', error);
    return {
      success: false,
      error: 'Failed to revoke device trust',
    };
  }
}

/**
 * Revoke trust from all devices for a user
 * @param userId - User ID
 */
export async function revokeAllDevices(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const result = await db
      .delete(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .returning();

    return {
      success: true,
      count: result.length || 0,
    };
  } catch (error) {
    console.error('Error revoking all devices:', error);
    return {
      success: false,
      error: 'Failed to revoke devices',
    };
  }
}

/**
 * Get all trusted devices for a user
 * @param userId - User ID
 */
export async function getUserDevices(userId: string) {
  try {
    const devices = await db
      .select({
        id: trustedDevices.id,
        browserInfo: trustedDevices.browserInfo,
        ipAddress: trustedDevices.ipAddress,
        trustedAt: trustedDevices.trustedAt,
        expiresAt: trustedDevices.expiresAt,
        lastUsedAt: trustedDevices.lastUsedAt,
      })
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, userId),
          gt(trustedDevices.expiresAt, new Date())
        )
      )
      .orderBy(trustedDevices.lastUsedAt);

    return devices;
  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
}

/**
 * Cleanup expired devices (background task)
 */
export async function cleanupExpiredDevices(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(trustedDevices)
      .where(lt(trustedDevices.expiresAt, now))
      .returning();

    return result.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired devices:', error);
    return 0;
  }
}

/**
 * Parse User-Agent string for display
 * @param userAgent - User-Agent string
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Simple parsing - can be enhanced with a library like ua-parser-js
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Detect device type
  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet')) device = 'Tablet';

  return { browser, os, device };
}
