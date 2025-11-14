/**
 * Supabase Admin Client
 *
 * This module provides a server-side Supabase client with service role privileges.
 * It should only be used in secure server environments (API routes, server actions, CLI scripts).
 *
 * WARNING: The service role key bypasses Row Level Security (RLS) policies.
 * Use with extreme caution and never expose to client-side code.
 *
 * @module auth/utils/supabase/admin
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with admin (service role) privileges.
 *
 * This client has full database access and bypasses RLS policies.
 * Use only for administrative operations like:
 * - Creating users programmatically
 * - Admin-level data operations
 * - Background jobs and scripts
 *
 * @returns {SupabaseClient} Supabase admin client
 * @throws {Error} If required environment variables are missing
 *
 * @example
 * ```typescript
 * import { createAdminClient } from '@tupsafe/auth/utils/supabase/admin';
 *
 * const admin = createAdminClient();
 * const { data, error } = await admin.auth.admin.createUser({
 *   email: 'admin@tup.edu.ph',
 *   password: 'secure-password',
 *   email_confirm: true,
 * });
 * ```
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase Service Role Key. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Type alias for the admin client for better IDE support
 */
export type AdminClient = ReturnType<typeof createAdminClient>;
