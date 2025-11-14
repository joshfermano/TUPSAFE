# Employee Portal Library Utilities

This directory contains shared utility functions and helpers for the employee portal.

## Middleware Helpers (`middleware-helpers.ts`)

Server-side utilities for accessing user context injected by the middleware.

### Available Functions

#### `getUserContext(): Promise<UserContext | null>`

Get the current user's context from middleware headers. Returns `null` if user is not authenticated.

```typescript
import { getUserContext } from '@/lib/middleware-helpers';

export default async function DashboardPage() {
  const user = await getUserContext();

  if (!user) {
    redirect('/auth/login');
  }

  console.log(user.userId);      // UUID
  console.log(user.userType);    // 'employee' | 'applicant'
  console.log(user.employeeId);  // string | null
  console.log(user.applicantId); // string | null
}
```

#### `requireUserContext(): Promise<UserContext>`

Get user context or throw an error if not authenticated. Use when you want to fail fast.

```typescript
import { requireUserContext } from '@/lib/middleware-helpers';

export default async function ProfilePage() {
  const user = await requireUserContext(); // Throws if not authenticated
  // user is guaranteed to be defined here
  return <div>Welcome, {user.userType}</div>;
}
```

#### `isEmployee(): Promise<boolean>`

Check if the current user is an employee.

```typescript
import { isEmployee } from '@/lib/middleware-helpers';

export default async function SALNPage() {
  if (!await isEmployee()) {
    redirect('/dashboard');
  }
  // Only employees see this
}
```

#### `isApplicant(): Promise<boolean>`

Check if the current user is an applicant.

```typescript
import { isApplicant } from '@/lib/middleware-helpers';

export default async function ApplicationsPage() {
  if (!await isApplicant()) {
    redirect('/dashboard');
  }
  // Only applicants see this
}
```

#### `requireEmployee(): Promise<UserContext>`

Require user to be an employee, throw error otherwise.

```typescript
import { requireEmployee } from '@/lib/middleware-helpers';

export async function POST(request: Request) {
  const user = await requireEmployee(); // Throws if not employee
  // Only employees can execute this
}
```

#### `requireApplicant(): Promise<UserContext>`

Require user to be an applicant, throw error otherwise.

```typescript
import { requireApplicant } from '@/lib/middleware-helpers';

export async function POST(request: Request) {
  const user = await requireApplicant(); // Throws if not applicant
  // Only applicants can execute this
}
```

### UserContext Type

```typescript
interface UserContext {
  userId: string;                    // Supabase auth user ID
  userType: 'employee' | 'applicant'; // User type
  employeeId: string | null;         // Employee ID (null for applicants)
  applicantId: string | null;        // Applicant ID (null for employees)
  accountStatus: string;             // Account status
}
```

## Other Utilities

### `formatting-helpers.ts`

Date formatting and data display utilities.

### `toast-templates.tsx`

Pre-configured toast notification templates using Sonner.

### `utils.ts`

General utility functions including the `cn()` class name merger.

## Usage Best Practices

### Server Components vs API Routes

**Server Components:**
```typescript
// ✅ Good: Use async/await with getUserContext
export default async function Page() {
  const user = await getUserContext();
}

// ❌ Bad: Don't use in client components
'use client';
export default function ClientPage() {
  const user = await getUserContext(); // Error: can't use async hooks
}
```

**API Routes:**
```typescript
// ✅ Good: Validate user type before processing
export async function POST(request: Request) {
  const user = await requireEmployee();
  // Process employee-only action
}

// ✅ Good: Handle unauthenticated users
export async function GET(request: Request) {
  const user = await getUserContext();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

### Error Handling

```typescript
// ✅ Good: Check for null
const user = await getUserContext();
if (!user) {
  redirect('/auth/login');
}

// ✅ Good: Use try/catch with requireUserContext
try {
  const user = await requireUserContext();
} catch (error) {
  redirect('/auth/login');
}

// ❌ Bad: Assume user exists
const user = await getUserContext();
console.log(user.userId); // May throw if user is null
```

### Performance

All helper functions read from HTTP headers (set by middleware), which is extremely fast:

```typescript
// Fast: No database queries, just header reads
const user = await getUserContext();
const isEmp = await isEmployee();
const isApp = await isApplicant();
```

## Related Files

- `/apps/employee/middleware.ts` - Main middleware implementation
- `/apps/employee/MIDDLEWARE.md` - Comprehensive middleware documentation
- `/apps/employee/src/app/dashboard/middleware-test/page.tsx` - Live testing page
