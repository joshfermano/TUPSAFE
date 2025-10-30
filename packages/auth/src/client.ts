import {
  createClient as createSupabaseClient,
  SupabaseClient as SupabaseClientType,
} from '@supabase/supabase-js';

// Lazy-initialized singleton to avoid build-time errors
let cachedClient: SupabaseClientType | null = null;

function getSupabaseClient(): SupabaseClientType {
  if (cachedClient) {
    return cachedClient;
  }

  // Environment variables validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // Create Supabase client with TypeScript support
  cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for enhanced security
    },
    global: {
      headers: {
        'X-Client-Info': 'tupsafe@1.0.0',
      },
    },
  });

  return cachedClient;
}

// Export lazy-initialized singleton
export const supabase = new Proxy({} as SupabaseClientType, {
  get(_, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  },
});

// Export types for easier use
export type SupabaseClient = SupabaseClientType;
