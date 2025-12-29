/**
 * Mock Email Provider
 * Logs emails to console in development mode instead of sending them
 */

import type { SendEmailPayload, EmailResult } from '../types';

/**
 * Extract OTP code from email HTML content
 */
function extractOTPCode(html: string): string | null {
  // Look for 6-digit codes in the HTML
  const otpMatch = html.match(/\b(\d{6})\b/);
  return otpMatch ? otpMatch[1] : null;
}

/**
 * Send email via mock provider (console logging)
 */
export async function sendWithMock(
  payload: SendEmailPayload
): Promise<EmailResult> {
  const mockId = `mock-${Date.now()}`;
  const otpCode = extractOTPCode(payload.html);

  // Simple, clean output with OTP prominently displayed
  console.log('\n');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│       📧 MOCK EMAIL (Dev Mode)          │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│ To: ${payload.to.padEnd(34)}│`);
  console.log(`│ Subject: ${payload.subject.substring(0, 29).padEnd(29)}│`);

  if (otpCode) {
    console.log('├─────────────────────────────────────────┤');
    console.log('│                                         │');
    console.log(`│         🔐 OTP CODE: ${otpCode}            │`);
    console.log('│                                         │');
  }

  console.log('└─────────────────────────────────────────┘');
  console.log('');

  return {
    success: true,
    messageId: mockId,
  };
}
