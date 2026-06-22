import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api-fetch';

const OAUTH_PROCESSING_KEY = 'iperocks_oauth_processing';

export function getOAuthRedirectUrl(nextPath: string) {
  const next = encodeURIComponent(nextPath);
  if (Capacitor.isNativePlatform()) {
    return `com.ipe.rocks://auth/callback?next=${next}`;
  }
  return `${window.location.origin}/auth/callback?next=${next}`;
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

function getNextFromUrl(url: string) {
  const match = url.match(/[?&]next=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '/home';
}

async function establishSessionFromUrl(url?: string) {
  const supabase = createClient();

  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();
  if (existingSession) {
    return existingSession;
  }

  if (!url) {
    return null;
  }

  const code = getCodeFromUrl(url);
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[oauth] exchangeCodeForSession failed:', error);
      throw error;
    }
    return data.session;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const params = new URLSearchParams(url.slice(hashIndex + 1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        console.error('[oauth] setSession from hash failed:', error);
        throw error;
      }
      return data.session;
    }
  }

  return null;
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
  const supabase = createClient();
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return false;
}

async function completeOAuthRedirect(nextPath: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error('[oauth] no session before redirect');
    window.location.href = '/login';
    return;
  }

  try {
    await apiFetch('/api/auth/oauth-sync', { method: 'POST' });
  } catch (error) {
    console.error('[oauth] oauth-sync failed:', error);
  }

  const res = await apiFetch('/api/auth/check');
  const data = await res.json();
  const user = data.session?.user;
  const destination = user?.rulesAccepted ? nextPath : '/onboarding';
  window.location.href = destination;
}

export function isOAuthCallbackUrl(url: string) {
  return (
    url.includes('/auth/callback') ||
    url.startsWith('com.ipe.rocks://auth/callback')
  );
}
