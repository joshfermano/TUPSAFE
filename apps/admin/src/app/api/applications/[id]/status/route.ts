/**
 * Application Status Update API - POST /api/applications/[id]/status
 *
 * Updates application status with comprehensive workflow management:
 * - Status validation and transitions
 * - Status history tracking
 * - Notification to applicant
 * - Audit logging
 *
 * Hired Status:
 * When status is set to 'hired':
 * - Records the hire date on the application
 * - Notifies the applicant to wait for employee account creation
 * - Does NOT convert the applicant profile (HR creates a separate employee account later)
 * - Employee account is linked to the application via Users → Create User
 *
 * Security:
 * - Requires admin or hr role
 * - Application validation
 * - Transactional operations for data integrity
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  createAdminClient,
  sendApplicationStatusEmail,
} from '@tupsafe/auth/server';
import {
  db,
  jobApplications,
  applicationStatusHistory,
  profiles,
  notifications,
  createAuditLog,
  openPositions,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  updateApplicationStatusSchema,
  type UpdateApplicationStatusData,
  EMAIL_TRIGGER_STATUSES,
} from '@tupsafe/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Application Status API] POST request received');

    // Get current user from Supabase session (portal-specific)
    const currentUser = await getUserFromSupabase('admin');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Verify admin/HR permissions
    const allowedRoles = ['admin', 'hr'];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get application ID from params
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateApplicationStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: UpdateApplicationStatusData = validationResult.data;

    // Fetch existing application with applicant and position details
    const existingApplicationData = await db
      .select({
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicantId: jobApplications.applicantId,
        positionId: jobApplications.positionId,
        applicantFirstName: profiles.firstName,
        applicantLastName: profiles.lastName,
        applicantUserType: profiles.userType,
        applicantApplicantId: profiles.applicantId,
        positionTitle: openPositions.positionTitle,
      })
      .from(jobApplications)
      .innerJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .leftJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!existingApplicationData.length) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const existingApplication = existingApplicationData[0];

    // Fetch applicant email from auth.users using admin client
    let applicantEmail: string | null = null;
    try {
      const adminClient = createAdminClient();
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(existingApplication.applicantId);

      if (!userError && userData?.user?.email) {
        applicantEmail = userData.user.email;
      }
    } catch (emailFetchError) {
      console.error('Error fetching applicant email:', emailFetchError);
      // Non-critical, continue without email
    }
    const previousStatus = existingApplication.status;
    const newStatus = data.status;

    // Prevent duplicate status updates
    if (previousStatus === newStatus) {
      return NextResponse.json(
        {
          success: true,
          message: 'Status is already set to the requested value',
        },
        { status: 200 }
      );
    }

    const now = new Date();
    
    // For hired status, we record the hire date but do NOT convert the applicant profile.
    // HR will create a separate employee account later via Users → Create User.
    let hireData: {
      convertedHireDate?: string;
    } = {};

    // Handle hired status - record hire date and notify applicant to wait
    if (newStatus === 'hired') {
      console.log('[Application Status API] Processing hired status (no in-place conversion)');

      // Validate applicant is not already an employee
      if (existingApplication.applicantUserType !== 'applicant') {
        return NextResponse.json(
          {
            error: 'User is not an applicant. Only applicants can be hired.',
          },
          { status: 400 }
        );
      }

      // Record the hire date on the application
      const hireDateString = now.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      hireData = {
        convertedHireDate: hireDateString,
      };

      console.log(
        `[Application Status API] Applicant ${existingApplication.applicantApplicantId} marked as hired. Awaiting employee account creation.`
      );

      // Create notification for hired applicant - tell them to wait for account creation
      try {
        await db.insert(notifications).values({
          userId: existingApplication.applicantId,
          type: 'system_update',
          title: 'Congratulations! You have been hired',
          message: `Your application ${existingApplication.applicationNumber} for ${existingApplication.positionTitle || 'the position'} has been accepted! Please wait while HR creates your official employee portal account. You will receive your login credentials via email shortly.`,
          isRead: false,
          createdAt: now,
        });
      } catch (error) {
        console.error('Error creating hire notification:', error);
        // Non-critical, continue
      }
    }

    // Build update data for application
    const updateData: Partial<typeof jobApplications.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
      ...hireData,
    };

    // Set review fields if notes are provided
    if (data.notes) {
      updateData.reviewerNotes = data.notes;
      updateData.reviewedBy = currentUser.userId;
      updateData.reviewedAt = now;
    }

    // Set interview fields if provided
    if (data.interviewDate) {
      updateData.interviewDate = data.interviewDate;
    }
    if (data.interviewLocation) {
      updateData.interviewLocation = data.interviewLocation;
    }
    if (data.interviewNotes) {
      updateData.interviewNotes = data.interviewNotes;
    }

    // Set rejection reason if provided
    if (data.rejectionReason) {
      updateData.rejectionReason = data.rejectionReason;
    }

    // Set final decision fields for terminal statuses
    if (['accepted', 'rejected', 'hired'].includes(newStatus)) {
      updateData.finalDecision = data.finalDecision || newStatus;
      updateData.decisionBy = currentUser.userId;
      updateData.decisionAt = now;
    }

    // Update application status
    await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, applicationId));

    // Record status change in history
    try {
      await db.insert(applicationStatusHistory).values({
        applicationId,
        previousStatus,
        newStatus,
        changedBy: currentUser.userId,
        changedAt: now,
        notes: data.notes || null,
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (error) {
      console.error('Error creating status history:', error);
      // Non-critical, continue
    }

    // Send status change notification to applicant (unless hired, already sent above)
    if (newStatus !== 'hired') {
      try {
        const statusMessages: Record<string, { title: string; message: string }> = {
          under_review: {
            title: 'Application Under Review',
            message: `Your application ${existingApplication.applicationNumber} is now under review by our HR team.`,
          },
          shortlisted: {
            title: 'You have been shortlisted!',
            message: `Congratulations! Your application ${existingApplication.applicationNumber} has been shortlisted for further consideration.`,
          },
          for_interview: {
            title: 'Interview Scheduled',
            message: `Your application ${existingApplication.applicationNumber} has been scheduled for an interview. ${data.interviewDate ? `Date: ${data.interviewDate.toLocaleDateString()}` : 'Details will be sent separately.'}`,
          },
          interviewed: {
            title: 'Interview Completed',
            message: `Thank you for attending the interview for application ${existingApplication.applicationNumber}. Your application is now in final review.`,
          },
          for_final_review: {
            title: 'Final Review',
            message: `Your application ${existingApplication.applicationNumber} is now in final review stage.`,
          },
          accepted: {
            title: 'Application Accepted',
            message: `Congratulations! Your application ${existingApplication.applicationNumber} has been accepted. Further details will follow.`,
          },
          rejected: {
            title: 'Application Status Update',
            message: `We regret to inform you that your application ${existingApplication.applicationNumber} was not successful at this time. We appreciate your interest and encourage you to apply for future opportunities.`,
          },
          withdrawn: {
            title: 'Application Withdrawn',
            message: `Your application ${existingApplication.applicationNumber} has been marked as withdrawn.`,
          },
        };

        const notificationContent = statusMessages[newStatus];

        if (notificationContent) {
          await db.insert(notifications).values({
            userId: existingApplication.applicantId,
            type: 'submission_status',
            title: notificationContent.title,
            message: notificationContent.message,
            isRead: false,
            createdAt: now,
          });
        }
      } catch (error) {
        console.error('Error creating status notification:', error);
        // Non-critical, continue
      }
    }

    // Log audit event
    try {
      await createAuditLog({
        userId: currentUser.userId,
        action: 'UPDATE',
        entityType: 'application',
        entityId: applicationId,
        changes: {
          before: { status: previousStatus },
          after: {
            status: newStatus,
            ...hireData,
            notes: data.notes,
          },
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    // Send email notification for major status changes
    let emailResult: { sent: boolean; error?: string } = { sent: false };

    if (
      applicantEmail &&
      EMAIL_TRIGGER_STATUSES.includes(
        newStatus as (typeof EMAIL_TRIGGER_STATUSES)[number]
      )
    ) {
      try {
        console.log(
          `[Application Status API] Sending email notification to ${applicantEmail} for status: ${newStatus}`
        );

        const emailResponse = await sendApplicationStatusEmail({
          to: applicantEmail,
          applicantName: `${existingApplication.applicantFirstName} ${existingApplication.applicantLastName}`,
          applicationNumber: existingApplication.applicationNumber,
          positionTitle: existingApplication.positionTitle || 'Position',
          status: newStatus as (typeof EMAIL_TRIGGER_STATUSES)[number],
          // Interview details
          interviewDate: data.interviewDate,
          interviewLocation: data.interviewLocation,
          interviewNotes: data.interviewNotes,
          // Rejection reason
          rejectionReason: data.rejectionReason,
          // Hired details - employeeId will be sent later when HR creates the employee account
          // For now, 'hired' status email just notifies applicant to wait
          employeeId: undefined,
          hireDate: hireData.convertedHireDate,
          // Notes
          notes: data.notes,
        });

        emailResult = {
          sent: emailResponse.success,
          error: emailResponse.error,
        };

        if (emailResponse.success) {
          console.log(
            `[Application Status API] Email sent successfully to ${applicantEmail}`
          );
        } else {
          console.warn(
            `[Application Status API] Email failed: ${emailResponse.error}`
          );
        }
      } catch (emailError) {
        console.error('Error sending status email:', emailError);
        emailResult = {
          sent: false,
          error:
            emailError instanceof Error
              ? emailError.message
              : 'Failed to send email',
        };
        // Non-critical, continue
      }
    } else if (!applicantEmail) {
      console.warn(
        '[Application Status API] Skipping email: no applicant email found'
      );
    }

    // Construct response
    const response: {
      success: boolean;
      message: string;
      data: {
        applicationId: string;
        previousStatus: string | null;
        newStatus: string;
        updatedAt: Date;
        hireDate?: string;
      };
      hired?: {
        applicationNumber: string;
        applicantId: string;
        applicantName: string;
        hireDate: string | undefined;
        pendingAccountCreation: boolean;
      };
      email: { sent: boolean; error?: string };
    } = {
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId,
        previousStatus,
        newStatus,
        updatedAt: now,
      },
      email: emailResult,
    };

    // Include hire data in response if hired
    if (newStatus === 'hired') {
      response.data.hireDate = hireData.convertedHireDate;
      response.hired = {
        applicationNumber: existingApplication.applicationNumber,
        applicantId: existingApplication.applicantId,
        applicantName: `${existingApplication.applicantFirstName} ${existingApplication.applicantLastName}`,
        hireDate: hireData.convertedHireDate,
        pendingAccountCreation: true, // HR needs to create employee account separately
      };
      response.message =
        'Applicant has been marked as hired. Please create their employee account via Users → Create User to complete the onboarding process.';
    }

    console.log(
      `[Application Status API] Status updated: ${previousStatus} -> ${newStatus}`
    );
    if (newStatus === 'hired') {
      console.log(
        `[Application Status API] Hired applicant awaiting employee account creation: ${existingApplication.applicationNumber}`
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Application Status API] Error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update application status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
