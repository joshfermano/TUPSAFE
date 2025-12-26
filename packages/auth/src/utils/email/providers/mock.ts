/**
 * Mock Email Provider
 * Logs emails to console in development mode instead of sending them
 */

import type { SendEmailPayload, EmailResult } from '../types';

/**
 * Send email via mock provider (console logging)
 */
export async function sendWithMock(payload: SendEmailPayload): Promise<EmailResult> {
  const timestamp = new Date().toISOString();
  const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║            📧 MOCK EMAIL (Development Mode)                  ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Timestamp: ${timestamp}`);
  console.log(`║ Message ID: ${mockId}`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ To: ${payload.to}`);
  console.log(`║ From: ${payload.from || 'tupsafe@tup.edu.ph'}`);
  console.log(`║ Subject: ${payload.subject}`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ Email Content Preview (plain text):');
  console.log('║ ─────────────────────────────────────────────────────────────');
  
  // Extract plain text from HTML for preview
  const plainText = payload.html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .split('\n')
    .slice(0, 15)
    .map(line => `║   ${line.trim().substring(0, 55)}`)
    .join('\n');
  
  console.log(plainText);
  console.log('║ ─────────────────────────────────────────────────────────────');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  return {
    success: true,
    messageId: mockId,
  };
}

