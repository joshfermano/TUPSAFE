/**
 * Email Service
 * Handles all application emails via SendGrid Web API or mock provider
 *
 * This module is server-only and should be imported from @tupsafe/auth/server
 *
 * Provider Selection:
 * - Development mode (USE_MOCK_EMAILS=true): Logs emails to console
 * - Production mode: Sends emails via SendGrid Web API v3
 */

import { sendWithMock } from './providers/mock';
import { sendWithSendGrid } from './providers/sendgrid';
import {
  otpTemplate,
  welcomeTemplate,
  rejectionTemplate,
  credentialsTemplate,
  passwordResetTemplate,
  applicationStatusTemplate,
  pdsStatusTemplate,
  salnStatusTemplate,
  bulkApprovalTemplate,
} from './templates';

// Re-export types for consumers
export type {
  EmailResult,
  EmailType,
  OTPType,
  SubmissionStatus,
  ApplicationStatusEmailPayload,
  PDSStatusEmailPayload,
  SALNStatusEmailPayload,
  BulkApprovalEmailPayload,
  SendEmailPayload,
} from './types';

import type {
  EmailResult,
  SendEmailPayload,
  ApplicationStatusEmailPayload,
  PDSStatusEmailPayload,
  SALNStatusEmailPayload,
  BulkApprovalEmailPayload,
  OTPType,
} from './types';

/**
 * Check if we're in development mode and should use mock emails
 */
function shouldUseMockEmails(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.USE_MOCK_EMAILS === 'true'
  );
}

/**
 * Send email via the appropriate provider (mock or SendGrid)
 */
async function sendWithProvider(
  payload: SendEmailPayload
): Promise<EmailResult> {
  if (shouldUseMockEmails()) {
    return sendWithMock(payload);
  }
  return sendWithSendGrid(payload);
}

/**
 * Generic send email function (deprecated - use specific email type functions)
 * @deprecated Use specific email functions (sendOTPEmail, sendWelcomeEmail, etc.)
 */
export async function sendEmail(
  to: string,
  subject: string,
  _html: string
): Promise<EmailResult> {
  console.log(
    'sendEmail called (deprecated) - use specific email functions instead'
  );
  console.log('To:', to);
  console.log('Subject:', subject);

  return {
    success: true,
    messageId: 'deprecated-function',
  };
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
  type: OTPType
): Promise<EmailResult> {
  try {
    const { subject, html } = otpTemplate(code, type);

    const result = await sendWithProvider({
      to,
      subject,
      html,
    });

    if (result.success) {
      console.log(`✓ OTP email sent successfully to ${to} (type: ${type})`);
    }

    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
    const { subject, html } = welcomeTemplate(firstName, employeeId);

    const result = await sendWithProvider({
      to,
      toName: firstName,
      subject,
      html,
    });

    if (result.success) {
      console.log(`✓ Welcome email sent successfully to ${to}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
    const { subject, html } = rejectionTemplate(firstName, reason);

    const result = await sendWithProvider({
      to,
      toName: firstName,
      subject,
      html,
    });

    if (result.success) {
      console.log(`✓ Rejection email sent successfully to ${to}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
    const { subject, html } = credentialsTemplate(
      firstName,
      employeeId,
      temporaryPassword
    );

    const result = await sendWithProvider({
      to,
      toName: firstName,
      subject,
      html,
    });

    if (result.success) {
      console.log(`✓ Credentials email sent successfully to ${to}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send password reset email
 * @param to - Recipient email address
 * @param temporaryPassword - New temporary password
 * @param firstName - User's first name
 */
export async function sendPasswordResetEmail(
  to: string,
  temporaryPassword: string,
  firstName: string
): Promise<EmailResult> {
  try {
    const { subject, html } = passwordResetTemplate(firstName, temporaryPassword);

    const result = await sendWithProvider({
      to,
      toName: firstName,
      subject,
      html,
    });

    if (result.success) {
      console.log(`✓ Password reset email sent successfully to ${to}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send application status update email
 * Used to notify applicants of job application status changes
 * @param payload - Application status email payload
 */
export async function sendApplicationStatusEmail(
  payload: ApplicationStatusEmailPayload
): Promise<EmailResult> {
  try {
    const { subject, html } = applicationStatusTemplate(payload);

    const result = await sendWithProvider({
      to: payload.to,
      toName: payload.applicantName,
      subject,
      html,
    });

    if (result.success) {
      console.log(
        `✓ Application status email sent successfully to ${payload.to} (status: ${payload.status})`
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending application status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send PDS status update email
 * Used to notify employees of PDS submission status changes
 * @param payload - PDS status email payload
 */
export async function sendPDSStatusEmail(
  payload: PDSStatusEmailPayload
): Promise<EmailResult> {
  try {
    const { subject, html } = pdsStatusTemplate(payload);

    const result = await sendWithProvider({
      to: payload.to,
      toName: payload.employeeName,
      subject,
      html,
    });

    if (result.success) {
      console.log(
        `✓ PDS status email sent successfully to ${payload.to} (status: ${payload.status})`
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending PDS status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send SALN status update email
 * Used to notify employees of SALN submission status changes
 * @param payload - SALN status email payload
 */
export async function sendSALNStatusEmail(
  payload: SALNStatusEmailPayload
): Promise<EmailResult> {
  try {
    const { subject, html } = salnStatusTemplate(payload);

    const result = await sendWithProvider({
      to: payload.to,
      toName: payload.employeeName,
      subject,
      html,
    });

    if (result.success) {
      console.log(
        `✓ SALN status email sent successfully to ${payload.to} (status: ${payload.status})`
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending SALN status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send bulk approval summary email
 * Used to notify employees when multiple submissions are approved at once
 * @param payload - Bulk approval email payload
 */
export async function sendBulkApprovalEmail(
  payload: BulkApprovalEmailPayload
): Promise<EmailResult> {
  try {
    const { subject, html } = bulkApprovalTemplate(payload);

    const result = await sendWithProvider({
      to: payload.to,
      toName: payload.employeeName,
      subject,
      html,
    });

    if (result.success) {
      console.log(
        `✓ Bulk approval email sent successfully to ${payload.to} (${payload.approvals.length} submissions)`
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending bulk approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
