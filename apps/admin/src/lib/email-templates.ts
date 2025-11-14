/**
 * Email Notification Templates
 *
 * Professional HTML email templates for registration approval workflow.
 * Templates use inline CSS for maximum email client compatibility.
 *
 * @module admin/lib/email-templates
 */

/**
 * Welcome email template sent to approved registrants
 */
export function getWelcomeEmailTemplate(data: {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  temporaryPassword: string;
  loginUrl: string;
  role: string;
}): { subject: string; html: string; text: string } {
  const subject = 'Welcome to TUPSAFE - Your Registration Has Been Approved';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to TUPSAFE</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to TUPSAFE</h1>
              <p style="margin: 10px 0 0; color: #e6f2ff; font-size: 14px;">Technological University of the Philippines</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.firstName} ${data.lastName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Congratulations! Your registration for TUPSAFE has been approved. You now have access to the TUP Manila e-PDS and e-SALN Compliance System.
              </p>

              <!-- Login Credentials Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 30px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 600;">Your Login Credentials</h2>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">Employee ID:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-family: 'Courier New', monospace;"><strong>${data.employeeId}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">Email:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;"><strong>${data.email}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">Temporary Password:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-family: 'Courier New', monospace;"><strong>${data.temporaryPassword}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">Role:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;"><strong>${capitalizeRole(data.role)}</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Security Notice -->
              <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important Security Notice:</strong><br>
                  Please change your password immediately after your first login. Never share your password with anyone.
                </p>
              </div>

              <!-- Login Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Login to TUPSAFE
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${data.loginUrl}" style="color: #0066cc; text-decoration: underline;">${data.loginUrl}</a>
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">

              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please contact the HR Department at <a href="mailto:hr@tup.edu.ph" style="color: #0066cc;">hr@tup.edu.ph</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} Technological University of the Philippines - Manila<br>
                This is an automated message from TUPSAFE. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Welcome to TUPSAFE - Registration Approved

Dear ${data.firstName} ${data.lastName},

Congratulations! Your registration for TUPSAFE has been approved. You now have access to the TUP Manila e-PDS and e-SALN Compliance System.

YOUR LOGIN CREDENTIALS:
Employee ID: ${data.employeeId}
Email: ${data.email}
Temporary Password: ${data.temporaryPassword}
Role: ${capitalizeRole(data.role)}

IMPORTANT SECURITY NOTICE:
Please change your password immediately after your first login. Never share your password with anyone.

Login to TUPSAFE:
${data.loginUrl}

If you have any questions or need assistance, please contact the HR Department at hr@tup.edu.ph

© ${new Date().getFullYear()} Technological University of the Philippines - Manila
This is an automated message from TUPSAFE. Please do not reply to this email.
  `.trim();

  return { subject, html, text };
}

/**
 * Rejection email template sent to rejected registrants
 */
export function getRejectionEmailTemplate(data: {
  firstName: string;
  lastName: string;
  reason: string;
}): { subject: string; html: string; text: string } {
  const subject = 'TUPSAFE Registration Status Update';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #64748b 0%, #475569 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Registration Status Update</h1>
              <p style="margin: 10px 0 0; color: #e2e8f0; font-size: 14px;">Technological University of the Philippines</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.firstName} ${data.lastName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in the TUPSAFE system. After careful review, we regret to inform you that your registration could not be approved at this time.
              </p>

              <!-- Reason Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; margin: 30px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 12px; color: #991b1b; font-size: 16px; font-weight: 600;">Reason:</h2>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                      ${data.reason}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                If you believe this decision was made in error or if you have additional information to support your registration, please contact the HR Department.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">

              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                For inquiries, please contact the HR Department at <a href="mailto:hr@tup.edu.ph" style="color: #0066cc;">hr@tup.edu.ph</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} Technological University of the Philippines - Manila<br>
                This is an automated message from TUPSAFE. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
TUPSAFE Registration Status Update

Dear ${data.firstName} ${data.lastName},

Thank you for your interest in the TUPSAFE system. After careful review, we regret to inform you that your registration could not be approved at this time.

REASON:
${data.reason}

If you believe this decision was made in error or if you have additional information to support your registration, please contact the HR Department.

For inquiries, please contact the HR Department at hr@tup.edu.ph

© ${new Date().getFullYear()} Technological University of the Philippines - Manila
This is an automated message from TUPSAFE. Please do not reply to this email.
  `.trim();

  return { subject, html, text };
}

/**
 * Helper function to capitalize role names for display
 */
function capitalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    employee: 'Employee',
    hr: 'Human Resources',
    admin: 'Administrator',
    supervisor: 'Supervisor',
    auditor: 'Auditor',
  };

  return roleMap[role] || role;
}
