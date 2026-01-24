/**
 * Redis-based Distributed Rate Limiting
 * Uses @upstash/ratelimit for serverless-compatible distributed rate limiting
 * Gracefully falls back to in-memory if Redis is unavailable
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { RateLimitAction } from './index';

/**
 * Redis rate limit response
 */
export interface RedisRateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
  limit: number;
}

/**
 * Rate limit configurations matching existing limits
 */
const RATE_LIMIT_CONFIGS = {
  otp_request: {
    maxAttempts: 5,
    windowMinutes: 60,
  },
  login_attempt: {
    maxAttempts: 10,
    windowMinutes: 60,
  },
  registration_attempt: {
    maxAttempts: 3,
    windowMinutes: 60,
  },
  password_reset_request: {
    maxAttempts: 5,
    windowMinutes: 60,
  },
} as const;

/**
 * Redis client instance (lazy initialization)
 */
let redisClient: Redis | null = null;
let redisInitialized = false;
let redisAvailable = false;

/**
 * Rate limiter instances per action type
 */
const rateLimiters = new Map<RateLimitAction, Ratelimit>();

/**
 * Initialize Redis client
 * Gracefully handles missing environment variables
 */
function initializeRedis(): Redis | null {
  if (redisInitialized) {
    return redisClient;
  }

  redisInitialized = true;

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn(
        '[Rate Limit] Redis credentials not configured. Falling back to in-memory rate limiting.'
      );
      return null;
    }

    redisClient = new Redis({
      url,
      token,
    });

    redisAvailable = true;
    console.log('[Rate Limit] Redis client initialized successfully');

    return redisClient;
  } catch (error) {
    console.error('[Rate Limit] Failed to initialize Redis client:', error);
    redisAvailable = false;
    return null;
  }
}

/**
 * Get or create rate limiter for a specific action
 */
function getRateLimiter(action: RateLimitAction): Ratelimit | null {
  if (!redisAvailable) {
    return null;
  }

  // Return existing limiter if available
  if (rateLimiters.has(action)) {
    return rateLimiters.get(action)!;
  }

  // Initialize Redis if needed
  const redis = initializeRedis();
  if (!redis) {
    return null;
  }

  // Get config for this action
  const config = RATE_LIMIT_CONFIGS[action];
  const windowSeconds = config.windowMinutes * 60;

  try {
    // Create new rate limiter with sliding window algorithm
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.maxAttempts,
        `${windowSeconds} s`
      ),
      prefix: `@tupsafe/ratelimit:${action}`,
      analytics: true,
      timeout: 5000, // 5 second timeout for Redis operations
    });

    rateLimiters.set(action, limiter);
    return limiter;
  } catch (error) {
    console.error(
      `[Rate Limit] Failed to create rate limiter for ${action}:`,
      error
    );
    return null;
  }
}

/**
 * Check rate limit using Redis
 * @param action - Type of action being rate limited
 * @param identifier - Unique identifier (userId, IP, email, etc.)
 */
export async function checkRedisRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<RedisRateLimitResponse | null> {
  try {
    const limiter = getRateLimiter(action);

    if (!limiter) {
      return null; // Fall back to in-memory
    }

    // Create a unique key for this identifier
    const key = `${identifier}`;

    // Check rate limit
    const result = await limiter.limit(key);

    const now = Date.now();
    const resetAt = new Date(result.reset);
    const retryAfter = result.success
      ? undefined
      : Math.ceil((result.reset - now) / 1000);

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt,
      retryAfter,
      limit: result.limit,
    };
  } catch (error) {
    console.error(`[Rate Limit] Redis check failed for ${action}:`, error);
    // Return null to trigger fallback to in-memory
    return null;
  }
}

/**
 * Reset rate limit for an identifier
 * Note: @upstash/ratelimit doesn't provide a native reset method,
 * so we manually delete the keys
 */
export async function resetRedisRateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<boolean> {
  try {
    if (!redisAvailable || !redisClient) {
      return false;
    }

    const prefix = `@tupsafe/ratelimit:${action}`;
    const key = `${prefix}:${identifier}`;

    // Delete the rate limit key
    await redisClient.del(key);

    // Also delete any metadata keys
    await redisClient.del(`${key}:ts`);

    return true;
  } catch (error) {
    console.error(`[Rate Limit] Redis reset failed for ${action}:`, error);
    return false;
  }
}

/**
 * Get current rate limit status without incrementing
 * Note: This requires a custom implementation since @upstash/ratelimit
 * doesn't expose a "peek" method
 */
export async function getRedisRateLimitStatus(
  action: RateLimitAction,
  identifier: string
): Promise<{
  attempts: number;
  remaining: number;
  resetAt: Date | null;
} | null> {
  try {
    if (!redisAvailable || !redisClient) {
      return null;
    }

    const prefix = `@tupsafe/ratelimit:${action}`;
    const key = `${prefix}:${identifier}`;
    const config = RATE_LIMIT_CONFIGS[action];

    // Get the current count from Redis
    // The sliding window uses a sorted set to track requests
    const data = await redisClient.get<{
      count: number;
      reset: number;
    }>(key);

    if (!data) {
      return {
        attempts: 0,
        remaining: config.maxAttempts,
        resetAt: null,
      };
    }

    const remaining = Math.max(0, config.maxAttempts - data.count);

    return {
      attempts: data.count,
      remaining,
      resetAt: new Date(data.reset),
    };
  } catch (error) {
    console.error(`[Rate Limit] Redis status check failed for ${action}:`, error);
    return null;
  }
}

/**
 * Check if Redis is available and initialized
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

/**
 * Get Redis client (for testing/debugging)
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Force reconnect to Redis (for testing)
 */
export function reconnectRedis(): void {
  redisInitialized = false;
  redisClient = null;
  redisAvailable = false;
  rateLimiters.clear();
  initializeRedis();
}
