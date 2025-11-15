# Settings React Query Hooks - Usage Guide

This guide provides practical examples for using the Settings-related React Query hooks in the Admin Portal.

## Table of Contents
1. [useUserProfileQuery](#useuserprofilequery)
2. [useUserPreferencesQuery](#useuserpreferencesquery)
3. [usePasswordChangeQuery](#usepasswordchangequery)
4. [useActiveSessionsQuery](#useactivesessionsquery)

---

## useUserProfileQuery

Manage user profile information (name, phone, department, position).

### Basic Usage

```tsx
'use client';

import { useUserProfileQuery } from '@/hooks';

export function ProfileSettings() {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
  } = useUserProfileQuery();

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  const handleUpdate = async () => {
    await updateProfile({
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      middleName: 'Santos',
      phoneNumber: '09171234567',
    });
  };

  return (
    <div>
      <h2>Profile Settings</h2>
      <p>Name: {profile.firstName} {profile.lastName}</p>
      <p>Email: {profile.email}</p>
      <p>Role: {profile.role}</p>
      <p>Department: {profile.department?.name || 'N/A'}</p>
      <button onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
}
```

### Form Integration with React Hook Form

```tsx
import { useUserProfileQuery } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileRequestSchema } from '@tupsafe/types';
import type { UpdateProfileRequest } from '@tupsafe/types';

export function ProfileForm() {
  const { profile, updateProfile, isUpdating } = useUserProfileQuery();

  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequestSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      middleName: profile?.middleName || '',
      phoneNumber: profile?.phoneNumber || '',
    },
  });

  const onSubmit = async (data: UpdateProfileRequest) => {
    await updateProfile(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('firstName')} placeholder="First Name" />
      <input {...form.register('lastName')} placeholder="Last Name" />
      <input {...form.register('middleName')} placeholder="Middle Name" />
      <input {...form.register('phoneNumber')} placeholder="Phone Number" />
      <button type="submit" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

### Key Features
- ✅ Optimistic updates (instant UI feedback)
- ✅ Automatic cache invalidation
- ✅ Toast notifications on success/error
- ✅ 5-minute stale time
- ✅ Audit logging via API

---

## useUserPreferencesQuery

Manage user UI and notification preferences.

### Basic Usage

```tsx
import { useUserPreferencesQuery } from '@/hooks';

export function PreferencesSettings() {
  const {
    preferences,
    isLoading,
    updatePreferences,
    isUpdating,
  } = useUserPreferencesQuery();

  if (isLoading) return <div>Loading preferences...</div>;
  if (!preferences) return null;

  const toggleTheme = async () => {
    await updatePreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const toggleNotifications = async () => {
    await updatePreferences({
      emailNotificationsEnabled: !preferences.emailNotificationsEnabled,
    });
  };

  return (
    <div>
      <h2>Preferences</h2>
      <div>
        <p>Theme: {preferences.theme}</p>
        <button onClick={toggleTheme} disabled={isUpdating}>
          Toggle Theme
        </button>
      </div>
      <div>
        <p>Email Notifications: {preferences.emailNotificationsEnabled ? 'On' : 'Off'}</p>
        <button onClick={toggleNotifications} disabled={isUpdating}>
          Toggle Notifications
        </button>
      </div>
    </div>
  );
}
```

### Advanced: Multiple Preferences Update

```tsx
import { useUserPreferencesQuery } from '@/hooks';
import type { UpdatePreferencesRequest } from '@tupsafe/types';

export function AdvancedPreferences() {
  const { preferences, updatePreferences } = useUserPreferencesQuery();

  const handleBulkUpdate = async () => {
    const updates: UpdatePreferencesRequest = {
      theme: 'dark',
      emailNotificationsEnabled: true,
      emailDigestFrequency: 'daily',
      dashboardLayout: 'compact',
      language: 'en',
    };

    await updatePreferences(updates);
  };

  return (
    <button onClick={handleBulkUpdate}>
      Apply Recommended Settings
    </button>
  );
}
```

### Key Features
- ✅ Optimistic updates
- ✅ Partial updates (only send changed fields)
- ✅ 10-minute stale time (preferences change less often)
- ✅ Toast notifications

---

## usePasswordChangeQuery

Secure password change with validation.

### Basic Usage

```tsx
import { usePasswordChangeQuery } from '@/hooks';
import { useState } from 'react';

export function PasswordChange() {
  const { changePassword, isChanging, error, isSuccess } = usePasswordChangeQuery();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword(passwords);
  };

  // Clear form on success
  if (isSuccess) {
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Change Password</h2>
      {error && <div className="error">{error.message}</div>}

      <input
        type="password"
        placeholder="Current Password"
        value={passwords.currentPassword}
        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
      />

      <input
        type="password"
        placeholder="New Password"
        value={passwords.newPassword}
        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
      />

      <input
        type="password"
        placeholder="Confirm New Password"
        value={passwords.confirmPassword}
        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
      />

      <button type="submit" disabled={isChanging}>
        {isChanging ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
}
```

### With React Hook Form

```tsx
import { usePasswordChangeQuery } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordRequestSchema } from '@tupsafe/types';
import type { ChangePasswordRequest } from '@tupsafe/types';
import { useRouter } from 'next/navigation';

export function PasswordChangeForm() {
  const router = useRouter();
  const { changePassword, isChanging, isSuccess } = usePasswordChangeQuery();

  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequestSchema),
  });

  const onSubmit = async (data: ChangePasswordRequest) => {
    await changePassword(data);

    // Clear form
    form.reset();

    // Optionally: log out user and redirect to login
    setTimeout(() => {
      router.push('/logout');
    }, 2000);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        type="password"
        {...form.register('currentPassword')}
        placeholder="Current Password"
      />
      {form.formState.errors.currentPassword && (
        <span>{form.formState.errors.currentPassword.message}</span>
      )}

      <input
        type="password"
        {...form.register('newPassword')}
        placeholder="New Password"
      />
      {form.formState.errors.newPassword && (
        <span>{form.formState.errors.newPassword.message}</span>
      )}

      <input
        type="password"
        {...form.register('confirmPassword')}
        placeholder="Confirm Password"
      />
      {form.formState.errors.confirmPassword && (
        <span>{form.formState.errors.confirmPassword.message}</span>
      )}

      <button type="submit" disabled={isChanging}>
        {isChanging ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
```

### Key Features
- ⚠️ **NO optimistic updates** (security sensitive)
- ⚠️ **NO caching** (password data never cached)
- ✅ Clear success/error toast notifications
- ✅ Form should auto-clear on success
- ✅ Password strength validation via Zod
- ✅ Audit logging

---

## useActiveSessionsQuery

Manage active login sessions across devices.

### Basic Usage

```tsx
import { useActiveSessionsQuery } from '@/hooks';

export function ActiveSessions() {
  const {
    sessions,
    currentSessionId,
    isLoading,
    revokeSession,
    isRevokingSession,
  } = useActiveSessionsQuery();

  if (isLoading) return <div>Loading sessions...</div>;

  return (
    <div>
      <h2>Active Sessions</h2>
      <p>Total Sessions: {sessions.length}</p>

      {sessions.map((session) => (
        <div key={session.id}>
          <p>{session.deviceName}</p>
          <p>{session.browser} on {session.os}</p>
          <p>Location: {session.location}</p>
          <p>Last Active: {new Date(session.lastActive).toLocaleString()}</p>

          {session.isCurrent ? (
            <span>Current Session</span>
          ) : (
            <button
              onClick={() => revokeSession({ sessionId: session.id })}
              disabled={isRevokingSession}
            >
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Revoke All Sessions

```tsx
import { useActiveSessionsQuery } from '@/hooks';

export function SessionManagement() {
  const {
    sessions,
    otherSessions,
    revokeAllSessions,
    isRevokingAllSessions,
  } = useActiveSessionsQuery();

  const handleRevokeAll = async () => {
    // Confirm before revoking
    if (window.confirm(`Are you sure you want to log out ${otherSessions.length} other devices?`)) {
      await revokeAllSessions({ keepCurrent: true });
    }
  };

  return (
    <div>
      <h2>Session Management</h2>
      <p>You are logged in on {sessions.length} devices</p>

      {otherSessions.length > 0 && (
        <button
          onClick={handleRevokeAll}
          disabled={isRevokingAllSessions}
        >
          {isRevokingAllSessions
            ? 'Logging out other devices...'
            : `Log out all other devices (${otherSessions.length})`
          }
        </button>
      )}
    </div>
  );
}
```

### Advanced: Session Monitoring

```tsx
import { useActiveSessionsQuery } from '@/hooks';
import { useEffect } from 'react';

export function SessionMonitor() {
  const {
    sessions,
    currentSession,
    otherSessions,
    refetch,
  } = useActiveSessionsQuery();

  // Periodically refresh sessions (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Alert if new session detected
  useEffect(() => {
    if (otherSessions.length > 0) {
      console.log(`Security Alert: ${otherSessions.length} other active sessions`);
    }
  }, [otherSessions.length]);

  return (
    <div>
      <h3>Security Monitoring</h3>
      <div>
        <p>Current Session:</p>
        {currentSession && (
          <div>
            <p>{currentSession.browser} on {currentSession.os}</p>
            <p>IP: {currentSession.ipAddress}</p>
          </div>
        )}
      </div>

      {otherSessions.length > 0 && (
        <div className="alert">
          <p>⚠️ Warning: {otherSessions.length} other active sessions detected</p>
        </div>
      )}
    </div>
  );
}
```

### Key Features
- ✅ Optimistic updates for session revocations
- ✅ Identify current session
- ✅ Revoke single or all sessions
- ✅ 1-minute stale time (sessions are dynamic)
- ✅ Device/browser/OS parsing
- ✅ IP address masking
- ✅ Security alerts via toast

---

## Common Patterns

### Loading States

```tsx
import { useUserProfileQuery, useUserPreferencesQuery } from '@/hooks';

export function CombinedSettings() {
  const profile = useUserProfileQuery();
  const preferences = useUserPreferencesQuery();

  const isLoading = profile.isLoading || preferences.isLoading;
  const isUpdating = profile.isUpdating || preferences.isUpdating;

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      {/* Settings content */}
      {isUpdating && <div className="overlay">Saving...</div>}
    </div>
  );
}
```

### Error Handling

```tsx
import { useUserProfileQuery } from '@/hooks';

export function ProfileWithErrorHandling() {
  const { profile, error, isError, refetch } = useUserProfileQuery();

  if (isError) {
    return (
      <div className="error">
        <p>Failed to load profile: {error?.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <div>{/* Profile content */}</div>;
}
```

### Cache Invalidation

```tsx
import { useInvalidateUserProfile, useInvalidateUserPreferences } from '@/hooks';

export function SettingsActions() {
  const invalidateProfile = useInvalidateUserProfile();
  const invalidatePreferences = useInvalidateUserPreferences();

  const handleExternalUpdate = () => {
    // After external changes (e.g., admin update)
    invalidateProfile();
    invalidatePreferences();
  };

  return (
    <button onClick={handleExternalUpdate}>
      Refresh Settings
    </button>
  );
}
```

---

## Best Practices

1. **Always check loading states** before rendering data
2. **Handle errors gracefully** with retry mechanisms
3. **Use optimistic updates** for better UX (except password changes)
4. **Clear sensitive forms** after successful submission
5. **Provide feedback** via loading states and toast notifications
6. **Validate input** using Zod schemas before submission
7. **Monitor sessions** for security (especially after login)
8. **Invalidate caches** after external changes
9. **Use TypeScript** for type safety
10. **Test error scenarios** (network failures, validation errors)

---

## Query Keys

All hooks use consistent query key patterns:

```typescript
// Profile
['settings', 'profile', 'detail']

// Preferences
['settings', 'preferences', 'detail']

// Sessions
['settings', 'sessions', 'list']
```

Use these keys for manual cache manipulation if needed.

---

## API Endpoints

The hooks interact with these API endpoints:

- **Profile**: `GET/PUT /api/settings/profile`
- **Preferences**: `GET/PUT /api/settings/preferences`
- **Password**: `POST /api/settings/password`
- **Sessions**: `GET/DELETE /api/settings/sessions`

All endpoints require authentication and return standardized responses.
