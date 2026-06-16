"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_PATHS = ["/login", "/register", "/onboarding"];

export default function AppMain({
  children,
}: {
  children: React.ReactNode;
}) {
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
  }, []);

  const showNav =
    !loading &&
    user &&
    !!user.user_metadata?.rulesAccepted &&
    !AUTH_PATHS.includes(pathname);

  return (
    <main className={`flex-1 ${showNav ? "pb-20" : ""}`}>{children}</main>
  );
}
