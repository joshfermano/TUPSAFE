/**
 * Email Templates
 * HTML templates for all email types
 */

import { escapeHtml, formatEmailDate, formatShortDate } from '../sanitize';
import type {
  ApplicationStatusEmailPayload,
  PDSStatusEmailPayload,
  SALNStatusEmailPayload,
  BulkApprovalEmailPayload,
  OTPType,
} from '../types';

// Common styles for all email templates
const baseStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
  }
  .container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #0066cc 0%, #004494 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .header .subtitle {
    margin-top: 5px;
    font-size: 14px;
    opacity: 0.9;
  }
  .content {
    padding: 30px;
  }
  .code-box {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px dashed #0066cc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
  }
  .code {
    font-size: 32px;
    font-weight: bold;
    letter-spacing: 8px;
    color: #0066cc;
    font-family: 'Courier New', monospace;
  }
  .info-box {
    background-color: #f8f9fa;
    border-left: 4px solid #0066cc;
    padding: 15px;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  }
  .success-box {
    background-color: #d4edda;
    border-left: 4px solid #28a745;
    padding: 15px;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  }
  .warning-box {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  }
  .error-box {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    padding: 15px;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px 30px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #e9ecef;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #0066cc 0%, #004494 100%);
    color: white;
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: 600;
    margin: 15px 0;
  }
  .credentials-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  .credential-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e9ecef;
  }
  .credential-item:last-child {
    border-bottom: none;
  }
  .credential-label {
    font-weight: 600;
    color: #495057;
  }
  .credential-value {
    font-family: 'Courier New', monospace;
    color: #0066cc;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
`;

/**
 * Wrap content in the base email template
 */
function wrapInTemplate(
  title: string,
  subtitle: string,
  content: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TUPSAFE</h1>
      <div class="subtitle">${escapeHtml(subtitle)}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from TUPSAFE - TUP Manila e-PDS and e-SALN System</p>
      <p>© ${new Date().getFullYear()} Technological University of the Philippines - Manila</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * OTP Email Template
 */
export function otpTemplate(
  code: string,
  type: OTPType
): { subject: string; html: string } {
  const typeLabels: Record<OTPType, string> = {
    email_verification: 'Email Verification',
    login_challenge: 'Login Verification',
    password_reset: 'Password Reset',
  };

  const typeInstructions: Record<OTPType, string> = {
    email_verification:
      'Please use this code to verify your email address and complete your registration.',
    login_challenge:
      'Please use this code to complete your login. If you did not attempt to log in, please secure your account immediately.',
    password_reset:
      'Please use this code to reset your password. If you did not request this, please ignore this email.',
  };

  const subject = `Your TUPSAFE ${typeLabels[type]} Code`;
  const content = `
    <p>Hello,</p>
    <p>${typeInstructions[type]}</p>
    <div class="code-box">
      <div class="code">${escapeHtml(code)}</div>
    </div>
    <div class="info-box">
      <strong>⏱️ This code expires in 10 minutes.</strong>
      <p style="margin: 5px 0 0 0;">For your security, do not share this code with anyone.</p>
    </div>
    <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Verification Code', typeLabels[type], content),
  };
}

/**
 * Welcome Email Template
 */
export function welcomeTemplate(
  firstName: string,
  employeeId: string
): { subject: string; html: string } {
  const subject = 'Welcome to TUPSAFE - Your Account Has Been Approved';
  const content = `
    <p>Dear ${escapeHtml(firstName)},</p>
    <p>🎉 <strong>Congratulations!</strong> Your TUPSAFE account has been approved.</p>
    <div class="success-box">
      <strong>Your Employee ID:</strong> ${escapeHtml(employeeId)}
    </div>
    <p>You can now access the Employee Portal to:</p>
    <ul>
      <li>Submit and manage your Personal Data Sheet (PDS)</li>
      <li>Submit and manage your Statement of Assets, Liabilities, and Net Worth (SALN)</li>
      <li>View your submission history and compliance status</li>
      <li>Receive notifications about deadlines and updates</li>
    </ul>
    <div class="info-box">
      <p><strong>Important:</strong> Please ensure you complete your PDS and SALN submissions before the deadline to maintain compliance with CSC regulations.</p>
    </div>
    <p>If you have any questions, please contact your HR department.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Account Approved', 'Welcome to TUPSAFE', content),
  };
}

/**
 * Rejection Email Template
 */
export function rejectionTemplate(
  firstName: string,
  reason?: string
): { subject: string; html: string } {
  const subject = 'TUPSAFE Registration Update';
  const content = `
    <p>Dear ${escapeHtml(firstName)},</p>
    <p>We regret to inform you that your TUPSAFE account registration has not been approved at this time.</p>
    ${
      reason
        ? `
    <div class="error-box">
      <strong>Reason:</strong> ${escapeHtml(reason)}
    </div>
    `
        : ''
    }
    <p>If you believe this decision was made in error or if you have additional information to provide, please contact your HR department for assistance.</p>
    <p>You may submit a new registration request after addressing any issues mentioned above.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Registration Update', 'Account Status', content),
  };
}

/**
 * Credentials Email Template
 */
export function credentialsTemplate(
  firstName: string,
  employeeId: string,
  temporaryPassword: string
): { subject: string; html: string } {
  const subject = 'Your TUPSAFE Account Credentials';
  const content = `
    <p>Dear ${escapeHtml(firstName)},</p>
    <p>Your TUPSAFE employee account has been created. Below are your login credentials:</p>
    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Employee ID:</span>
        <span class="credential-value">${escapeHtml(employeeId)}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Temporary Password:</span>
        <span class="credential-value">${escapeHtml(temporaryPassword)}</span>
      </div>
    </div>
    <div class="warning-box">
      <strong>⚠️ Important Security Notice:</strong>
      <ul style="margin: 10px 0 0 0;">
        <li>You will be required to change your password upon first login</li>
        <li>Never share your credentials with anyone</li>
        <li>This temporary password expires in 72 hours</li>
      </ul>
    </div>
    <p>Please log in to the Employee Portal to complete your account setup and begin submitting your compliance documents.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Account Created', 'Your Login Credentials', content),
  };
}

/**
 * Application Status Email Template
 */
export function applicationStatusTemplate(
  payload: ApplicationStatusEmailPayload
): { subject: string; html: string } {
  const statusLabels: Record<string, string> = {
    pending: 'Pending Review',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    for_interview: 'Scheduled for Interview',
    interviewed: 'Interview Completed',
    for_final_review: 'Final Review',
    accepted: 'Accepted',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
    hired: 'Hired',
  };

  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    under_review: '🔍',
    shortlisted: '⭐',
    for_interview: '📅',
    interviewed: '✅',
    for_final_review: '📋',
    accepted: '🎉',
    rejected: '📝',
    withdrawn: '↩️',
    hired: '🎊',
  };

  const subject = `Application Update: ${statusLabels[payload.status] || payload.status} - ${payload.positionTitle}`;

  let statusContent = '';

  switch (payload.status) {
    case 'for_interview':
      statusContent = `
        <div class="success-box">
          <strong>${statusEmoji[payload.status]} Great news!</strong>
          <p>You have been scheduled for an interview.</p>
        </div>
        <div class="info-box">
          <strong>Interview Details:</strong>
          <ul>
            <li><strong>Date:</strong> ${formatEmailDate(payload.interviewDate)}</li>
            <li><strong>Location:</strong> ${escapeHtml(payload.interviewLocation || 'To be confirmed')}</li>
            ${payload.interviewNotes ? `<li><strong>Notes:</strong> ${escapeHtml(payload.interviewNotes)}</li>` : ''}
          </ul>
        </div>
        <p>Please arrive 15 minutes before your scheduled time. Bring a valid ID and any required documents.</p>
      `;
      break;

    case 'hired':
      statusContent = `
        <div class="success-box">
          <strong>${statusEmoji[payload.status]} Congratulations!</strong>
          <p>You have been hired for the position of <strong>${escapeHtml(payload.positionTitle)}</strong>!</p>
        </div>
        ${
          payload.hireDate
            ? `
        <div class="info-box">
          <strong>Hire Date:</strong> ${formatShortDate(payload.hireDate)}
        </div>
        `
            : ''
        }
        <div class="warning-box">
          <strong>Next Steps:</strong>
          <p>Please wait while HR creates your official employee portal account. You will receive your login credentials via email shortly.</p>
        </div>
      `;
      break;

    case 'rejected':
      statusContent = `
        <div class="info-box">
          <p>After careful consideration, we have decided to move forward with other candidates for this position.</p>
        </div>
        ${
          payload.rejectionReason
            ? `
        <div class="error-box">
          <strong>Feedback:</strong> ${escapeHtml(payload.rejectionReason)}
        </div>
        `
            : ''
        }
        <p>We appreciate your interest in TUP Manila and encourage you to apply for future openings that match your qualifications.</p>
      `;
      break;

    case 'accepted':
      statusContent = `
        <div class="success-box">
          <strong>${statusEmoji[payload.status]} Congratulations!</strong>
          <p>Your application has been accepted! HR will contact you with the next steps.</p>
        </div>
      `;
      break;

    case 'shortlisted':
      statusContent = `
        <div class="success-box">
          <strong>${statusEmoji[payload.status]} Good news!</strong>
          <p>You have been shortlisted for the next stage of the selection process.</p>
        </div>
        <p>We will contact you soon with further instructions.</p>
      `;
      break;

    default:
      statusContent = `
        <div class="info-box">
          <strong>${statusEmoji[payload.status] || '📋'} Status Update:</strong>
          <p>Your application status has been updated to: <strong>${statusLabels[payload.status] || payload.status}</strong></p>
        </div>
        ${payload.notes ? `<p><strong>Notes:</strong> ${escapeHtml(payload.notes)}</p>` : ''}
      `;
  }

  const content = `
    <p>Dear ${escapeHtml(payload.applicantName)},</p>
    <p>This is an update regarding your job application.</p>
    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Application Number:</span>
        <span class="credential-value">${escapeHtml(payload.applicationNumber)}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Position:</span>
        <span class="credential-value">${escapeHtml(payload.positionTitle)}</span>
      </div>
    </div>
    ${statusContent}
    <p>If you have any questions, please contact our HR department.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Application Update', statusLabels[payload.status] || 'Status Update', content),
  };
}

/**
 * PDS Status Email Template
 */
export function pdsStatusTemplate(
  payload: PDSStatusEmailPayload
): { subject: string; html: string } {
  const statusConfig = {
    approved: {
      label: 'Approved',
      emoji: '✅',
      boxClass: 'success-box',
      message: 'Your Personal Data Sheet submission has been approved.',
    },
    rejected: {
      label: 'Rejected',
      emoji: '❌',
      boxClass: 'error-box',
      message: 'Your Personal Data Sheet submission has been rejected.',
    },
    changes_requested: {
      label: 'Changes Requested',
      emoji: '📝',
      boxClass: 'warning-box',
      message: 'Changes have been requested for your Personal Data Sheet submission.',
    },
  };

  const config = statusConfig[payload.status];
  const subject = `PDS Submission ${config.label} - Version ${payload.version}`;

  const content = `
    <p>Dear ${escapeHtml(payload.employeeName)},</p>
    <div class="${config.boxClass}">
      <strong>${config.emoji} ${config.message}</strong>
    </div>
    <div class="info-box">
      <strong>Submission Details:</strong>
      <ul>
        <li><strong>Document:</strong> Personal Data Sheet (PDS)</li>
        <li><strong>Version:</strong> ${payload.version}</li>
        <li><strong>Status:</strong> ${config.label}</li>
      </ul>
    </div>
    ${
      payload.notes
        ? `
    <div class="info-box">
      <strong>Reviewer Notes:</strong>
      <p>${escapeHtml(payload.notes)}</p>
    </div>
    `
        : ''
    }
    ${
      payload.status === 'changes_requested'
        ? `
    <p>Please log in to the Employee Portal to review the requested changes and resubmit your PDS.</p>
    `
        : ''
    }
    ${
      payload.status === 'rejected'
        ? `
    <p>Please contact your HR department if you have questions about this decision.</p>
    `
        : ''
    }
    ${
      payload.status === 'approved'
        ? `
    <p>Your PDS is now part of your official compliance record. Thank you for your submission.</p>
    `
        : ''
    }
  `;

  return {
    subject,
    html: wrapInTemplate('PDS Update', config.label, content),
  };
}

/**
 * SALN Status Email Template
 */
export function salnStatusTemplate(
  payload: SALNStatusEmailPayload
): { subject: string; html: string } {
  const statusConfig = {
    approved: {
      label: 'Approved',
      emoji: '✅',
      boxClass: 'success-box',
      message: 'Your Statement of Assets, Liabilities, and Net Worth submission has been approved.',
    },
    rejected: {
      label: 'Rejected',
      emoji: '❌',
      boxClass: 'error-box',
      message: 'Your Statement of Assets, Liabilities, and Net Worth submission has been rejected.',
    },
    changes_requested: {
      label: 'Changes Requested',
      emoji: '📝',
      boxClass: 'warning-box',
      message: 'Changes have been requested for your SALN submission.',
    },
  };

  const config = statusConfig[payload.status];
  const subject = `SALN Submission ${config.label} - FY ${payload.year}`;

  const content = `
    <p>Dear ${escapeHtml(payload.employeeName)},</p>
    <div class="${config.boxClass}">
      <strong>${config.emoji} ${config.message}</strong>
    </div>
    <div class="info-box">
      <strong>Submission Details:</strong>
      <ul>
        <li><strong>Document:</strong> Statement of Assets, Liabilities, and Net Worth (SALN)</li>
        <li><strong>Fiscal Year:</strong> ${payload.year}</li>
        <li><strong>Status:</strong> ${config.label}</li>
      </ul>
    </div>
    ${
      payload.notes
        ? `
    <div class="info-box">
      <strong>Reviewer Notes:</strong>
      <p>${escapeHtml(payload.notes)}</p>
    </div>
    `
        : ''
    }
    ${
      payload.status === 'changes_requested'
        ? `
    <p>Please log in to the Employee Portal to review the requested changes and resubmit your SALN.</p>
    `
        : ''
    }
    ${
      payload.status === 'rejected'
        ? `
    <p>Please contact your HR department if you have questions about this decision.</p>
    `
        : ''
    }
    ${
      payload.status === 'approved'
        ? `
    <p>Your SALN is now part of your official compliance record. Thank you for your submission.</p>
    `
        : ''
    }
  `;

  return {
    subject,
    html: wrapInTemplate('SALN Update', config.label, content),
  };
}

/**
 * Bulk Approval Summary Email Template
 */
export function bulkApprovalTemplate(
  payload: BulkApprovalEmailPayload
): { subject: string; html: string } {
  const pdsApprovals = payload.approvals.filter((a) => a.type === 'pds');
  const salnApprovals = payload.approvals.filter((a) => a.type === 'saln');

  const subject = `Submissions Approved - ${payload.approvals.length} Document${payload.approvals.length > 1 ? 's' : ''}`;

  let approvalList = '';

  if (pdsApprovals.length > 0) {
    approvalList += `
      <p><strong>Personal Data Sheet (PDS):</strong></p>
      <ul>
        ${pdsApprovals.map((a) => `<li>Version ${escapeHtml(a.identifier)}</li>`).join('')}
      </ul>
    `;
  }

  if (salnApprovals.length > 0) {
    approvalList += `
      <p><strong>Statement of Assets, Liabilities, and Net Worth (SALN):</strong></p>
      <ul>
        ${salnApprovals.map((a) => `<li>Fiscal Year ${escapeHtml(a.identifier)}</li>`).join('')}
      </ul>
    `;
  }

  const content = `
    <p>Dear ${escapeHtml(payload.employeeName)},</p>
    <div class="success-box">
      <strong>✅ Your compliance submissions have been approved!</strong>
    </div>
    <div class="info-box">
      <strong>Approved Submissions:</strong>
      ${approvalList}
    </div>
    ${
      payload.notes
        ? `
    <div class="info-box">
      <strong>Reviewer Notes:</strong>
      <p>${escapeHtml(payload.notes)}</p>
    </div>
    `
        : ''
    }
    <p>These documents are now part of your official compliance record. Thank you for your submissions.</p>
  `;

  return {
    subject,
    html: wrapInTemplate('Submissions Approved', 'Bulk Approval', content),
  };
}

