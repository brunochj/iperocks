"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user has accepted rules from metadata
      const rulesAccepted = user.user_metadata?.rulesAccepted;

      if (!rulesAccepted) {
        router.push("/onboarding");
        return;
      }

      router.push("/home");
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
