"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "./app-header";
import AppFooterNav from "./app-footer-nav";
import { createClient } from "@/lib/supabase/client";

const AUTH_PATHS = ["/login", "/register", "/onboarding"];

export default function AppNavbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!user?.user_metadata?.rulesAccepted) return null;
  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      <AppHeader />
      <AppFooterNav />
    </>
  );
}
