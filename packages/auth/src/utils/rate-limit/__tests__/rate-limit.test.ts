/**
 * Rate Limiting Tests
 * Tests for distributed rate limiting with Redis fallback
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  checkRateLimitAsync,
  resetRateLimitAsync,
  getRateLimitStatusAsync,
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  formatRateLimitError,
  getRequestIdentifier,
  isDistributedRateLimitingEnabled,
  getRateLimitingBackend,
  clearAllRateLimits,
} from '../index';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('Synchronous (In-Memory) Rate Limiting', () => {
    it('should allow requests under the limit', () => {
      const result = checkRateLimit('login_attempt', 'test-user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should block requests over the limit', () => {
      const identifier = 'test-user-2';

      // Exhaust the limit (10 attempts)
      for (let i = 0; i < 10; i++) {
        checkRateLimit('login_attempt', identifier);
      }

      // Next attempt should be blocked
      const result = checkRateLimit('login_attempt', identifier);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset rate limit', () => {
      const identifier = 'test-user-3';

      // Make some attempts
      checkRateLimit('login_attempt', identifier);
      checkRateLimit('login_attempt', identifier);

      // Reset
      resetRateLimit('login_attempt', identifier);

      // Should be back to full limit
      const result = checkRateLimit('login_attempt', identifier);
      expect(result.remaining).toBe(9); // 10 - 1
    });

    it('should get rate limit status without incrementing', () => {
      const identifier = 'test-user-4';

      // Make 3 attempts
      checkRateLimit('login_attempt', identifier);
      checkRateLimit('login_attempt', identifier);
      checkRateLimit('login_attempt', identifier);

      // Check status without incrementing
      const status = getRateLimitStatus('login_attempt', identifier);

      expect(status.attempts).toBe(3);
      expect(status.remaining).toBe(7); // 10 - 3

      // Make another attempt - should be 4th
      const result = checkRateLimit('login_attempt', identifier);
      expect(result.remaining).toBe(6); // 10 - 4
    });

    it('should handle different rate limit actions', () => {
      const identifier = 'test-user-5';

      // OTP requests: 5 per 60 minutes
      const otpResult = checkRateLimit('otp_request', identifier);
      expect(otpResult.remaining).toBe(4); // 5 - 1

      // Registration: 3 per 60 minutes
      const regResult = checkRateLimit('registration_attempt', identifier);
      expect(regResult.remaining).toBe(2); // 3 - 1

      // Password reset: 5 per 60 minutes
      const resetResult = checkRateLimit('password_reset_request', identifier);
      expect(resetResult.remaining).toBe(4); // 5 - 1
    });

    it('should use custom limits when provided', () => {
      const identifier = 'test-user-6';

      const result = checkRateLimit(
        'login_attempt',
        identifier,
        { maxAttempts: 3, windowMinutes: 15 }
      );

      expect(result.remaining).toBe(2); // 3 - 1
    });

    it('should expire rate limits after window', async () => {
      const identifier = 'test-user-7';

      // Make an attempt with short window for testing
      const result1 = checkRateLimit(
        'login_attempt',
        identifier,
        { maxAttempts: 1, windowMinutes: 0.01 } // 0.6 seconds
      );

      expect(result1.allowed).toBe(true);

      // Immediate next attempt should be blocked
      const result2 = checkRateLimit(
        'login_attempt',
        identifier,
        { maxAttempts: 1, windowMinutes: 0.01 }
      );

      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 700));

      // Should allow again
      const result3 = checkRateLimit(
        'login_attempt',
        identifier,
        { maxAttempts: 1, windowMinutes: 0.01 }
      );

      expect(result3.allowed).toBe(true);
    }, 2000);
  });

  describe('Asynchronous (Redis/Fallback) Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      const result = await checkRateLimitAsync('login_attempt', 'async-user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.source).toMatch(/^(redis|memory)$/);
    });

    it('should block requests over the limit', async () => {
      const identifier = 'async-user-2';

      // Exhaust the limit (10 attempts)
      for (let i = 0; i < 10; i++) {
        await checkRateLimitAsync('login_attempt', identifier);
      }

      // Next attempt should be blocked
      const result = await checkRateLimitAsync('login_attempt', identifier);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset rate limit', async () => {
      const identifier = 'async-user-3';

      // Make some attempts
      await checkRateLimitAsync('login_attempt', identifier);
      await checkRateLimitAsync('login_attempt', identifier);

      // Reset
      await resetRateLimitAsync('login_attempt', identifier);

      // Should be back to full limit
      const result = await checkRateLimitAsync('login_attempt', identifier);
      expect(result.remaining).toBeGreaterThanOrEqual(8);
    });

    it('should get rate limit status without incrementing', async () => {
      const identifier = 'async-user-4';

      // Clear first
      await resetRateLimitAsync('login_attempt', identifier);

      // Make 3 attempts
      await checkRateLimitAsync('login_attempt', identifier);
      await checkRateLimitAsync('login_attempt', identifier);
      await checkRateLimitAsync('login_attempt', identifier);

      // Check status without incrementing
      const status = await getRateLimitStatusAsync('login_attempt', identifier);

      expect(status.attempts).toBeGreaterThanOrEqual(3);
      expect(status.source).toMatch(/^(redis|memory)$/);
    });

    it('should return source field', async () => {
      const result = await checkRateLimitAsync('login_attempt', 'async-user-5');

      expect(result.source).toBeDefined();
      expect(['redis', 'memory']).toContain(result.source);
    });
  });

  describe('Utility Functions', () => {
    it('should format rate limit error', () => {
      const resetAt = new Date(Date.now() + 3600000); // 1 hour from now
      const error = formatRateLimitError('login_attempt', resetAt);

      expect(error).toContain('login attempts');
      expect(error).toContain('try again');
    });

    it('should extract IP from request headers', () => {
      const req1 = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        }),
      };

      const ip1 = getRequestIdentifier(req1);
      expect(ip1).toBe('192.168.1.1');

      const req2 = {
        headers: new Headers({
          'x-real-ip': '192.168.1.2',
        }),
      };

      const ip2 = getRequestIdentifier(req2);
      expect(ip2).toBe('192.168.1.2');

      const req3 = {
        headers: new Headers(),
        ip: '192.168.1.3',
      };

      const ip3 = getRequestIdentifier(req3);
      expect(ip3).toBe('192.168.1.3');
    });

    it('should check if distributed rate limiting is enabled', () => {
      const isEnabled = isDistributedRateLimitingEnabled();
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should get rate limiting backend status', () => {
      const backend = getRateLimitingBackend();

      expect(backend).toHaveProperty('backend');
      expect(backend).toHaveProperty('available');
      expect(['redis', 'memory']).toContain(backend.backend);
      expect(backend.available).toBe(true);
    });
  });

  describe('Rate Limit Actions', () => {
    it('should handle OTP requests (5 per 60 minutes)', async () => {
      const identifier = 'otp-user-1';
      await resetRateLimitAsync('otp_request', identifier);

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimitAsync('otp_request', identifier);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await checkRateLimitAsync('otp_request', identifier);
      expect(result.allowed).toBe(false);
    });

    it('should handle login attempts (10 per 60 minutes)', async () => {
      const identifier = 'login-user-1';
      await resetRateLimitAsync('login_attempt', identifier);

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimitAsync('login_attempt', identifier);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = await checkRateLimitAsync('login_attempt', identifier);
      expect(result.allowed).toBe(false);
    });

    it('should handle registration attempts (3 per 60 minutes)', async () => {
      const identifier = 'reg-user-1';
      await resetRateLimitAsync('registration_attempt', identifier);

      // Should allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimitAsync('registration_attempt', identifier);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result = await checkRateLimitAsync('registration_attempt', identifier);
      expect(result.allowed).toBe(false);
    });

    it('should handle password reset requests (5 per 60 minutes)', async () => {
      const identifier = 'reset-user-1';
      await resetRateLimitAsync('password_reset_request', identifier);

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimitAsync('password_reset_request', identifier);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await checkRateLimitAsync('password_reset_request', identifier);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const identifier = 'concurrent-user-1';
      await resetRateLimitAsync('login_attempt', identifier);

      // Make 15 concurrent requests
      const results = await Promise.all(
        Array.from({ length: 15 }, () =>
          checkRateLimitAsync('login_attempt', identifier)
        )
      );

      // Count allowed and blocked
      const allowed = results.filter(r => r.allowed).length;
      const blocked = results.filter(r => !r.allowed).length;

      // Should have allowed up to 10 and blocked the rest
      expect(allowed).toBeLessThanOrEqual(10);
      expect(blocked).toBeGreaterThanOrEqual(5);
      expect(allowed + blocked).toBe(15);
    });
  });

  describe('Different Identifiers', () => {
    it('should track rate limits separately for different identifiers', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        await checkRateLimitAsync('login_attempt', user1);
      }

      // User 1 should be blocked
      const result1 = await checkRateLimitAsync('login_attempt', user1);
      expect(result1.allowed).toBe(false);

      // User 2 should still be allowed
      const result2 = await checkRateLimitAsync('login_attempt', user2);
      expect(result2.allowed).toBe(true);
    });

    it('should track rate limits separately for different actions', async () => {
      const identifier = 'multi-action-user';

      // Exhaust login attempts
      for (let i = 0; i < 10; i++) {
        await checkRateLimitAsync('login_attempt', identifier);
      }

      // Login should be blocked
      const loginResult = await checkRateLimitAsync('login_attempt', identifier);
      expect(loginResult.allowed).toBe(false);

      // OTP should still be allowed
      const otpResult = await checkRateLimitAsync('otp_request', identifier);
      expect(otpResult.allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty identifier', async () => {
      const result = await checkRateLimitAsync('login_attempt', '');
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should handle very long identifier', async () => {
      const longId = 'a'.repeat(1000);
      const result = await checkRateLimitAsync('login_attempt', longId);
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should handle special characters in identifier', async () => {
      const specialId = 'user@example.com!#$%^&*()';
      const result = await checkRateLimitAsync('login_attempt', specialId);
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });
  });
});

describe('Request Identifier Extraction', () => {
  it('should extract from x-forwarded-for header', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      }),
    };

    const ip = getRequestIdentifier(req);
    expect(ip).toBe('203.0.113.1');
  });

  it('should extract from x-real-ip header', () => {
    const req = {
      headers: new Headers({
        'x-real-ip': '203.0.113.2',
      }),
    };

    const ip = getRequestIdentifier(req);
    expect(ip).toBe('203.0.113.2');
  });

  it('should use req.ip if headers are missing', () => {
    const req = {
      headers: new Headers(),
      ip: '203.0.113.3',
    };

    const ip = getRequestIdentifier(req);
    expect(ip).toBe('203.0.113.3');
  });

  it('should return unknown if no IP found', () => {
    const req = {
      headers: new Headers(),
    };

    const ip = getRequestIdentifier(req);
    expect(ip).toBe('unknown');
  });

  it('should prioritize x-forwarded-for over x-real-ip', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.4',
        'x-real-ip': '203.0.113.5',
      }),
    };

    const ip = getRequestIdentifier(req);
    expect(ip).toBe('203.0.113.4');
  });
});

describe('Error Message Formatting', () => {
  it('should format login attempt error', () => {
    const resetAt = new Date('2024-01-01T12:00:00Z');
    const error = formatRateLimitError('login_attempt', resetAt);

    expect(error).toContain('login attempts');
    expect(error).toContain('try again');
  });

  it('should format OTP request error', () => {
    const resetAt = new Date('2024-01-01T12:00:00Z');
    const error = formatRateLimitError('otp_request', resetAt);

    expect(error).toContain('OTP requests');
  });

  it('should format registration attempt error', () => {
    const resetAt = new Date('2024-01-01T12:00:00Z');
    const error = formatRateLimitError('registration_attempt', resetAt);

    expect(error).toContain('registration attempts');
  });

  it('should format password reset error', () => {
    const resetAt = new Date('2024-01-01T12:00:00Z');
    const error = formatRateLimitError('password_reset_request', resetAt);

    expect(error).toContain('password reset requests');
  });
});
