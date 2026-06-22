import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Capacitor WebView: avoid cookie-based session + OAuth hash parsing issues
          detectSessionInUrl: false,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }

  return supabaseClient;
}
