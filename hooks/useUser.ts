"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();

        if (data.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to Supabase auth metadata below.
      }

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        name: authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? null,
        image: authUser.user_metadata?.avatar_url ?? null,
        rulesAccepted: false,
      });
      setLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
