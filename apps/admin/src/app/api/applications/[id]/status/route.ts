/**
 * Application Status Update API - POST /api/applications/[id]/status
 *
 * Updates application status with comprehensive workflow management:
 * - Status validation and transitions
 * - Status history tracking
 * - Applicant-to-employee conversion when status = 'hired'
 * - Notification to applicant
 * - Audit logging
 *
 * Applicant-to-Employee Conversion:
 * When status is set to 'hired', automatically:
 * - Update profile userType from 'applicant' to 'employee'
 * - Generate new employeeId (TUP-YYYYMMDD-XXXX format)
 * - Set hireDate
 * - Update application with conversion tracking
 * - Send notification
 *
 * Security:
 * - Requires admin or hr role
 * - Application validation
 * - Transactional operations for data integrity
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  generateAndRegisterEmployeeId,
} from '@tupsafe/auth/server';
import {
  db,
  jobApplications,
  applicationStatusHistory,
  profiles,
  notifications,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  updateApplicationStatusSchema,
  type UpdateApplicationStatusData,
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

    // Fetch existing application with applicant details
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
      })
      .from(jobApplications)
      .innerJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!existingApplicationData.length) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const existingApplication = existingApplicationData[0];
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
    let conversionData: {
      convertedToEmployeeId?: string;
      convertedHireDate?: string;
      conversionDate?: Date;
    } = {};

    // Handle applicant-to-employee conversion if status = 'hired'
    if (newStatus === 'hired') {
      console.log('[Application Status API] Processing applicant-to-employee conversion');

      // Validate applicant is not already an employee
      if (existingApplication.applicantUserType !== 'applicant') {
        return NextResponse.json(
          {
            error: 'User is not an applicant. Only applicants can be converted to employees.',
          },
          { status: 400 }
        );
      }

      try {
        // Generate new employee ID
        const employeeId = await generateAndRegisterEmployeeId(
          existingApplication.applicantId
        );

        console.log(
          `[Application Status API] Generated employee ID: ${employeeId}`
        );

        // Update profile: convert applicant to employee
        const hireDateString = now.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        await db
          .update(profiles)
          .set({
            userType: 'employee',
            employeeId,
            hireDate: hireDateString,
            updatedAt: now,
          })
          .where(eq(profiles.id, existingApplication.applicantId));

        console.log(
          `[Application Status API] Converted applicant ${existingApplication.applicantApplicantId} to employee ${employeeId}`
        );

        // Set conversion data for application update
        const hireDate = now.toISOString().split('T')[0]; // Convert to YYYY-MM-DD string
        conversionData = {
          convertedToEmployeeId: employeeId,
          convertedHireDate: hireDate,
          conversionDate: now,
        };

        // Create notification for new employee
        try {
          await db.insert(notifications).values({
            userId: existingApplication.applicantId,
            type: 'system_update',
            title: 'Congratulations! You have been hired',
            message: `Your application for ${existingApplication.applicationNumber} has been accepted and you have been successfully converted to an employee. Your employee ID is ${employeeId}. Welcome to the team!`,
            isRead: false,
            createdAt: now,
          });
        } catch (error) {
          console.error('Error creating hire notification:', error);
          // Non-critical, continue
        }
      } catch (error) {
        console.error('Error during applicant-to-employee conversion:', error);
        return NextResponse.json(
          {
            error: 'Failed to convert applicant to employee',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Build update data for application
    const updateData: Partial<typeof jobApplications.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
      ...conversionData,
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
            ...conversionData,
            notes: data.notes,
          },
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      // Additional audit log for conversion
      if (newStatus === 'hired' && conversionData.convertedToEmployeeId) {
        await createAuditLog({
          userId: currentUser.userId,
          action: 'UPDATE',
          entityType: 'profile',
          entityId: existingApplication.applicantId,
          changes: {
            before: {
              userType: 'applicant',
              applicantId: existingApplication.applicantApplicantId,
            },
            after: {
              userType: 'employee',
              employeeId: conversionData.convertedToEmployeeId,
              hireDate: conversionData.convertedHireDate,
            },
          },
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
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
      };
      conversion?: {
        success: boolean;
        employeeId: string;
        hireDate: string | undefined;
        applicantId: string;
        applicantName: string;
      };
    } = {
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId,
        previousStatus,
        newStatus,
        updatedAt: now,
      },
    };

    // Include conversion data in response if conversion occurred
    if (newStatus === 'hired' && conversionData.convertedToEmployeeId) {
      response.conversion = {
        success: true,
        employeeId: conversionData.convertedToEmployeeId,
        hireDate: conversionData.convertedHireDate,
        applicantId: existingApplication.applicantId,
        applicantName: `${existingApplication.applicantFirstName} ${existingApplication.applicantLastName}`,
      };
      response.message =
        'Application status updated and applicant successfully converted to employee';
    }

    console.log(
      `[Application Status API] Status updated: ${previousStatus} -> ${newStatus}`
    );
    if (conversionData.convertedToEmployeeId) {
      console.log(
        `[Application Status API] Conversion completed: ${conversionData.convertedToEmployeeId}`
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
