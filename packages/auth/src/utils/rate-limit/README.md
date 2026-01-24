# Rate Limiting

Distributed rate limiting for TUPSAFE authentication with automatic fallback.

## Overview

This module provides a robust rate limiting solution that uses Redis for distributed rate limiting across serverless instances, with graceful fallback to in-memory rate limiting if Redis is unavailable.

## Features

- **Distributed Rate Limiting**: Uses [@upstash/ratelimit](https://github.com/upstash/ratelimit) for serverless-compatible distributed rate limiting
- **Automatic Fallback**: Gracefully falls back to in-memory rate limiting if Redis is unavailable
- **Sliding Window Algorithm**: Uses sliding window for more accurate rate limiting
- **Zero Configuration**: Works out of the box with sensible defaults
- **TypeScript Support**: Full type safety with TypeScript
- **Vercel Compatible**: Optimized for serverless environments

## Rate Limits

| Action                    | Max Attempts | Window  |
| ------------------------- | ------------ | ------- |
| `otp_request`             | 5            | 60 min  |
| `login_attempt`           | 10           | 60 min  |
| `registration_attempt`    | 3            | 60 min  |
| `password_reset_request`  | 5            | 60 min  |

## Setup

### 1. Environment Variables

Add to your `.env.local` file:

```bash
UPSTASH_REDIS_REST_URL=https://bursting-minnow-7638.upstash.io
UPSTASH_REDIS_REST_TOKEN=AR3WAAImcDI5NjFlNTdlY2M3NjY0OWRkYWMxMjkxNzFkY2FjYzhhMHAyNzYzOA
```

### 2. Install Dependencies

```bash
cd packages/auth
npm install
```

Dependencies are already configured in `package.json`:
- `@upstash/redis`: Redis client for Upstash
- `@upstash/ratelimit`: Rate limiting library

## Usage

### Basic Usage (Async - Recommended)

```typescript
import { checkRateLimitAsync } from '@tupsafe/auth';

// In an API route
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  const result = await checkRateLimitAsync('login_attempt', ip);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many login attempts',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
        },
      }
    );
  }

  // Continue with login logic
  console.log(`Using ${result.source} rate limiting`);
}
```

### Legacy Synchronous Usage

```typescript
import { checkRateLimit } from '@tupsafe/auth';

// Synchronous (in-memory only)
const result = checkRateLimit('otp_request', userId);

if (!result.allowed) {
  throw new Error('Rate limit exceeded');
}
```

### Reset Rate Limit

```typescript
import { resetRateLimitAsync } from '@tupsafe/auth';

// After successful verification or admin action
await resetRateLimitAsync('login_attempt', userId);
```

### Check Status Without Incrementing

```typescript
import { getRateLimitStatusAsync } from '@tupsafe/auth';

const status = await getRateLimitStatusAsync('login_attempt', userId);

console.log(`Attempts: ${status.attempts}`);
console.log(`Remaining: ${status.remaining}`);
console.log(`Reset at: ${status.resetAt}`);
console.log(`Source: ${status.source}`); // 'redis' or 'memory'
```

### Check Backend Status

```typescript
import {
  isDistributedRateLimitingEnabled,
  getRateLimitingBackend
} from '@tupsafe/auth';

// Check if Redis is available
const isRedisEnabled = isDistributedRateLimitingEnabled();
console.log(`Redis enabled: ${isRedisEnabled}`);

// Get detailed backend info
const backend = getRateLimitingBackend();
console.log(`Backend: ${backend.backend}`); // 'redis' or 'memory'
console.log(`Available: ${backend.available}`); // Always true (has fallback)
```

### Extract IP from Request

```typescript
import { getRequestIdentifier } from '@tupsafe/auth';

export async function POST(req: Request) {
  const ip = getRequestIdentifier(req);

  const result = await checkRateLimitAsync('login_attempt', ip);
  // ...
}
```

## API Reference

### Async Functions (Recommended)

#### `checkRateLimitAsync(action, identifier, customLimits?)`

Check and increment rate limit using Redis with fallback to in-memory.

**Parameters:**
- `action`: `RateLimitAction` - Type of action being rate limited
- `identifier`: `string` - Unique identifier (userId, IP, email, etc.)
- `customLimits?`: `{ maxAttempts: number; windowMinutes: number }` - Optional custom limits

**Returns:** `Promise<{ allowed: boolean; remaining: number; resetAt: Date; retryAfter?: number; source: 'redis' | 'memory' }>`

#### `resetRateLimitAsync(action, identifier)`

Reset rate limit for an identifier in both Redis and in-memory.

**Parameters:**
- `action`: `RateLimitAction`
- `identifier`: `string`

**Returns:** `Promise<void>`

#### `getRateLimitStatusAsync(action, identifier)`

Get current rate limit status without incrementing.

**Parameters:**
- `action`: `RateLimitAction`
- `identifier`: `string`

**Returns:** `Promise<{ attempts: number; remaining: number; resetAt: Date | null; source: 'redis' | 'memory' }>`

### Synchronous Functions (Legacy)

#### `checkRateLimit(action, identifier, customLimits?)`

In-memory rate limit check (synchronous).

> **Deprecated:** Use `checkRateLimitAsync` for distributed rate limiting.

#### `resetRateLimit(action, identifier)`

In-memory rate limit reset (synchronous).

> **Deprecated:** Use `resetRateLimitAsync` for distributed rate limiting.

#### `getRateLimitStatus(action, identifier)`

In-memory rate limit status (synchronous).

> **Deprecated:** Use `getRateLimitStatusAsync` for distributed rate limiting.

### Utility Functions

#### `getRequestIdentifier(req)`

Extract IP address from request headers (handles proxies/load balancers).

#### `isDistributedRateLimitingEnabled()`

Check if Redis is available and distributed rate limiting is enabled.

#### `getRateLimitingBackend()`

Get current rate limiting backend information.

#### `formatRateLimitError(action, resetAt)`

Format user-friendly error message.

## Types

```typescript
type RateLimitAction =
  | 'otp_request'
  | 'login_attempt'
  | 'registration_attempt'
  | 'password_reset_request';
```

## Architecture

### Redis (Primary)

When Redis is available:
- Uses [@upstash/ratelimit](https://github.com/upstash/ratelimit) with sliding window algorithm
- Distributed across all serverless instances
- Persists across deployments and restarts
- 5-second timeout for Redis operations
- Analytics enabled for monitoring

### In-Memory (Fallback)

When Redis is unavailable:
- Falls back automatically to in-memory Map
- Per-instance rate limiting
- Automatic cleanup of expired entries every 5 minutes
- Zero external dependencies

### Fallback Triggers

The system falls back to in-memory when:
1. Environment variables are not configured
2. Redis connection fails
3. Redis operations timeout (>5 seconds)
4. Any Redis error occurs

## Error Handling

All Redis operations are wrapped in try-catch blocks with automatic fallback:

```typescript
try {
  const redisResult = await checkRedisRateLimit(action, identifier);
  if (redisResult) {
    return { ...redisResult, source: 'redis' };
  }
} catch (error) {
  console.warn('[Rate Limit] Redis check failed, falling back to in-memory:', error);
}

// Automatic fallback to in-memory
return { ...memoryResult, source: 'memory' };
```

## Monitoring

### Logs

The module provides structured logging:

```
[Rate Limit] Redis client initialized successfully
[Rate Limit] Redis credentials not configured. Falling back to in-memory rate limiting.
[Rate Limit] Redis check failed for login_attempt: <error>
[Rate Limit] Cleaned up 15 expired entries
```

### Response Metadata

Check the `source` field in responses to monitor backend usage:

```typescript
const result = await checkRateLimitAsync('login_attempt', userId);
console.log(`Rate limit source: ${result.source}`); // 'redis' or 'memory'
```

## Performance

### Redis Mode
- **Latency**: ~50-100ms (Upstash global edge)
- **Throughput**: High (distributed across regions)
- **Consistency**: Strong (sliding window)

### In-Memory Mode
- **Latency**: <1ms
- **Throughput**: Very high (no network)
- **Consistency**: Per-instance only

## Best Practices

1. **Always use async functions** for distributed rate limiting
2. **Check the `source` field** in monitoring/logging
3. **Handle 429 responses** with proper retry logic
4. **Use request identifier extraction** for consistent IP detection
5. **Reset rate limits** after successful admin actions
6. **Monitor Redis availability** in production

## Troubleshooting

### Redis not connecting

Check environment variables:
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

Verify fallback is working:
```typescript
const backend = getRateLimitingBackend();
console.log(backend); // Should show 'memory' if Redis is down
```

### Rate limits not working across instances

Ensure:
1. Environment variables are configured in Vercel
2. Redis is accessible from your deployment region
3. Using async functions (`checkRateLimitAsync`)

### High latency

If Redis latency is high:
1. Check Upstash dashboard for region
2. Verify timeout configuration (default: 5s)
3. Monitor for automatic fallback to in-memory

## Testing

### Unit Tests

```typescript
import { checkRateLimitAsync, resetRateLimitAsync } from '@tupsafe/auth';

describe('Rate Limiting', () => {
  it('should allow requests under limit', async () => {
    const result = await checkRateLimitAsync('login_attempt', 'test-user');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
  });

  it('should block requests over limit', async () => {
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimitAsync('login_attempt', 'test-user-2');
    }

    const result = await checkRateLimitAsync('login_attempt', 'test-user-2');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset rate limit', async () => {
    await resetRateLimitAsync('login_attempt', 'test-user-3');
    const result = await checkRateLimitAsync('login_attempt', 'test-user-3');
    expect(result.remaining).toBe(9);
  });
});
```

## Security Considerations

1. **IP Spoofing**: Always validate `x-forwarded-for` headers
2. **Identifier Strategy**: Use stable identifiers (userId > email > IP)
3. **Rate Limit Headers**: Include `Retry-After` in 429 responses
4. **Credential Protection**: Never log or expose Redis credentials
5. **DDoS Protection**: Combine with network-level rate limiting

## Future Enhancements

- [ ] Support for custom rate limit algorithms (token bucket, fixed window)
- [ ] Rate limit analytics dashboard
- [ ] Automatic rate limit adjustment based on traffic
- [ ] Support for rate limit headers (X-RateLimit-*)
- [ ] Integration with monitoring services (Sentry, DataDog)

## Related Documentation

- [@upstash/ratelimit Documentation](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [TUPSAFE Architecture](../../../README.md)

## License

Part of the TUPSAFE project.
