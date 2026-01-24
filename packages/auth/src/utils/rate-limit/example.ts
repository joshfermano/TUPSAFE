/**
 * Rate Limiting Examples
 * Demonstrates usage patterns for distributed rate limiting
 */

import {
  checkRateLimitAsync,
  resetRateLimitAsync,
  getRateLimitStatusAsync,
  getRequestIdentifier,
  formatRateLimitError,
  isDistributedRateLimitingEnabled,
  getRateLimitingBackend,
} from './index';

/**
 * Example 1: Login Rate Limiting
 * Rate limit login attempts by IP address
 */
export async function exampleLoginRateLimit(req: Request) {
  const ip = getRequestIdentifier(req);

  const result = await checkRateLimitAsync('login_attempt', ip);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many login attempts',
        message: formatRateLimitError('login_attempt', result.resetAt),
        retryAfter: result.retryAfter,
        resetAt: result.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
        },
      }
    );
  }

  console.log(`[Rate Limit] Using ${result.source} backend, ${result.remaining} attempts remaining`);

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
      },
    }
  );
}

/**
 * Example 2: OTP Request Rate Limiting
 * Rate limit OTP requests by user ID
 */
export async function exampleOtpRateLimit(userId: string) {
  const result = await checkRateLimitAsync('otp_request', userId);

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Please try again after ${result.resetAt.toLocaleTimeString()}`
    );
  }

  // Send OTP
  console.log(`Sending OTP to user ${userId}. ${result.remaining} requests remaining.`);

  return {
    success: true,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

/**
 * Example 3: Registration Rate Limiting
 * Rate limit registration attempts by IP and email
 */
export async function exampleRegistrationRateLimit(
  req: Request,
  email: string
) {
  const ip = getRequestIdentifier(req);

  // Check IP-based limit
  const ipResult = await checkRateLimitAsync('registration_attempt', ip);
  if (!ipResult.allowed) {
    return {
      success: false,
      error: 'Too many registration attempts from this IP',
      retryAfter: ipResult.retryAfter,
    };
  }

  // Check email-based limit
  const emailResult = await checkRateLimitAsync('registration_attempt', email);
  if (!emailResult.allowed) {
    return {
      success: false,
      error: 'Too many registration attempts for this email',
      retryAfter: emailResult.retryAfter,
    };
  }

  console.log(
    `[Rate Limit] Registration allowed. IP: ${ipResult.remaining} remaining, Email: ${emailResult.remaining} remaining`
  );

  return {
    success: true,
    remaining: {
      ip: ipResult.remaining,
      email: emailResult.remaining,
    },
  };
}

/**
 * Example 4: Password Reset Rate Limiting
 * Rate limit password reset requests by email
 */
export async function examplePasswordResetRateLimit(email: string) {
  const result = await checkRateLimitAsync('password_reset_request', email);

  if (!result.allowed) {
    return {
      success: false,
      error: formatRateLimitError('password_reset_request', result.resetAt),
      retryAfter: result.retryAfter,
      resetAt: result.resetAt,
    };
  }

  console.log(`[Rate Limit] Password reset allowed for ${email}`);

  return {
    success: true,
    remaining: result.remaining,
    message: 'Password reset email sent',
  };
}

/**
 * Example 5: Check Rate Limit Status
 * Check current status without incrementing counter
 */
export async function exampleCheckStatus(userId: string) {
  const status = await getRateLimitStatusAsync('login_attempt', userId);

  console.log(`User ${userId} login attempts:`, {
    attempts: status.attempts,
    remaining: status.remaining,
    resetAt: status.resetAt,
    source: status.source,
  });

  return status;
}

/**
 * Example 6: Reset Rate Limit
 * Reset rate limit after successful verification or admin action
 */
export async function exampleResetRateLimit(userId: string, reason: string) {
  await resetRateLimitAsync('login_attempt', userId);

  console.log(`[Rate Limit] Reset login attempts for user ${userId}. Reason: ${reason}`);

  return {
    success: true,
    message: 'Rate limit reset',
  };
}

/**
 * Example 7: Custom Rate Limits
 * Use custom limits for specific scenarios
 */
export async function exampleCustomLimits(identifier: string) {
  // Note: Custom limits only work with in-memory fallback
  // For Redis, limits are configured at the limiter level
  const result = await checkRateLimitAsync(
    'login_attempt',
    identifier,
    { maxAttempts: 5, windowMinutes: 15 } // Custom: 5 attempts per 15 minutes
  );

  if (!result.allowed) {
    return {
      success: false,
      error: 'Custom rate limit exceeded',
      retryAfter: result.retryAfter,
    };
  }

  return {
    success: true,
    remaining: result.remaining,
  };
}

/**
 * Example 8: Monitoring Backend Status
 * Check which rate limiting backend is active
 */
export function exampleMonitorBackend() {
  const isRedisEnabled = isDistributedRateLimitingEnabled();
  const backend = getRateLimitingBackend();

  console.log('[Rate Limit] Backend Status:', {
    redis: isRedisEnabled ? 'enabled' : 'disabled',
    current: backend.backend,
    available: backend.available,
  });

  return backend;
}

/**
 * Example 9: Middleware Pattern
 * Rate limiting middleware for API routes
 */
export function createRateLimitMiddleware(
  action: 'otp_request' | 'login_attempt' | 'registration_attempt' | 'password_reset_request'
) {
  return async (req: Request, handler: () => Promise<Response>) => {
    const identifier = getRequestIdentifier(req);

    const result = await checkRateLimitAsync(action, identifier);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: formatRateLimitError(action, result.resetAt),
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler();

    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.floor(result.resetAt.getTime() / 1000))
    );

    return response;
  };
}

/**
 * Example 10: Graceful Degradation
 * Handle rate limiting with graceful degradation
 */
export async function exampleGracefulDegradation(req: Request) {
  const ip = getRequestIdentifier(req);

  try {
    const result = await checkRateLimitAsync('login_attempt', ip);

    if (!result.allowed) {
      // Log whether using Redis or in-memory
      console.log(`[Rate Limit] Blocked using ${result.source} backend`);

      return {
        success: false,
        error: 'Rate limit exceeded',
        backend: result.source,
      };
    }

    // Log successful check
    console.log(`[Rate Limit] Allowed using ${result.source} backend`);

    return {
      success: true,
      remaining: result.remaining,
      backend: result.source,
    };
  } catch (error) {
    // Even if rate limiting fails completely, we can choose to:
    // 1. Allow the request (fail open)
    // 2. Deny the request (fail closed)
    // 3. Use a fallback mechanism

    console.error('[Rate Limit] Complete failure:', error);

    // Fail open: allow request but log the error
    return {
      success: true,
      warning: 'Rate limiting unavailable',
      error: String(error),
    };
  }
}

/**
 * Example 11: Next.js API Route
 * Complete example for Next.js API route
 */
export async function POST(req: Request) {
  try {
    const ip = getRequestIdentifier(req);
    const body = await req.json();
    const { email: _email, password: _password } = body;

    // Check rate limit
    const result = await checkRateLimitAsync('login_attempt', ip);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many login attempts',
          message: formatRateLimitError('login_attempt', result.resetAt),
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
          },
        }
      );
    }

    // Perform login
    // ... (authentication logic)

    // On successful login, optionally reset rate limit
    // await resetRateLimitAsync('login_attempt', ip);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  } catch (error) {
    console.error('[Login] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
