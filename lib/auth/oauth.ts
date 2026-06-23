import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { createClient } from '@/lib/supabase/client';
import { apiFetch, writeCachedUserProfile } from '@/lib/api-fetch';
import { getAppSessionToken } from '@/lib/app-session-client';
import { readStoredAuthUser, readStoredSupabaseSession, getSessionWithTimeout, withAsyncTimeout } from '@/lib/supabase/session-fast';
import { navigateTo, isCurrentPath } from '@/lib/navigate';

const OAUTH_PROCESSING_KEY = 'iperocks_oauth_processing';
const OAUTH_PENDING_KEY = 'iperocks_oauth_pending';
const OAUTH_HANDLED_KEY = 'iperocks_oauth_handled';
const APP_DEEP_LINK_SCHEME = 'com.ipe.rocks';

export function buildAppDeepLink(params: {
  code?: string | null;
  next?: string;
  error?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.next) query.set('next', params.next);
  if (params.code) query.set('code', params.code);
  if (params.error) query.set('error_description', params.error);
  return `${APP_DEEP_LINK_SCHEME}://auth/callback?${query.toString()}`;
}

export function getOAuthRedirectUrl(nextPath: string) {
  if (!Capacitor.isNativePlatform()) {
    const next = encodeURIComponent(nextPath);
    return `${window.location.origin}/auth/callback?next=${next}`;
  }

  const explicit = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL;
  if (explicit) {
    const separator = explicit.includes('?') ? '&' : '?';
    return `${explicit}${separator}next=${encodeURIComponent(nextPath)}`;
  }

  // Native: Supabase must redirect here directly (whitelist in Supabase dashboard).
  // Do NOT use localhost — Android emulator cannot reach it from the OAuth browser.
  return buildAppDeepLink({ next: nextPath });
}

export async function signInWithGoogle(nextPath = '/home') {
  const supabase = createClient();
  const redirectTo = getOAuthRedirectUrl(nextPath);
  const isNative = Capacitor.isNativePlatform();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: isNative,
    },
  });

  if (error) {
    throw error;
  }

  if (isNative && data?.url) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(OAUTH_PENDING_KEY, nextPath);
    }

    const authorizeUrl = new URL(data.url);
    const redirectParam = authorizeUrl.searchParams.get('redirect_to');
    console.log('[oauth] redirect_to in authorize URL:', redirectParam);

    if (redirectParam && !redirectParam.startsWith(`${APP_DEEP_LINK_SCHEME}://`)) {
      console.warn(
        '[oauth] Supabase is not using the app deep link. Add this to Supabase → Authentication → Redirect URLs:',
        redirectTo
      );
    }

    await Browser.open({ url: data.url });
  }
}

function getOAuthErrorFromUrl(url: string) {
  const descMatch = url.match(/[?&]error_description=([^&]+)/);
  if (descMatch) {
    return decodeURIComponent(descMatch[1].replace(/\+/g, ' '));
  }
  const errorMatch = url.match(/[?&]error=([^&]+)/);
  if (errorMatch && errorMatch[1] !== 'null') {
    return decodeURIComponent(errorMatch[1].replace(/\+/g, ' '));
  }
  return null;
}

function assertNoOAuthError(url?: string) {
  if (!url) return;
  const oauthError = getOAuthErrorFromUrl(url);
  if (oauthError) {
    throw new Error(oauthError);
  }
}

function getCodeFromUrl(url: string) {
  const match = url.match(/[?&]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getNextFromUrl(url: string) {
  const match = url.match(/[?&]next=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '/home';
}

async function establishSessionFromUrl(url?: string) {
  const stored = readStoredSupabaseSession();
  if (stored?.access_token) {
    return stored;
  }

  const supabase = createClient();

  if (!url) {
    return null;
  }

  const code = getCodeFromUrl(url);
  if (code) {
    const exchanged = await withAsyncTimeout(
      supabase.auth.exchangeCodeForSession(code),
      12000
    );

    if (exchanged?.data.session) {
      return exchanged.data.session;
    }

    if (exchanged?.error) {
      const { data } = await getSessionWithTimeout(() => supabase.auth.getSession(), 2000);
      if (data.session) {
        return data.session;
      }
      console.error('[oauth] exchangeCodeForSession failed:', exchanged.error);
      throw exchanged.error;
    }

    const retryStored = readStoredSupabaseSession();
    if (retryStored?.access_token) {
      return retryStored;
    }

    throw new Error('OAuth code exchange timed out');
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const params = new URLSearchParams(url.slice(hashIndex + 1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const setResult = await withAsyncTimeout(
        supabase.auth.setSession({
          access_token,
          refresh_token,
        }),
        8000
      );
      if (setResult?.error) {
        console.error('[oauth] setSession from hash failed:', setResult.error);
        throw setResult.error;
      }
      return setResult?.data.session ?? null;
    }
  }

  const { data } = await getSessionWithTimeout(() => supabase.auth.getSession(), 2000);
  return data.session;
}

export async function finishOAuthFromUrl(url: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(OAUTH_PROCESSING_KEY, '1');
  }

  try {
    assertNoOAuthError(url);
    const session = await establishSessionFromUrl(url);
    if (!session) {
      throw new Error('No session after OAuth callback');
    }
    await completeOAuthRedirect(getNextFromUrl(url));
  } finally {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
    }
  }
}

export async function finishOAuthFromCallbackPage(
  code: string | null,
  nextPath: string,
  oauthError?: string | null
) {
  if (oauthError) {
    throw new Error(oauthError);
  }

  if (typeof window !== 'undefined') {
    assertNoOAuthError(window.location.href);
  }

  if (typeof window !== 'undefined') {
    if (sessionStorage.getItem(OAUTH_PROCESSING_KEY) === '1') {
      return;
    }
  }

  if (Capacitor.isNativePlatform() && !code) {
    const waited = await waitForSession(3000);
    if (waited) {
      await completeOAuthRedirect(nextPath);
      return;
    }
    throw new Error('OAuth timeout on native');
  }

  const session = await establishSessionFromUrl(
    typeof window !== 'undefined' ? window.location.href : undefined
  );

  if (!session) {
    throw new Error('No session after OAuth callback');
  }

  await completeOAuthRedirect(nextPath);
}

async function waitForSession(timeoutMs: number) {
  const session = await ensureSession(timeoutMs);
  return Boolean(session);
}

async function ensureSession(timeoutMs: number) {
  const stored = readStoredSupabaseSession();
  if (stored?.access_token) {
    return stored;
  }

  const supabase = createClient();
  const { data } = await getSessionWithTimeout(
    () => supabase.auth.getSession(),
    timeoutMs
  );
  return data.session;
}

export async function redirectAuthenticatedUser(nextPath = '/home') {
  const session = await ensureSession(1000);
  if (!session) return false;

  clearOAuthFlags();

  let destination = nextPath;
  try {
    const res = await apiFetch('/api/auth/check');
    const data = await res.json();
    if (!data.session?.user) return false;
    destination = data.session.user.rulesAccepted ? nextPath : '/onboarding';
  } catch {
    // Keep nextPath when API is temporarily unavailable.
  }

  if (isCurrentPath(destination)) {
    return true;
  }

  navigateTo(destination);
  return true;
}

export async function tryCompletePendingOAuth() {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(OAUTH_PROCESSING_KEY) === '1') return true;

  const pendingNext = sessionStorage.getItem(OAUTH_PENDING_KEY);
  if (!pendingNext) return false;

  const session = await ensureSession(500);
  if (!session) return false;

  await completeOAuthRedirect(pendingNext);
  return true;
}

async function completeOAuthRedirect(nextPath: string) {
  const session = await ensureSession(3000);

  if (!session) {
    console.error('[oauth] no session before redirect');
    navigateTo('/login');
    return;
  }

  if (typeof window !== 'undefined') {
    clearOAuthFlags();
    sessionStorage.setItem(OAUTH_HANDLED_KEY, '1');
  }

  let destination = '/onboarding';

  try {
    const res = await apiFetch('/api/auth/check');
    const data = await res.json();
    const dbUser = data.session?.user;
    if (dbUser) {
      writeCachedUserProfile(dbUser);
    }
    destination = dbUser?.rulesAccepted ? nextPath : '/onboarding';
  } catch (error) {
    console.error('[oauth] auth/check failed:', error);
    destination = nextPath;
  }

  if (isCurrentPath(destination)) {
    return;
  }

  try {
    await apiFetch('/api/auth/oauth-sync', { method: 'POST' });
  } catch (error) {
    console.error('[oauth] oauth-sync failed:', error);
  }

  navigateTo(destination);
}

export function isOAuthInProgress() {
  if (typeof window === 'undefined') return false;
  if (isOAuthHandled()) return false;
  if (readStoredAuthUser() || getAppSessionToken()) return false;
  return (
    sessionStorage.getItem(OAUTH_PROCESSING_KEY) === '1' ||
    sessionStorage.getItem(OAUTH_PENDING_KEY) !== null
  );
}

export function clearOAuthFlags() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
}

/** Drop stale OAuth flags left from an interrupted browser handoff. */
export function clearStaleOAuthFlags() {
  if (typeof window === 'undefined') return;

  if (sessionStorage.getItem(OAUTH_PROCESSING_KEY) === '1') {
    sessionStorage.removeItem(OAUTH_PROCESSING_KEY);
  }

  const pending = sessionStorage.getItem(OAUTH_PENDING_KEY);
  if (!pending) return;

  // OAuth completed — session is in storage.
  if (readStoredAuthUser() || getAppSessionToken()) {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    return;
  }

  // Browser was opened but login never finished — don't block boot forever.
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
}

export function isOAuthHandled() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(OAUTH_HANDLED_KEY) === '1';
}

export function markOAuthHandled() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OAUTH_HANDLED_KEY, '1');
}

export function isOAuthCallbackUrl(url: string) {
  return (
    url.startsWith(`${APP_DEEP_LINK_SCHEME}://`) ||
    url.includes('/auth/callback')
  );
}
