/**
 * Email Service
 * Handles all authentication-related emails via Resend/Supabase SMTP
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
 * Generic send email function
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML email body
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    // In production, this would use Resend API or Supabase SMTP
    // For now, we'll log the email details
    console.log('Sending email:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML length:', html.length);

    // TODO: Implement actual email sending with Resend
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // const { data, error } = await resend.emails.send({
    //   from: 'TUPSAFE <noreply@tupsafe.tup.edu.ph>',
    //   to,
    //   subject,
    //   html,
    // });

    return {
      success: true,
      messageId: 'mock-message-id',
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
 * Send OTP email
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
    const typeText = {
      email_verification: 'Email Verification',
      login_challenge: 'Login Verification',
      password_reset: 'Password Reset',
    }[type];

    const subject = `${typeText} - TUPSAFE`;
    const html = generateOTPEmailHTML(code, typeText);

    // Use Supabase's built-in email service
    // In production, this would be replaced with Resend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          email: to,
          data: {
            code,
            type: typeText,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      messageId: 'sent',
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}

/**
 * Send welcome email after account approval
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
    const subject = 'Welcome to TUPSAFE - Account Approved';
    const html = generateWelcomeEmailHTML(firstName, employeeId);

    // Implementation would use Resend or Supabase email
    console.log('Sending welcome email to:', to);
    console.log('Subject:', subject);
    console.log('Employee ID:', employeeId);

    return {
      success: true,
      messageId: 'sent',
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}

/**
 * Send rejection email
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
    const subject = 'TUPSAFE - Registration Status Update';
    const html = generateRejectionEmailHTML(firstName, reason);

    console.log('Sending rejection email to:', to);
    console.log('Subject:', subject);

    return {
      success: true,
      messageId: 'sent',
    };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}

/**
 * Send credentials email for admin-created accounts
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
    const subject = 'TUPSAFE - Your Account Credentials';
    const html = generateCredentialsEmailHTML(
      firstName,
      employeeId,
      temporaryPassword
    );

    console.log('Sending credentials email to:', to);
    console.log('Subject:', subject);

    return {
      success: true,
      messageId: 'sent',
    };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}

// ===== Email HTML Templates =====

function generateOTPEmailHTML(code: string, type: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${type} Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TUPSAFE</h1>
          <p style="color: #e0e0e0; margin: 5px 0 0 0;">TUP Manila e-PDS & e-SALN System</p>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0066cc; margin-top: 0;">${type}</h2>

          <p>Your verification code is:</p>

          <div style="background: white; border: 2px solid #0066cc; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0066cc;">${code}</span>
          </div>

          <p style="color: #666; font-size: 14px;">
            This code will expire in <strong>15 minutes</strong>.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Technological University of the Philippines - Manila<br>
            Ayala Blvd, Ermita, Manila, 1000 Metro Manila
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateWelcomeEmailHTML(
  firstName: string,
  employeeId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TUPSAFE</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TUPSAFE!</h1>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10b981; margin-top: 0;">Account Approved</h2>

          <p>Dear ${firstName},</p>

          <p>Great news! Your TUPSAFE account has been approved. You can now access the system using your credentials.</p>

          <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Employee ID:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 20px; color: #10b981; font-weight: bold;">${employeeId}</p>
          </div>

          <p>You can now:</p>
          <ul style="color: #666;">
            <li>Submit your Personal Data Sheet (e-PDS)</li>
            <li>File your Statement of Assets, Liabilities, and Net Worth (e-SALN)</li>
            <li>Track your submission status in real-time</li>
            <li>Update your profile information</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_EMPLOYEE_APP_URL}/auth/login" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Login to TUPSAFE
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            If you have any questions or need assistance, please contact the HR office.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Technological University of the Philippines - Manila<br>
            Ayala Blvd, Ermita, Manila, 1000 Metro Manila
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateRejectionEmailHTML(
  firstName: string,
  reason?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TUPSAFE</h1>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #ef4444; margin-top: 0;">Registration Status Update</h2>

          <p>Dear ${firstName},</p>

          <p>We regret to inform you that your TUPSAFE registration could not be approved at this time.</p>

          ${
            reason
              ? `
          <div style="background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Reason:</p>
            <p style="margin: 5px 0 0 0; color: #666;">${reason}</p>
          </div>
          `
              : ''
          }

          <p>If you believe this is an error or need clarification, please contact the HR office for assistance.</p>

          <div style="background: white; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>HR Office Contact:</strong><br>
              Email: hr@tup.edu.ph<br>
              Phone: (02) XXXX-XXXX
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Technological University of the Philippines - Manila<br>
            Ayala Blvd, Ermita, Manila, 1000 Metro Manila
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateCredentialsEmailHTML(
  firstName: string,
  employeeId: string,
  temporaryPassword: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your TUPSAFE Account Credentials</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TUPSAFE Account Created</h1>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0066cc; margin-top: 0;">Your Account Credentials</h2>

          <p>Dear ${firstName},</p>

          <p>An administrator has created a TUPSAFE account for you. Below are your login credentials:</p>

          <div style="background: white; border: 2px solid #0066cc; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0;"><strong>Employee ID:</strong></p>
            <p style="margin: 0 0 20px 0; font-size: 20px; color: #0066cc; font-weight: bold;">${employeeId}</p>

            <p style="margin: 0 0 10px 0;"><strong>Temporary Password:</strong></p>
            <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 18px; background: #f0f0f0; padding: 10px; border-radius: 4px;">${temporaryPassword}</p>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> You will be required to change your password upon first login.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_EMPLOYEE_APP_URL}/auth/login" style="background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Login to TUPSAFE
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <strong>Security Tips:</strong>
          </p>
          <ul style="color: #666; font-size: 14px;">
            <li>Do not share your password with anyone</li>
            <li>Change your password immediately after first login</li>
            <li>Use a strong password with at least 12 characters</li>
            <li>Log out after each session on shared computers</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Technological University of the Philippines - Manila<br>
            Ayala Blvd, Ermita, Manila, 1000 Metro Manila
          </p>
        </div>
      </body>
    </html>
  `;
}
