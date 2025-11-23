'use client';

import { useEffect } from 'react';
import { initializeRealtimeClient } from '@tupsafe/database';
import { createClient } from '@tupsafe/auth';

/**
 * RealtimeProvider for Admin Portal
 *
 * Initializes the Supabase Realtime client for use throughout the application.
 * Must be a client component and should wrap the app at the root level.
 *
 * This provider ensures the realtime client is initialized before any
 * realtime hooks are used, preventing initialization errors.
 *
 * Features:
 * - Initializes Supabase Realtime connection
 * - Enables real-time database subscriptions
 * - Provides client for useRealtimeRegistrations and other realtime hooks
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Initialize the realtime client once on mount
      // Only initialize if environment variables are available
      if (
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        initializeRealtimeClient(() => createClient());
        console.log('[RealtimeProvider] Realtime client initialized successfully');
      } else {
        console.warn(
          '[RealtimeProvider] Skipping realtime initialization - environment variables not configured'
        );
      }
    } catch (error) {
      console.error('[RealtimeProvider] Failed to initialize realtime client:', error);
    }
  }, []);

  return <>{children}</>;
}
