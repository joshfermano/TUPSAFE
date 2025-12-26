import type { SendEmailPayload, EmailResult } from '../types';

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface SendGridPersonalization {
  to: Array<{ email: string; name?: string }>;
}

interface SendGridContent {
  type: string;
  value: string;
}

interface SendGridMailPayload {
  personalizations: SendGridPersonalization[];
  from: { email: string; name?: string };
  subject: string;
  content: SendGridContent[];
}

/**
 * Get SendGrid API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not configured');
  }
  return apiKey;
}

/**
 * Get email from address
 */
function getFromAddress(): { email: string; name: string } {
  const email = process.env.EMAIL_FROM || 'tupsafe@tup.edu.ph';
  const name = process.env.EMAIL_FROM_NAME || 'TUPSAFE';
  return { email, name };
}

/**
 * Send email via SendGrid Web API
 */
export async function sendWithSendGrid(
  payload: SendEmailPayload
): Promise<EmailResult> {
  try {
    const apiKey = getApiKey();
    const fromAddress = getFromAddress();

    const mailPayload: SendGridMailPayload = {
      personalizations: [
        {
          to: [{ email: payload.to, name: payload.toName }],
        },
      ],
      from: {
        email: payload.from || fromAddress.email,
        name: payload.fromName || fromAddress.name,
      },
      subject: payload.subject,
      content: [
        {
          type: 'text/html',
          value: payload.html,
        },
      ],
    };

    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailPayload),
    });

    // SendGrid returns 202 Accepted on success
    if (response.status === 202 || response.status === 200) {
      // Extract message ID from headers if available
      const messageId =
        response.headers.get('X-Message-Id') || `sg-${Date.now()}`;

      console.log(`✓ Email sent successfully via SendGrid to ${payload.to}`);
      return {
        success: true,
        messageId,
      };
    }

    // Handle error response
    let errorMessage = `SendGrid API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        errorMessage = errorBody.errors
          .map((e: { message: string }) => e.message)
          .join(', ');
      }
    } catch {
      // If we can't parse the error body, use the status message
    }

    console.error('SendGrid API error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown SendGrid error';
    console.error('SendGrid send error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
