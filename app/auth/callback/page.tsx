"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const callbackUrl = searchParams.get("callbackUrl") || "/home";

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.push(callbackUrl);
            return;
          }
        } catch (err) {
          console.error("Auth callback error:", err);
        }
      }

      // If no code or error, redirect to login
      router.push("/login");
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Autenticando...</p>
      </div>
    </div>
  );
}
