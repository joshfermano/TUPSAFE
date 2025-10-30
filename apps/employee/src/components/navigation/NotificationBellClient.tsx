/**
 * Client-Only NotificationBell Wrapper
 *
 * This wrapper ensures NotificationBell only renders on the client side,
 * preventing SSR issues with Supabase Realtime hooks.
 *
 * @see NotificationBell.tsx for the actual implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { NotificationBell, type NotificationBellProps } from './NotificationBell';

/**
 * Client-side wrapper for NotificationBell
 *
 * Prevents SSR errors by only rendering after client-side hydration.
 * Uses a mounted state to defer rendering until after the component
 * has mounted on the client.
 *
 * @example
 * ```tsx
 * // In Header.tsx or Layout.tsx
 * import { NotificationBellClient } from '@/components/navigation';
 *
 * export function Header() {
 *   return (
 *     <header>
 *       <NotificationBellClient variant="minimal" maxVisible={10} />
 *     </header>
 *   );
 * }
 * ```
 */
export function NotificationBellClient(props: NotificationBellProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return null during SSR and initial render
  // This prevents the realtime hooks from being called during SSR
  if (!isMounted) {
    return (
      <div className="h-8 w-8" aria-hidden="true">
        {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  // Render the actual NotificationBell only after mounting
  return <NotificationBell {...props} />;
}
