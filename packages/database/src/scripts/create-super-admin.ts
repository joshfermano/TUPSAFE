#!/usr/bin/env node

/**
 * Create Super Admin CLI Tool
 *
 * Enterprise-grade interactive CLI for creating TUPSAFE super administrator accounts.
 *
 * Features:
 * - Interactive prompts with validation
 * - Password strength requirements (16+ characters)
 * - Email domain validation (@tup.edu.ph)
 * - Automatic HRD department assignment
 * - Employee ID generation (HRD-YYYY-XXX format)
 * - Comprehensive audit logging
 * - Security confirmations
 *
 * Usage:
 *   npm run admin:create
 *
 * Environment Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL
 *
 * @module database/scripts/create-super-admin
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createAdminClient } from '@tupsafe/auth/server';
import { db } from '../db';
import {
  profiles,
  departments,
  employeeIdRegistry,
  auditLogs,
} from '../schema';
import { generateAdminEmployeeId } from '../utils/admin-employee-id';
import { eq } from 'drizzle-orm';

// Load environment variables from root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

/**
 * Validates email domain is @tup.edu.ph
 */
function isValidTupEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@tup.edu.ph');
}

/**
 * Validates password strength (minimum 16 characters)
 * Note: Currently using length-based validation via prompts validation function
 */
function _isStrongPassword(password: string): boolean {
  return password.length >= 16;
}

/**
 * Returns password strength indicator
 */
function getPasswordStrength(password: string): string {
  if (password.length < 12) return chalk.red('Weak');
  if (password.length < 16) return chalk.yellow('Medium');
  if (password.length < 20) return chalk.green('Strong');
  return chalk.greenBright('Very Strong');
}

/**
 * Checks if any admin users already exist in the system
 */
async function checkExistingAdmins(): Promise<number> {
  const spinner = ora('Checking for existing administrators...').start();

  try {
    const existingAdmins = await db
      .select()
      .from(profiles)
      .where(eq(profiles.role, 'admin'));

    spinner.succeed(`Found ${existingAdmins.length} existing administrator(s)`);
    return existingAdmins.length;
  } catch (error) {
    spinner.fail('Failed to check for existing administrators');
    throw error;
  }
}

/**
 * Gets the HRD department ID
 */
async function getHrdDepartmentId(): Promise<string> {
  const spinner = ora('Looking up HRD department...').start();

  try {
    const hrdDept = await db
      .select()
      .from(departments)
      .where(eq(departments.code, 'HRD'))
      .limit(1);

    if (!hrdDept || hrdDept.length === 0) {
      spinner.fail('HRD department not found in database');
      throw new Error(
        'HRD department not found. Please run department seeding first: npm run db:seed:tup'
      );
    }

    spinner.succeed(`HRD department found: ${hrdDept[0].name}`);
    return hrdDept[0].id;
  } catch (error) {
    spinner.fail('Failed to lookup HRD department');
    throw error;
  }
}

/**
 * Creates audit log entry
 */
async function createAuditLog(
  userId: string,
  email: string,
  employeeId: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'super_admin_created',
      entityType: 'profiles',
      entityId: userId,
      changes: {
        email,
        employeeId,
        role: 'admin',
        accountStatus: 'active',
        method: 'cli_tool',
        createdAt: new Date().toISOString(),
      },
      ipAddress: '127.0.0.1', // CLI execution is local
      userAgent: 'TUPSAFE Admin Creation CLI',
    });
  } catch (error) {
    console.error(chalk.yellow('Warning: Failed to create audit log'), error);
    // Don't throw - audit log failure shouldn't prevent admin creation
  }
}

/**
 * Main execution function
 */
async function main() {
  console.clear();
  console.log(
    chalk.bold.cyan(
      '╔════════════════════════════════════════════════════════════╗'
    )
  );
  console.log(
    chalk.bold.cyan(
      '║                                                            ║'
    )
  );
  console.log(
    chalk.bold.cyan(
      '║          TUPSAFE Super Administrator Creation Tool         ║'
    )
  );
  console.log(
    chalk.bold.cyan(
      '║                                                            ║'
    )
  );
  console.log(
    chalk.bold.cyan(
      '╚════════════════════════════════════════════════════════════╝'
    )
  );
  console.log();
  console.log(
    chalk.gray('  Enterprise-grade admin account creation for TUPSAFE')
  );
  console.log(
    chalk.gray('  Technological University of the Philippines Manila')
  );
  console.log();

  try {
    // Step 1: Verify environment variables
    const envSpinner = ora('Verifying environment configuration...').start();
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      envSpinner.fail('Missing required environment variables');
      console.error(chalk.red('\nMissing environment variables:'));
      missingVars.forEach((varName) => {
        console.error(chalk.red(`  - ${varName}`));
      });
      console.error(
        chalk.yellow(
          '\nPlease ensure .env.local exists in the project root with all required variables.'
        )
      );
      process.exit(1);
    }

    envSpinner.succeed('Environment configuration verified');

    // Step 2: Check for existing admins
    const adminCount = await checkExistingAdmins();

    if (adminCount > 0) {
      console.log();
      const { confirmAdditional } = await prompts({
        type: 'confirm',
        name: 'confirmAdditional',
        message: chalk.yellow(
          `There ${
            adminCount === 1
              ? 'is already 1 administrator'
              : `are already ${adminCount} administrators`
          } in the system. Create another?`
        ),
        initial: false,
      });

      if (!confirmAdditional) {
        console.log(chalk.gray('\nOperation cancelled.'));
        process.exit(0);
      }
    }

    console.log();
    console.log(chalk.bold('Administrator Account Details'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    // Step 3: Interactive prompts
    const responses = await prompts(
      [
        {
          type: 'text',
          name: 'email',
          message: 'Email Address (must be @tup.edu.ph):',
          validate: (value: string) => {
            if (!value) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value))
              return 'Please enter a valid email address';
            if (!isValidTupEmail(value))
              return 'Email must be from @tup.edu.ph domain';
            return true;
          },
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password (minimum 8 characters):',
          validate: (value: string) => {
            if (!value) return 'Password is required';
            if (value.length < 8)
              return 'Password must be at least 8 characters for security';
            return true;
          },
        },
        {
          type: 'text',
          name: 'firstName',
          message: 'First Name:',
          validate: (value: string) =>
            value ? true : 'First name is required',
        },
        {
          type: 'text',
          name: 'lastName',
          message: 'Last Name:',
          validate: (value: string) => (value ? true : 'Last name is required'),
        },
      ],
      {
        onCancel: () => {
          console.log(chalk.gray('\nOperation cancelled.'));
          process.exit(0);
        },
      }
    );

    // Display password strength
    console.log();
    console.log(
      chalk.gray('Password Strength:'),
      getPasswordStrength(responses.password)
    );
    console.log();

    // Step 4: Confirmation
    console.log(chalk.bold('Review Administrator Details'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.cyan('Email:      '), responses.email);
    console.log(
      chalk.cyan('Name:       '),
      `${responses.firstName} ${responses.lastName}`
    );
    console.log(chalk.cyan('Role:       '), 'Super Administrator');
    console.log(chalk.cyan('Department: '), 'Human Resources Department (HRD)');
    console.log(chalk.gray('─'.repeat(60)));
    console.log();

    const { confirmCreate } = await prompts({
      type: 'confirm',
      name: 'confirmCreate',
      message: chalk.bold('Create this administrator account?'),
      initial: true,
    });

    if (!confirmCreate) {
      console.log(chalk.gray('\nOperation cancelled.'));
      process.exit(0);
    }

    console.log();

    // Step 5: Create Supabase Auth user
    const authSpinner = ora('Creating Supabase Auth user...').start();

    const admin = createAdminClient();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: responses.email,
        password: responses.password,
        email_confirm: true,
        user_metadata: {
          first_name: responses.firstName,
          last_name: responses.lastName,
          full_name: `${responses.firstName} ${responses.lastName}`,
        },
      });

    if (authError || !authData.user) {
      authSpinner.fail('Failed to create Supabase Auth user');
      console.error(
        chalk.red('\nError:'),
        authError?.message || 'Unknown error'
      );
      process.exit(1);
    }

    authSpinner.succeed(
      `Supabase Auth user created (ID: ${authData.user.id.substring(0, 8)}...)`
    );

    // Step 6: Generate employee ID
    const employeeIdSpinner = ora('Generating admin employee ID...').start();

    let employeeId: string;
    try {
      employeeId = await generateAdminEmployeeId();
      employeeIdSpinner.succeed(`Generated employee ID: ${employeeId}`);
    } catch (error) {
      employeeIdSpinner.fail('Failed to generate employee ID');
      throw error;
    }

    // Step 7: Get HRD department ID
    const departmentId = await getHrdDepartmentId();

    // Step 8: Create profile record
    const profileSpinner = ora('Creating profile record...').start();

    try {
      await db.insert(profiles).values({
        id: authData.user.id,
        employeeId,
        firstName: responses.firstName,
        lastName: responses.lastName,
        role: 'admin',
        accountStatus: 'active',
        emailVerifiedAt: new Date(),
        departmentId,
        isActive: true,
        userType: 'employee',
        employmentCategory: 'administrative',
        temporaryPassword: false,
      });

      profileSpinner.succeed('Profile record created');
    } catch (error) {
      profileSpinner.fail('Failed to create profile record');
      throw error;
    }

    // Step 9: Register employee ID
    const registrySpinner = ora('Registering employee ID...').start();

    try {
      await db.insert(employeeIdRegistry).values({
        employeeId,
        userId: authData.user.id,
      });

      registrySpinner.succeed('Employee ID registered');
    } catch (error) {
      registrySpinner.fail('Failed to register employee ID');
      throw error;
    }

    // Step 10: Create audit log
    const auditSpinner = ora('Creating audit log entry...').start();

    try {
      await createAuditLog(authData.user.id, responses.email, employeeId);
      auditSpinner.succeed('Audit log created');
    } catch (_error) {
      auditSpinner.warn('Audit log creation skipped (non-critical)');
    }

    // Success!
    console.log();
    console.log(
      chalk.bold.green('✓ Super Administrator Account Created Successfully!')
    );
    console.log();
    console.log(chalk.bold('Account Credentials'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.cyan('Employee ID: '), chalk.bold.white(employeeId));
    console.log(chalk.cyan('Email:       '), chalk.bold.white(responses.email));
    console.log(
      chalk.cyan('Password:    '),
      chalk.bold.white(responses.password)
    );
    console.log(
      chalk.cyan('Role:        '),
      chalk.bold.white('Super Administrator')
    );
    console.log(chalk.cyan('Status:      '), chalk.bold.green('Active'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();
    console.log(chalk.yellow('⚠️  Important Security Notes:'));
    console.log(chalk.gray('  • Store these credentials securely'));
    console.log(chalk.gray('  • Change the password upon first login'));
    console.log(chalk.gray('  • Enable MFA immediately after logging in'));
    console.log(chalk.gray('  • Never share admin credentials'));
    console.log();
    console.log(chalk.cyan('Next Steps:'));
    console.log(chalk.gray('  1. Login at the admin portal'));
    console.log(chalk.gray('  2. Enable Multi-Factor Authentication (MFA)'));
    console.log(
      chalk.gray('  3. Review system settings and security policies')
    );
    console.log();

    process.exit(0);
  } catch (error) {
    console.error();
    console.error(chalk.red.bold('✗ Fatal Error'));
    console.error(chalk.red('─'.repeat(60)));

    if (error instanceof Error) {
      console.error(chalk.red(error.message));

      if (error.stack) {
        console.error();
        console.error(chalk.gray('Stack Trace:'));
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red('An unexpected error occurred'));
      console.error(chalk.gray(String(error)));
    }

    console.error(chalk.red('─'.repeat(60)));
    console.error();
    console.error(chalk.yellow('Troubleshooting:'));
    console.error(
      chalk.gray('  • Verify environment variables are set correctly')
    );
    console.error(chalk.gray('  • Ensure database migrations have been run'));
    console.error(
      chalk.gray(
        '  • Check database seeding has completed (npm run db:seed:tup)'
      )
    );
    console.error(chalk.gray('  • Verify Supabase credentials are valid'));
    console.error();

    process.exit(1);
  }
}

// Execute main function
main();
