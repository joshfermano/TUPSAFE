/**
 * Create User API Route (Admin)
 * Allows HR/Admin to manually create employee accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  notifications,
  createAuditLog,
  employeeIdRegistry,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  checkUserRoleFromSupabase,
  getSessionUser,
  generateAndRegisterEmployeeId,
  generatePassword,
  sendEmail,
  createServerClient,
} from '@tupsafe/auth/server';

// User creation validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  academicRank: z.string().optional(),
  tenureStatus: z.string().optional(),
  employmentType: z.string().optional(),
  campusAssignment: z.string().optional(),
  sendCredentials: z.boolean().default(true),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export async function POST(request: NextRequest) {
  try {
    // Check if user has HR or admin role
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. HR or Admin role required.' },
        { status: 403 }
      );
    }

    // Get current admin user
    const adminUser = await getSessionUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: CreateUserData = validationResult.data;

    // Initialize Supabase client
    const supabase = await createServerClient('admin');

    // Check if email already exists
    const { data: existingUser, error: checkError } =
      await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      );
    }

    const emailExists = existingUser.users.some(
      (user: { email?: string }) => user.email === data.email
    );

    if (emailExists) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generatePassword();

    // Generate unique employee ID
    let employeeId: string;
    try {
      employeeId = await generateAndRegisterEmployeeId('temp-id');
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return NextResponse.json(
        { error: 'Failed to generate employee ID. Please try again.' },
        { status: 500 }
      );
    }

    // Create Supabase user
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: temporaryPassword,
        email_confirm: true, // Admin-created accounts are pre-verified
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName,
        },
      });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Update employee ID registry with actual user ID
    try {
      await db
        .update(employeeIdRegistry)
        .set({ userId })
        .where(eq(employeeIdRegistry.employeeId, employeeId));
    } catch (error) {
      console.error('Error updating employee ID registry:', error);
      // Clean up: delete created user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to complete user creation. Please try again.' },
        { status: 500 }
      );
    }

    const now = new Date();

    // Create user profile (immediately active since created by admin)
    try {
      await db.insert(profiles).values({
        id: userId,
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        phoneNumber: data.phoneNumber || null,
        role: data.role,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        academicRank: data.academicRank || null,
        tenureStatus: data.tenureStatus || null,
        employmentType: data.employmentType || null,
        campusAssignment: data.campusAssignment || null,
        accountStatus: 'active', // Immediately active
        emailVerifiedAt: now, // Pre-verified
        approvedBy: adminUser.userId,
        approvedAt: now,
        temporaryPassword: true, // User must change password on first login
        isActive: true,
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      // Clean up: delete created user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // Send credentials email if requested
    if (data.sendCredentials) {
      try {
        await sendEmail(
          data.email,
          'Your TUPSAFE Account Credentials',
          `
            <h2>Welcome to TUPSAFE!</h2>
            <p>Dear ${data.firstName} ${data.lastName},</p>
            <p>An account has been created for you on TUPSAFE.</p>
            <p><strong>Your Login Credentials:</strong></p>
            <ul>
              <li><strong>Employee ID:</strong> ${employeeId}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
            </ul>
            <p><strong>Important:</strong> You will be required to change your password upon first login.</p>
            <p>Please keep your credentials secure and do not share them with anyone.</p>
            <br>
            <p>Best regards,</p>
            <p>TUPSAFE Team</p>
          `
        );
      } catch (error) {
        console.error('Error sending credentials email:', error);
        // Non-critical, continue
      }
    }

    // Create welcome notification for user
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Welcome to TUPSAFE',
        message: `Your account has been created. Please check your email for login credentials.`,
        isRead: false,
        createdAt: now,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Non-critical, continue
    }

    // Log audit event
    try {
      await createAuditLog({
        userId: adminUser.userId,
        action: 'CREATE',
        entityType: 'profile',
        entityId: userId,
        changes: {
          after: {
            createdUserId: userId,
            employeeId,
            email: data.email,
            role: data.role,
            createdBy: adminUser.userId,
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

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          userId,
          employeeId,
          email: data.email,
          temporaryPassword: data.sendCredentials ? temporaryPassword : undefined,
          role: data.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while creating user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
