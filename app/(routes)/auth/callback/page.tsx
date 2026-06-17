'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get('next') || '/home';
    const code = searchParams.get('code');

    const finish = async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      router.replace(session ? next : '/login');
    };

    void finish();
  }, [router, searchParams]);

  return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
}
