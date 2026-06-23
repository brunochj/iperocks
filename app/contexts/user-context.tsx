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
import { apiFetch } from '@/lib/api-fetch';
import { clearOAuthFlags } from '@/lib/auth/oauth';
import { getAppSessionToken } from '@/lib/app-session-client';

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AppUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      const appToken = getAppSessionToken();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;

      if (!authUser && !appToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      clearOAuthFlags();

      try {
        const res = await apiFetch('/api/auth/check');
        const data = await res.json();

        if (data.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to Supabase auth metadata below.
      }

      if (authUser) {
        const previous = userRef.current;
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          name:
            authUser.user_metadata?.name ??
            authUser.email?.split('@')[0] ??
            null,
          image: authUser.user_metadata?.avatar_url ?? null,
          username: previous?.id === authUser.id ? previous.username ?? null : null,
          rulesAccepted:
            previous?.id === authUser.id
              ? previous.rulesAccepted
              : Boolean(authUser.user_metadata?.rulesAccepted),
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') return;
      void loadUser({ silent: Boolean(userRef.current) });
    });

    const onAppSessionChange = () => {
      void loadUser({ silent: Boolean(userRef.current) });
    };

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
