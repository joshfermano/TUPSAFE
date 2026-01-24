/**
 * Rate Limiting
 * Distributed rate limiter with Redis (@upstash/ratelimit) as primary
 * Falls back to in-memory rate limiting if Redis is unavailable
 */

import {
  checkRedisRateLimit,
  resetRedisRateLimit,
  getRedisRateLimitStatus,
  isRedisAvailable,
} from './redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory store for rate limit tracking (fallback)
 * Key format: `${action}:${identifier}`
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  otpRequests: {
    maxAttempts: 5,
    windowMinutes: 60,
  },
  loginAttempts: {
    maxAttempts: 10,
    windowMinutes: 60,
  },
  registrationAttempts: {
    maxAttempts: 3,
    windowMinutes: 60,
  },
  passwordResetRequests: {
    maxAttempts: 5,
    windowMinutes: 60,
  },
};

/**
 * Rate limit action types
 */
export type RateLimitAction =
  | 'otp_request'
  | 'login_attempt'
  | 'registration_attempt'
  | 'password_reset_request';

/**
 * Check and increment rate limit (synchronous version - in-memory only)
 * @deprecated Use checkRateLimitAsync for Redis-backed distributed rate limiting
 * @param action - Type of action being rate limited
 * @param identifier - Unique identifier (userId, IP, email, etc.)
 * @param customLimits - Optional custom limits
 */
export function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
  customLimits?: { maxAttempts: number; windowMinutes: number }
): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
} {
  return checkRateLimitInMemory(action, identifier, customLimits);
}

/**
 * Check and increment rate limit (async version with Redis fallback)
 * Uses Redis for distributed rate limiting, falls back to in-memory
 * @param action - Type of action being rate limited
 * @param identifier - Unique identifier (userId, IP, email, etc.)
 * @param customLimits - Optional custom limits (only applies to in-memory fallback)
 */
export async function checkRateLimitAsync(
  action: RateLimitAction,
  identifier: string,
  customLimits?: { maxAttempts: number; windowMinutes: number }
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
  source: 'redis' | 'memory';
}> {
  // Try Redis first
  try {
    const redisResult = await checkRedisRateLimit(action, identifier);

    if (redisResult) {
      return {
        allowed: redisResult.allowed,
        remaining: redisResult.remaining,
        resetAt: redisResult.resetAt,
        retryAfter: redisResult.retryAfter,
        source: 'redis',
      };
    }
  } catch (error) {
    console.warn('[Rate Limit] Redis check failed, falling back to in-memory:', error);
  }

  // Fallback to in-memory
  const memoryResult = checkRateLimitInMemory(action, identifier, customLimits);
  return {
    ...memoryResult,
    source: 'memory',
  };
}

/**
 * In-memory rate limit check (internal)
 */
function checkRateLimitInMemory(
  action: RateLimitAction,
  identifier: string,
  customLimits?: { maxAttempts: number; windowMinutes: number }
): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
} {
  const key = `${action}:${identifier}`;
  const now = Date.now();

  // Get limits
  const limits = customLimits || getRateLimitConfig(action);
  const windowMs = limits.windowMinutes * 60 * 1000;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // If entry doesn't exist or has expired, create new one
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Check if limit is exceeded
  if (entry.count >= limits.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // seconds

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limits.maxAttempts - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Reset rate limit for an identifier (synchronous - in-memory only)
 * @deprecated Use resetRateLimitAsync for Redis-backed distributed rate limiting
 * @param action - Type of action
 * @param identifier - Unique identifier
 */
export function resetRateLimit(
  action: RateLimitAction,
  identifier: string
): void {
  const key = `${action}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Reset rate limit for an identifier (async version with Redis support)
 * Resets both Redis and in-memory stores
 * @param action - Type of action
 * @param identifier - Unique identifier
 */
export async function resetRateLimitAsync(
  action: RateLimitAction,
  identifier: string
): Promise<void> {
  // Reset Redis
  try {
    await resetRedisRateLimit(action, identifier);
  } catch (error) {
    console.warn('[Rate Limit] Redis reset failed:', error);
  }

  // Reset in-memory
  const key = `${action}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing (synchronous - in-memory only)
 * @deprecated Use getRateLimitStatusAsync for Redis-backed distributed rate limiting
 * @param action - Type of action
 * @param identifier - Unique identifier
 */
export function getRateLimitStatus(
  action: RateLimitAction,
  identifier: string
): {
  attempts: number;
  remaining: number;
  resetAt: Date | null;
} {
  const key = `${action}:${identifier}`;
  const entry = rateLimitStore.get(key);
  const limits = getRateLimitConfig(action);

  if (!entry || entry.resetAt <= Date.now()) {
    return {
      attempts: 0,
      remaining: limits.maxAttempts,
      resetAt: null,
    };
  }

  return {
    attempts: entry.count,
    remaining: Math.max(0, limits.maxAttempts - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Get current rate limit status without incrementing (async with Redis support)
 * @param action - Type of action
 * @param identifier - Unique identifier
 */
export async function getRateLimitStatusAsync(
  action: RateLimitAction,
  identifier: string
): Promise<{
  attempts: number;
  remaining: number;
  resetAt: Date | null;
  source: 'redis' | 'memory';
}> {
  // Try Redis first
  try {
    const redisStatus = await getRedisRateLimitStatus(action, identifier);

    if (redisStatus) {
      return {
        ...redisStatus,
        source: 'redis',
      };
    }
  } catch (error) {
    console.warn('[Rate Limit] Redis status check failed, falling back to in-memory:', error);
  }

  // Fallback to in-memory
  const memoryStatus = getRateLimitStatus(action, identifier);
  return {
    ...memoryStatus,
    source: 'memory',
  };
}

/**
 * Get rate limit configuration for action
 */
function getRateLimitConfig(action: RateLimitAction): {
  maxAttempts: number;
  windowMinutes: number;
} {
  switch (action) {
    case 'otp_request':
      return RATE_LIMITS.otpRequests;
    case 'login_attempt':
      return RATE_LIMITS.loginAttempts;
    case 'registration_attempt':
      return RATE_LIMITS.registrationAttempts;
    case 'password_reset_request':
      return RATE_LIMITS.passwordResetRequests;
    default:
      return { maxAttempts: 10, windowMinutes: 60 };
  }
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get all rate limit entries (for debugging/monitoring)
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore);
}

/**
 * Clear all rate limits (for testing only)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(
  action: RateLimitAction,
  resetAt: Date
): string {
  const actionNames = {
    otp_request: 'OTP requests',
    login_attempt: 'login attempts',
    registration_attempt: 'registration attempts',
    password_reset_request: 'password reset requests',
  };

  const actionName = actionNames[action] || 'requests';
  const resetTime = resetAt.toLocaleTimeString();

  return `Too many ${actionName}. Please try again after ${resetTime}.`;
}

/**
 * Middleware helper to extract identifier from request
 * @param req - Request object
 */
export function getRequestIdentifier(req: {
  headers: Headers;
  ip?: string;
}): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || req.ip || 'unknown';

  return ip;
}

/**
 * Check if distributed rate limiting (Redis) is available
 */
export function isDistributedRateLimitingEnabled(): boolean {
  return isRedisAvailable();
}

/**
 * Get rate limiting backend status
 */
export function getRateLimitingBackend(): {
  backend: 'redis' | 'memory';
  available: boolean;
} {
  const redisEnabled = isRedisAvailable();
  return {
    backend: redisEnabled ? 'redis' : 'memory',
    available: true, // In-memory is always available as fallback
  };
}

// Setup periodic cleanup (every 5 minutes)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    const cleaned = cleanupExpiredRateLimits();
    if (cleaned > 0) {
      console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}
