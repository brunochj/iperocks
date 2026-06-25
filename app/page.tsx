'use client';

import { useUser } from "@/hooks/useUser";
import { useEffect, useRef } from "react";
import { navigateTo } from "@/lib/navigate";

export default function RootPage() {
  const { user, loading } = useUser();
  const redirectedRef = useRef(false);

  useEffect(() => {
    console.warn('[root] loading=', loading, 'user=', user?.id ?? null, 'path=', typeof window !== 'undefined' ? window.location.pathname : 'ssr');
    if (loading) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    if (!user) {
      navigateTo("/login");
    } else if (!user.rulesAccepted) {
      navigateTo("/onboarding");
    } else {
      navigateTo("/home");
    }
  }, [user, loading]);

  return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
}
