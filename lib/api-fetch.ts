import { Capacitor } from '@capacitor/core';
import { createClient } from '@/lib/supabase/client';
import { getAppSessionToken } from '@/lib/app-session-client';
import {
  getSessionWithTimeout,
  readStoredAccessToken,
} from '@/lib/supabase/session-fast';

const USER_CACHE_KEY = 'iperocks_user_profile';
const NATIVE_FETCH_TIMEOUT_MS = 8000;

/** Hosted API URL — baked into native builds at `npm run build`. */
function getExpressApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_EXPRESS_API_URL?.replace(/\/$/, '');

  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    throw new Error(
      'NEXT_PUBLIC_EXPRESS_API_URL is missing. Set it to your deployed API (HTTPS), then rebuild the app.'
    );
  }

  return 'http://localhost:3001';
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

function withTimeout(init: RequestInit = {}): RequestInit {
  if (init.signal) return init;
  if (!Capacitor.isNativePlatform()) return init;
  return { ...init, signal: AbortSignal.timeout(NATIVE_FETCH_TIMEOUT_MS) };
}

async function resolveAuthHeader(): Promise<string | null> {
  const storedToken = readStoredAccessToken();
  if (storedToken) {
    return storedToken;
  }

  const appToken = getAppSessionToken();
  if (appToken) {
    return appToken;
  }

  const supabase = createClient();
  const { data } = await getSessionWithTimeout(() => supabase.auth.getSession());
  return data.session?.access_token ?? null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const authToken = await resolveAuthHeader();

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${resolveApiBase(path)}${path}`;

  try {
    return await fetch(url, {
      ...withTimeout(init),
      headers,
      credentials: 'include',
    });
  } catch (error) {
    // Don't log AbortError — expected on navigation/cleanup
    if (!(error instanceof Error && error.name === 'AbortError')) {
      console.error(`[apiFetch] ${path} failed (${url}):`, error);
    }
    throw error;
  }
}

export function readCachedUserProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function writeCachedUserProfile(user: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function clearCachedUserProfile() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(USER_CACHE_KEY);
}
