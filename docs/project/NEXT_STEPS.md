# TUPSAFE Backend - Next Steps Implementation Guide

## 🎉 What's Been Completed

You now have a solid foundation for TUPSAFE with:

✅ **Database Foundation**

- Enhanced schema with all TUP Manila-specific fields
- Comprehensive indexes for optimal performance
- Migration scripts and seed data ready

✅ **Security**

- Row Level Security (RLS) policies for all tables
- Helper functions for role-based access
- Audit logging system with IP tracking

✅ **Infrastructure**

- Supabase Storage utilities (upload/download/signed URLs)
- Storage bucket setup scripts
- Database connection testing

✅ **Performance**

- Database indexes on all frequently queried columns
- React Query configured with 5-minute stale time
- Optimistic update patterns ready

## 🚀 Quick Start (Next 30 Minutes)

### 1. Set Up Environment (5 mins)

```bash
# Copy env example to .env.local
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get from: https://supabase.com/dashboard/project/_/settings/api
```

### 2. Run Database Migrations (5 mins)

```bash
cd packages/database

# Generate and push schema to Supabase
npm run db:push

# Verify schema
npm run db:studio
# Opens at http://localhost:4983
```

### 3. Apply RLS Policies (5 mins)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `packages/database/sql/rls-policies.sql`
3. Execute the SQL
4. Verify: All tables should show "RLS enabled" in Supabase table view

### 4. Create Storage Buckets (5 mins)

```bash
cd packages/database
npm run storage:setup
```

Then in Supabase Dashboard → Storage → each bucket → Policies:

- Add policies from the script output

### 5. Seed Development Data (Optional, 5 mins)

```bash
cd packages/database
npm run db:seed
```

This populates your database with mock data for testing.

### 6. Test Connection (5 mins)

```bash
cd packages/database
npm run db:test
```

Should output: ✅ All tests passed

## 📝 Implementation Priorities

### Priority 1: Authentication (Required to run apps)

**Status**: Template files created, needs integration

**Files to implement**:

1. `packages/auth/src/auth-actions.ts` - Server actions for Email OTP
2. `apps/employee/src/app/auth/login/page.tsx` - Update with Email OTP flow
3. `apps/admin/src/app/auth/login/page.tsx` - Update with Email OTP flow

**Estimated time**: 2-3 hours

**See**: `docs/guides/AUTH_IMPLEMENTATION.md` (to be created)

### Priority 2: PDS Server Actions (Core feature)

**Status**: Schema ready, actions needed

**Files to create**:

1. `apps/employee/src/app/actions/pds.ts` - CRUD operations
2. `apps/employee/src/hooks/usePdsAutoSave.ts` - Auto-save hook

**Estimated time**: 4-6 hours

**See**: `docs/guides/PDS_ACTIONS.md` (to be created)

### Priority 3: SALN Server Actions (Core feature)

**Status**: Schema ready, actions needed

**Files to create**:

1. `apps/employee/src/app/actions/saln.ts` - CRUD operations
2. `apps/employee/src/hooks/useSalnAutoSave.ts` - Auto-save hook

**Estimated time**: 4-6 hours

**See**: `docs/guides/SALN_ACTIONS.md` (to be created)

### Priority 4: PDF Generation (Important feature)

**Status**: Templates needed

**Steps**:

1. Install: `npm install @react-pdf/renderer`
2. Create PDS PDF template
3. Create SALN PDF template
4. Add generation server actions

**Estimated time**: 6-8 hours

**See**: `docs/guides/PDF_GENERATION.md` (to be created)

## 📖 Detailed Implementation Guides

### Guide 1: Authentication with Email OTP

**Goal**: Implement secure authentication using Supabase Auth with Email OTP (already configured with Resend SMTP).

**Steps**:

1. **Create Auth Server Actions** (`packages/auth/src/auth-actions.ts`):

```typescript
'use server';

import { createClient } from './utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function signInWithOTP(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Only allow existing users
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOTP(email: string, token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
```

2. **Update Login Page** to use Email OTP flow
3. **Add Profile Creation Trigger** in Supabase Dashboard → Database → Functions

**Full guide**: See implementation example in `packages/auth/src/` directory

### Guide 2: PDS Server Actions

**Key actions to implement**:

```typescript
// apps/employee/src/app/actions/pds.ts

export async function createPdsDraft(userId: string) {
  // Create new PDS submission with status 'draft'
  // Auto-generate version number
  // Set isLatest for user's previous submissions to false
  // Return submission ID
}

export async function updatePdsSection(
  submissionId: string,
  section: 'personalInfo' | 'family' | 'education' | ...,
  data: Record<string, any>
) {
  // Validate user owns submission and it's in 'draft' status
  // Update specific section
  // Log audit trail
  // Return success
}

export async function submitPds(submissionId: string) {
  // Validate all required sections are complete
  // Change status to 'submitted'
  // Set submittedAt timestamp
  // Create notification for HR/Admin
  // Log audit trail
  // Return success
}
```

**Pattern**: Always check RLS, log audits, create notifications

### Guide 3: Real-time Integration

The real-time hooks in `packages/database/src/hooks/` are ready to use.

**Usage in components**:

```typescript
import {
  useRealtimeNotifications,
  useRealtimeSubmissionStatus,
} from '@tupsafe/database';

function DashboardPage() {
  const { user } = useAuth();

  // Auto-subscribes to notifications
  useRealtimeNotifications(user?.id || '');

  // Auto-subscribes to submission status changes
  useRealtimeSubmissionStatus(user?.id || '', {
    onApproved: (submission) => {
      // Custom logic on approval
    },
  });

  return <div>Dashboard</div>;
}
```

## 🔧 Development Workflow

### Daily Development Flow

1. **Start Development Servers**:

```bash
# Terminal 1: Employee Portal
npm run dev:employee

# Terminal 2: Admin Portal
npm run dev:admin

# Terminal 3: Drizzle Studio (optional)
cd packages/database && npm run db:studio
```

2. **Make Changes** → **Test** → **Commit**

3. **Check Logs**:
   - Browser console for client errors
   - Terminal for server errors
   - Supabase Dashboard → Logs for database errors

### Testing Checklist

Before considering a feature complete:

- [ ] Works for regular employee user
- [ ] Works for HR/Admin user
- [ ] RLS policies are enforced
- [ ] Audit logs are created
- [ ] Notifications are sent (if applicable)
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Error handling works
- [ ] Loading states shown

## 📚 Reference Documentation

### Essential Files to Review

1. **Database Schema**: `packages/database/src/schema.ts`

   - See all table structures and relationships

2. **RLS Policies**: `packages/database/sql/rls-policies.sql`

   - Understand access control rules

3. **Storage Utilities**: `packages/database/src/utils/storage.ts`

   - Use for PDF uploads/downloads

4. **Audit Logging**: `packages/database/src/utils/audit-log.ts`

   - Use in all server actions

5. **Mock Data**: `packages/mock-data/src/data/`
   - Reference for data structures

### Supabase Dashboard Reference

- **SQL Editor**: Run custom queries, apply policies
- **Table Editor**: View/edit data manually
- **Auth**: Manage users, view auth logs
- **Storage**: Create buckets, set up policies
- **Logs**: View errors and performance

## 💡 Tips & Best Practices

### Performance

- Use React Query for all data fetching
- Implement optimistic updates for better UX
- Use Drizzle's query builder (avoid raw SQL)
- Monitor slow queries in Supabase Dashboard

### Security

- Always validate user permissions in server actions
- Never trust client-side data
- Use RLS as primary security layer
- Log all sensitive operations
- Sanitize data before audit logging

### Code Organization

- Server actions in `app/actions/`
- Reusable hooks in `hooks/`
- UI components in `components/`
- Utilities in packages (shared across apps)

### Error Handling

```typescript
try {
  const result = await someServerAction();

  if (result.error) {
    toast.error(result.error);
    return;
  }

  toast.success('Operation successful!');
} catch (error) {
  console.error(error);
  toast.error('An unexpected error occurred');
}
```

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Database connection failed"

- **Fix**: Check DATABASE_URL in .env.local, ensure port 6543

**Issue**: "Permission denied" errors

- **Fix**: Check RLS policies are applied, verify user role

**Issue**: "File upload failed"

- **Fix**: Check storage bucket exists, verify storage policies

**Issue**: "Real-time not working"

- **Fix**: Check Supabase Realtime is enabled in dashboard

**Issue**: "Slow queries"

- **Fix**: Check indexes exist, review Supabase logs, optimize query

## 📊 Progress Tracking

As you implement, update `docs/IMPLEMENTATION_STATUS.md`:

- Mark todos as completed
- Add notes on challenges
- Document any deviations from plan

## 🎯 Immediate Next Action

**Right now, you should**:

1. ✅ Review this document
2. ⏩ Run the Quick Start steps (30 mins)
3. ⏩ Test database connection
4. ⏩ Start with Authentication implementation
5. ⏩ Move to PDS server actions
6. ⏩ Continue with remaining priorities

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Drizzle Docs**: https://orm.drizzle.team/docs/overview
- **React Query Docs**: https://tanstack.com/query/latest/docs/framework/react/overview
- **Next.js Docs**: https://nextjs.org/docs

---

**Remember**: You have a solid foundation. The remaining work is primarily connecting the UI to the backend through server actions. Take it step by step, test frequently, and refer to the documentation files when needed.

Good luck! 🚀
