'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { finishOAuthFromCallbackPage } from '@/lib/auth/oauth';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const next = searchParams.get('next') || '/home';
    const code = searchParams.get('code');
    const oauthError =
      searchParams.get('error_description') || searchParams.get('error');

    const finish = async () => {
      try {
        await finishOAuthFromCallbackPage(code, next, oauthError);
      } catch (err) {
        console.error('[oauth] callback page failed:', err);
        setError('Não foi possível concluir o login com Google.');
      }
    };

    void finish();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-500">{error}</p>
        <a href="/login" className="text-indigo-600 underline">
          Voltar para o login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      Carregando...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Carregando...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
