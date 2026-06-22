import { createClient } from '@/lib/supabase/client';
import { getAppSessionToken } from '@/lib/app-session-client';

const EXPRESS_API_BASE =
  process.env.NEXT_PUBLIC_EXPRESS_API_URL ?? 'http://localhost:3001';

/** Routes implemented as Next.js API handlers (dev); everything else uses Express. */
const NEXT_API_PATHS = [
  '/api/auth/login',
  '/api/register',
  '/api/user/accepted-rules',
];

function resolveApiBase(path: string): string {
  if (NEXT_API_PATHS.some((prefix) => path.startsWith(prefix))) {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  }
  return EXPRESS_API_BASE;
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
