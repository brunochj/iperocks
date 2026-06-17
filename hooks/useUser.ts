'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api-fetch';
import { getAppSessionToken } from '@/lib/app-session-client';

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  username?: string | null;
  rulesAccepted: boolean;
};

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      setLoading(true);

      const appToken = getAppSessionToken();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser && !appToken) {
        setUser(null);
        setLoading(false);
        return;
      }

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
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? null,
          image: authUser.user_metadata?.avatar_url ?? null,
          rulesAccepted: Boolean(authUser.user_metadata?.rulesAccepted),
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    const onAppSessionChange = () => {
      void loadUser();
    };

    window.addEventListener('iperocks-app-session-change', onAppSessionChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('iperocks-app-session-change', onAppSessionChange);
    };
  }, []);

  return { user, loading };
}
