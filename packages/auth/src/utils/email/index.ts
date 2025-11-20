/**
 * Email Service
 * Handles all authentication-related emails via Supabase Edge Functions + Resend
 */

export type EmailType =
  | 'otp'
  | 'welcome'
  | 'rejection'
  | 'credentials'
  | 'password_reset';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get Supabase Edge Function URL for sending emails
 */
function getEdgeFunctionUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
  }
  return `${supabaseUrl}/functions/v1/send-email`;
}

/**
 * Get Supabase service role key for authenticated Edge Function calls
 */
function getServiceRoleKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return serviceKey;
}

/**
 * Generic send email function (deprecated - use specific email type functions)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML email body
 * @deprecated Use specific email functions (sendOTPEmail, sendWelcomeEmail, etc.)
 */
export async function sendEmail(
  to: string,
  subject: string,
  _html: string
): Promise<EmailResult> {
  try {
    console.log(
      'sendEmail called (deprecated) - use specific email functions instead'
    );
    console.log('To:', to);
    console.log('Subject:', subject);

    return {
      success: true,
      messageId: 'deprecated-function',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send OTP email via Supabase Edge Function
 * @param to - Recipient email address
 * @param code - 6-digit OTP code
 * @param type - Type of OTP (for email copy)
 */
export async function sendOTPEmail(
  to: string,
  code: string,
  type: 'email_verification' | 'login_challenge' | 'password_reset'
): Promise<EmailResult> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const serviceKey = getServiceRoleKey();

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'otp',
        to,
        code,
        otpType: type,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Edge Function error:', data);
      throw new Error(data.error || 'Failed to send OTP email');
    }

    console.log(`✓ OTP email sent successfully to ${to} (type: ${type})`);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send welcome email after account approval via Supabase Edge Function
 * @param to - Recipient email address
 * @param employeeId - Assigned employee ID
 * @param firstName - User's first name
 */
export async function sendWelcomeEmail(
  to: string,
  employeeId: string,
  firstName: string
): Promise<EmailResult> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const serviceKey = getServiceRoleKey();

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'welcome',
        to,
        firstName,
        employeeId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Edge Function error:', data);
      throw new Error(data.error || 'Failed to send welcome email');
    }

    console.log(`✓ Welcome email sent successfully to ${to}`);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send rejection email via Supabase Edge Function
 * @param to - Recipient email address
 * @param firstName - User's first name
 * @param reason - Rejection reason (optional)
 */
export async function sendRejectionEmail(
  to: string,
  firstName: string,
  reason?: string
): Promise<EmailResult> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const serviceKey = getServiceRoleKey();

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'rejection',
        to,
        firstName,
        reason,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Edge Function error:', data);
      throw new Error(data.error || 'Failed to send rejection email');
    }

    console.log(`✓ Rejection email sent successfully to ${to}`);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send credentials email for admin-created accounts via Supabase Edge Function
 * @param to - Recipient email address
 * @param employeeId - Employee ID
 * @param temporaryPassword - Temporary password
 * @param firstName - User's first name
 */
export async function sendCredentialsEmail(
  to: string,
  employeeId: string,
  temporaryPassword: string,
  firstName: string
): Promise<EmailResult> {
  try {
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const serviceKey = getServiceRoleKey();

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'credentials',
        to,
        firstName,
        employeeId,
        temporaryPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Edge Function error:', data);
      throw new Error(data.error || 'Failed to send credentials email');
    }

    console.log(`✓ Credentials email sent successfully to ${to}`);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
