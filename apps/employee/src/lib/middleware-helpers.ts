import { headers } from 'next/headers';

/**
 * User context from middleware headers
 */
export interface UserContext {
  userId: string;
  userType: 'employee' | 'applicant';
  employeeId: string | null;
  applicantId: string | null;
  accountStatus: string;
}

/**
 * Get user context from middleware headers (server components and API routes)
 *
 * This function reads the headers set by the middleware to provide
 * type-safe access to the current user's context.
 *
 * @returns UserContext or null if headers are not present
 *
 * @example
 * ```typescript
 * // In a server component
 * export default async function DashboardPage() {
 *   const user = await getUserContext();
 *
 *   if (!user) {
 *     redirect('/auth/login');
 *   }
 *
 *   if (user.userType === 'applicant') {
 *     // Show applicant-specific content
 *   } else {
 *     // Show employee-specific content
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In an API route
 * export async function GET(request: Request) {
 *   const user = await getUserContext();
 *
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   // Use user.userId, user.userType, etc.
 * }
 * ```
 */
export async function getUserContext(): Promise<UserContext | null> {
  const headersList = await headers();

  const userId = headersList.get('x-user-id');
  const userType = headersList.get('x-user-type');
  const employeeId = headersList.get('x-employee-id');
  const applicantId = headersList.get('x-applicant-id');
  const accountStatus = headersList.get('x-account-status');

  // If critical headers are missing, return null
  if (!userId || !userType) {
    return null;
  }

  return {
    userId,
    userType: userType as 'employee' | 'applicant',
    employeeId: employeeId || null,
    applicantId: applicantId || null,
    accountStatus: accountStatus || 'unknown',
  };
}

/**
 * Get user context and throw error if not authenticated
 *
 * Use this when you want to fail fast if the user is not authenticated,
 * rather than handling the null case.
 *
 * @throws Error if user context is not available
 *
 * @example
 * ```typescript
 * export default async function ProfilePage() {
 *   const user = await requireUserContext();
 *   // user is guaranteed to be defined here
 *   return <div>Welcome, {user.userType}</div>;
 * }
 * ```
 */
export async function requireUserContext(): Promise<UserContext> {
  const user = await getUserContext();

  if (!user) {
    throw new Error('User context not available. This should not happen if middleware is properly configured.');
  }

  return user;
}

/**
 * Check if the current user is an employee
 *
 * @example
 * ```typescript
 * export default async function SALNPage() {
 *   if (!await isEmployee()) {
 *     redirect('/dashboard');
 *   }
 *   // Only employees can see this
 * }
 * ```
 */
export async function isEmployee(): Promise<boolean> {
  const user = await getUserContext();
  return user?.userType === 'employee';
}

/**
 * Check if the current user is an applicant
 *
 * @example
 * ```typescript
 * export default async function ApplicationsPage() {
 *   if (!await isApplicant()) {
 *     redirect('/dashboard');
 *   }
 *   // Only applicants can see this
 * }
 * ```
 */
export async function isApplicant(): Promise<boolean> {
  const user = await getUserContext();
  return user?.userType === 'applicant';
}

/**
 * Require user to be an employee, throw error otherwise
 *
 * @throws Error if user is not an employee
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   await requireEmployee();
 *   // Only employees can execute this
 * }
 * ```
 */
export async function requireEmployee(): Promise<UserContext> {
  const user = await requireUserContext();

  if (user.userType !== 'employee') {
    throw new Error('This action requires employee access');
  }

  return user;
}

/**
 * Require user to be an applicant, throw error otherwise
 *
 * @throws Error if user is not an applicant
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   await requireApplicant();
 *   // Only applicants can execute this
 * }
 * ```
 */
export async function requireApplicant(): Promise<UserContext> {
  const user = await requireUserContext();

  if (user.userType !== 'applicant') {
    throw new Error('This action requires applicant access');
  }

  return user;
}
