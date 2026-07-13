'use client';

import { ThemeProvider } from './components/ThemeProvider';
import { OAuthListener } from './components/oauth-listener';
import { UserProvider } from './contexts/user-context';
import { OfflineInitializer } from './components/OfflineInitializer';
import { startSyncScheduler } from '@/lib/offline/sync';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Iniciar o scheduler de sincronização quando o app carregar
    startSyncScheduler();
    return () => {
      // Opcional: parar o scheduler quando desmontar
      // stopSyncScheduler();
    };
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <OAuthListener />
        <OfflineInitializer />
        {children}
      </UserProvider>
    </ThemeProvider>
  );
}