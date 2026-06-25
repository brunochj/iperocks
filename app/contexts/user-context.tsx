'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  apiFetch,
  clearCachedUserProfile,
  readCachedUserProfile,
  writeCachedUserProfile,
} from '@/lib/api-fetch';
import { clearOAuthFlags } from '@/lib/auth/oauth';
import { getAppSessionToken } from '@/lib/app-session-client';
import {
  readStoredAuthUser,
  readStoredSupabaseSession,
} from '@/lib/supabase/session-fast';

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  username?: string | null;
  rulesAccepted: boolean;
};

type UserContextValue = {
  user: AppUser | null;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
});

function toAppUser(data: Record<string, unknown>): AppUser {
  return {
    id: data.id as string,
    email: (data.email as string) ?? '',
    name: (data.name as string | null) ?? null,
    image: (data.image as string | null) ?? null,
    username: (data.username as string | null | undefined) ?? null,
    rulesAccepted: Boolean(data.rulesAccepted),
  };
}

function userFromAuthMetadata(
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  previous?: AppUser | null
): AppUser {
  const cached = readCachedUserProfile();
  const cachedId =
    cached && typeof cached.id === 'string' ? cached.id : null;

  if (
    cached &&
    cachedId === authUser.id &&
    typeof cached.rulesAccepted === 'boolean'
  ) {
    return {
      id: authUser.id,
      email: (cached.email as string) ?? authUser.email ?? '',
      name:
        (cached.name as string | null) ??
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email?.split('@')[0] ??
        null,
      image:
        (cached.image as string | null) ??
        (authUser.user_metadata?.avatar_url as string | undefined) ??
        null,
      username: (cached.username as string | null | undefined) ?? null,
      rulesAccepted: Boolean(cached.rulesAccepted),
    };
  }

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name:
      (authUser.user_metadata?.name as string | undefined) ??
      authUser.email?.split('@')[0] ??
      null,
    image: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
    username: previous?.id === authUser.id ? previous.username ?? null : null,
    rulesAccepted:
      previous?.id === authUser.id
        ? previous.rulesAccepted
        : Boolean(authUser.user_metadata?.rulesAccepted),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AppUser | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const supabase = createClient();

    const resolve = (nextUser: AppUser | null) => {
      userRef.current = nextUser;
      loadingRef.current = false;
      setUser(nextUser);
      setLoading(false);
    };

    const loadUser = async (options?: { silent?: boolean }) => {
      // ── Fast path: read session directly from localStorage ────────────────
      const storedUser = readStoredAuthUser();
      const appToken = getAppSessionToken();

      const cached = readCachedUserProfile();

      if (!storedUser && !appToken) {
        // No session at all — resolve immediately without waiting on Supabase
        clearOAuthFlags();
        clearCachedUserProfile();
        console.warn('[useUser] no session (fast path)');
        resolve(null);
        return;
      }

      if (!options?.silent) {
        // Prefer cached profile (includes rulesAccepted from API/DB)
        if (cached && typeof cached.id === 'string') {
          resolve(toAppUser(cached));
        } else if (storedUser) {
          resolve(userFromAuthMetadata(storedUser, userRef.current));
        }
      }

      // ── Background: validate with Express API ─────────────────────────────
      try {
        const res = await apiFetch('/api/auth/check');
        const data = await res.json();

        if (data.session?.user) {
          const appUser = toAppUser(data.session.user as Record<string, unknown>);
          writeCachedUserProfile(appUser);
          resolve(appUser);
          console.warn('[useUser] session validated');
          return;
        }

        // API says no session — clear and sign out
        clearOAuthFlags();
        clearCachedUserProfile();
        resolve(null);
        console.warn('[useUser] API rejected session');
      } catch {
        // API unreachable — keep the optimistic user if we had one
        if (cached && typeof cached.id === 'string') {
          resolve(toAppUser(cached));
          console.warn('[useUser] API unavailable, using cached session');
        } else if (storedUser) {
          resolve(userFromAuthMetadata(storedUser, userRef.current));
          console.warn('[useUser] API unavailable, using stored session');
        } else {
          resolve(null);
        }
      }
    };

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
      void loadUser({ silent: true });
    });

    const onAppSessionChange = () => void loadUser({ silent: true });
    window.addEventListener('iperocks-app-session-change', onAppSessionChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('iperocks-app-session-change', onAppSessionChange);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
