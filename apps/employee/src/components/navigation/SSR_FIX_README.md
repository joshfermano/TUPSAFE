# SSR Fix for Supabase Realtime Hooks

## Problem

The Supabase Realtime hooks (e.g., `useRealtimeNotifications`) were causing errors during Server-Side Rendering (SSR):

```
Error: Realtime client not initialized. Call initializeRealtimeClient() before using realtime hooks.
```

### Root Cause

The realtime hooks call `createClient()` during initialization, which happens during SSR. However, the Supabase realtime client is only initialized on the client side via the `RealtimeProvider`. This mismatch causes the error.

## Solution

We implemented a **Client-Only Wrapper** pattern to prevent realtime hooks from being called during SSR.

### Implementation

#### 1. NotificationBellClient Component

Created `/src/components/navigation/NotificationBellClient.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { NotificationBell, type NotificationBellProps } from './NotificationBell';

export function NotificationBellClient(props: NotificationBellProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return placeholder during SSR
  if (!isMounted) {
    return <div className="h-8 w-8" aria-hidden="true" />;
  }

  // Render actual component after client-side hydration
  return <NotificationBell {...props} />;
}
```

#### 2. Updated Header.tsx

Changed from:
```typescript
import { NotificationBell } from './NotificationBell';
// ...
<NotificationBell variant="minimal" />
```

To:
```typescript
import { NotificationBellClient } from './NotificationBellClient';
// ...
<NotificationBellClient variant="minimal" />
```

### Why This Works

1. **SSR Phase**: The wrapper returns a placeholder div, preventing the realtime hooks from being called
2. **Hydration Phase**: After mounting, `isMounted` becomes true
3. **Client Phase**: The actual `NotificationBell` component renders, and realtime hooks work normally

### Benefits

- ✅ No SSR errors
- ✅ Realtime functionality works after hydration
- ✅ No layout shift (placeholder maintains space)
- ✅ Satisfies React Rules of Hooks (no conditional calls)
- ✅ Type-safe with proper TypeScript types
- ✅ No changes needed to shared packages

## Usage Guidelines

### For Components Using Realtime Hooks

**Always** wrap components that use realtime hooks with a client-only pattern:

#### Option 1: Create a Wrapper Component (Recommended)

```typescript
// ComponentClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Component } from './Component';

export function ComponentClient(props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div>Loading...</div>; // Or placeholder
  }

  return <Component {...props} />;
}
```

#### Option 2: Use Dynamic Import (Alternative)

```typescript
import dynamic from 'next/dynamic';

const ComponentClient = dynamic(
  () => import('./Component'),
  { ssr: false }
);
```

#### Option 3: Check Window Existence (Not Recommended)

```typescript
function Component() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const { isConnected } = useRealtimeNotifications(...);
  // ...
}
```

### Best Practices

1. **Always use the wrapper**: Never call realtime hooks directly in server components
2. **Export both versions**: Export both the wrapper and the original component
3. **Document the requirement**: Add comments explaining why the wrapper is needed
4. **Use meaningful placeholders**: Prevent layout shift with proper placeholders
5. **Update usage examples**: Show the correct way to use wrapped components

## Testing

### Verify the Fix

1. **Build the app**:
   ```bash
   npm run build
   ```
   Should succeed without SSR errors.

2. **Check SSR output**:
   ```bash
   npm run start
   # Visit the page and view source
   # The placeholder should be in the HTML
   ```

3. **Test client-side functionality**:
   - Realtime notifications should work after page load
   - No console errors
   - Connection indicator shows "connected"

### Common Issues

**Issue**: "React Hook called conditionally"
- **Cause**: Calling hooks inside conditionals or after early returns
- **Fix**: Use the wrapper pattern instead

**Issue**: "Realtime client not initialized"
- **Cause**: Hook called during SSR
- **Fix**: Use NotificationBellClient wrapper

**Issue**: Layout shift after hydration
- **Cause**: Placeholder size doesn't match actual component
- **Fix**: Set proper dimensions on placeholder

## Files Changed

1. `/src/components/navigation/NotificationBellClient.tsx` - New wrapper component
2. `/src/components/navigation/Header.tsx` - Updated to use wrapper
3. `/src/components/navigation/index.ts` - Export wrapper
4. `/src/components/navigation/USAGE_EXAMPLES.tsx` - Updated examples
5. `/src/components/navigation/NotificationBell.tsx` - Added documentation

## Related Documentation

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Next.js SSR](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

## Future Improvements

### Option A: Fix at Package Level (Preferred for long-term)

Modify `packages/database/src/hooks/useRealtimeBase.ts` to detect SSR:

```typescript
export function useRealtimeBase(channelName: string) {
  // Detect SSR
  if (typeof window === 'undefined') {
    return {
      supabase: null,
      subscribe: () => {},
      cleanup: () => {},
      status: 'disconnected' as const,
      error: null,
      isConnected: false,
      isConnecting: false,
      hasError: false,
    };
  }

  const supabase = createClient();
  // ... rest of implementation
}
```

### Option B: Use Context to Provide Client

Pass the Supabase client through React Context instead of calling `createClient()` in hooks.

## Conclusion

This fix ensures the employee app builds and runs successfully without SSR errors while maintaining full realtime functionality after client-side hydration. The wrapper pattern is clean, type-safe, and doesn't require changes to shared packages.
