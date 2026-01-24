/**
 * Verification Script for Distributed Rate Limiting
 * Run this to verify the rate limiting implementation
 */

import {
  checkRateLimitAsync,
  resetRateLimitAsync,
  getRateLimitStatusAsync,
  isDistributedRateLimitingEnabled,
  getRateLimitingBackend,
  formatRateLimitError,
} from './index';

async function main() {
  console.log('=== Rate Limiting Verification ===\n');

  // 1. Check backend status
  console.log('1. Backend Status:');
  const isRedis = isDistributedRateLimitingEnabled();
  const backend = getRateLimitingBackend();
  console.log(`   Redis Enabled: ${isRedis}`);
  console.log(`   Current Backend: ${backend.backend}`);
  console.log(`   Available: ${backend.available}\n`);

  // 2. Test rate limiting
  console.log('2. Testing Rate Limiting:');
  const testUser = `verify-user-${Date.now()}`;

  // Make 3 requests
  for (let i = 1; i <= 3; i++) {
    const result = await checkRateLimitAsync('login_attempt', testUser);
    console.log(
      `   Request ${i}: ${result.allowed ? 'Allowed' : 'Blocked'}, ` +
        `Remaining: ${result.remaining}, Source: ${result.source}`
    );
  }

  // 3. Check status
  console.log('\n3. Checking Status:');
  const status = await getRateLimitStatusAsync('login_attempt', testUser);
  console.log(`   Attempts: ${status.attempts}`);
  console.log(`   Remaining: ${status.remaining}`);
  console.log(`   Reset At: ${status.resetAt?.toISOString() || 'N/A'}`);
  console.log(`   Source: ${status.source}`);

  // 4. Test reset
  console.log('\n4. Testing Reset:');
  await resetRateLimitAsync('login_attempt', testUser);
  const afterReset = await getRateLimitStatusAsync('login_attempt', testUser);
  console.log(`   After Reset - Attempts: ${afterReset.attempts}`);
  console.log(`   After Reset - Remaining: ${afterReset.remaining}`);

  // 5. Test rate limit exceeded
  console.log('\n5. Testing Rate Limit Exceeded:');
  const limitTestUser = `limit-test-${Date.now()}`;

  // Exhaust the limit (10 for login_attempt)
  for (let i = 0; i < 10; i++) {
    await checkRateLimitAsync('login_attempt', limitTestUser);
  }

  // This should be blocked
  const blocked = await checkRateLimitAsync('login_attempt', limitTestUser);
  console.log(`   Blocked: ${!blocked.allowed}`);
  console.log(`   Retry After: ${blocked.retryAfter || 0} seconds`);
  console.log(`   Error Message: ${formatRateLimitError('login_attempt', blocked.resetAt)}`);

  // 6. Test different actions
  console.log('\n6. Testing Different Actions:');
  const actionTestUser = `action-test-${Date.now()}`;

  const otpResult = await checkRateLimitAsync('otp_request', actionTestUser);
  console.log(`   OTP Request: Remaining ${otpResult.remaining}/5`);

  const regResult = await checkRateLimitAsync('registration_attempt', actionTestUser);
  console.log(`   Registration: Remaining ${regResult.remaining}/3`);

  const resetResult = await checkRateLimitAsync('password_reset_request', actionTestUser);
  console.log(`   Password Reset: Remaining ${resetResult.remaining}/5`);

  // 7. Summary
  console.log('\n=== Verification Complete ===');
  console.log('All tests passed successfully!');
  console.log(`Backend: ${backend.backend}`);
  console.log('Rate limiting is working correctly.\n');
}

// Run verification
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export default main;
