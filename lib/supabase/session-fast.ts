/** Read Supabase session from localStorage without awaiting getSession() (avoids WebView hangs). */

type StoredSession = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  };
};

function supabaseStorageKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const ref = new URL(url).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return null;
  }
}

function parseStoredSession(raw: string): StoredSession | null {
  try {
    const parsed = JSON.parse(raw) as StoredSession | StoredSession[];
    const session = Array.isArray(parsed) ? parsed[0] : parsed;
    if (
      session &&
      typeof session.access_token === 'string' &&
      session.user &&
      typeof session.user.id === 'string'
    ) {
      return session;
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

export function readStoredSupabaseSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const key = supabaseStorageKey();
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return parseStoredSession(raw);
}

export function readStoredAccessToken(): string | null {
  return readStoredSupabaseSession()?.access_token ?? null;
}

export function readStoredAuthUser(): StoredSession['user'] | null {
  return readStoredSupabaseSession()?.user ?? null;
}

export function hasStoredSession(): boolean {
  return readStoredSupabaseSession() !== null;
}

export async function withAsyncTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getSessionWithTimeout(
  getSession: () => PromiseLike<{
    data: { session: StoredSession | null };
  }>,
  timeoutMs = 3000
): Promise<{ data: { session: StoredSession | null } }> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(getSession()),
      new Promise<{ data: { session: null } }>((resolve) => {
        timer = setTimeout(() => resolve({ data: { session: null } }), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
