import { Capacitor } from '@capacitor/core';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseClient) {
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

    supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          // Native WebView: token refresh on init can hang with no visible network activity.
          autoRefreshToken: !isNative,
          detectSessionInUrl: false,

          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  }

  return supabaseClient;
}
