import { createClient } from '@/lib/supabase/client';
import { clearAppSessionToken } from '@/lib/app-session-client';
import { clearCachedUserProfile } from '@/lib/api-fetch';
import { clearOAuthFlags, clearOAuthHandled } from '@/lib/auth/oauth';
import { clearStoredSupabaseSession } from '@/lib/supabase/session-fast';
import { navigateTo } from '@/lib/navigate';

/** Sign out without blocking on Supabase getSession/signOut (avoids WebView hangs). */
export async function signOutUser() {
  clearStoredSupabaseSession();
  clearAppSessionToken();
  clearCachedUserProfile();
  clearOAuthFlags();
  clearOAuthHandled();

  window.dispatchEvent(new Event('iperocks-app-session-change'));

  navigateTo('/login');

  // Best-effort remote sign-out — don't await (can hang in Capacitor WebView).
  try {
    const supabase = createClient();
    void supabase.auth.signOut();
  } catch {
    // Local session already cleared.
  }
}
