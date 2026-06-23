import { Capacitor } from '@capacitor/core';
import { createClient } from '@/lib/supabase/client';
import { getAppSessionToken } from '@/lib/app-session-client';

/** Android emulator cannot reach the host via localhost — use 10.0.2.2 instead. */
function getExpressApiBase(): string {
  if (typeof window !== 'undefined' && Capacitor.getPlatform() === 'android') {
    return (
      process.env.NEXT_PUBLIC_EXPRESS_API_URL_ANDROID ?? 'http://10.0.2.2:3001'
    );
  }
  return process.env.NEXT_PUBLIC_EXPRESS_API_URL ?? 'http://localhost:3001';
}

/** Routes with Next.js handlers — only used during `next dev` on port 3000. */
const NEXT_API_PATHS = [
  '/api/auth/login',
  '/api/register',
  '/api/user/accepted-rules',
];

function isNextDevServer(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' &&
    window.location.port === '3000' &&
    window.location.protocol === 'http:'
  );
}

function resolveApiBase(path: string): string {
  if (
    isNextDevServer() &&
    NEXT_API_PATHS.some((prefix) => path.startsWith(prefix))
  ) {
    return window.location.origin;
  }
  return getExpressApiBase();
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  } else {
    const appToken = getAppSessionToken();
    if (appToken) {
      headers.set('Authorization', `Bearer ${appToken}`);
    }
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${resolveApiBase(path)}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
}
