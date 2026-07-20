'use client';

import { ThemeProvider } from './components/ThemeProvider';
import { OAuthListener } from './components/oauth-listener';
import { UserProvider } from './contexts/user-context';
import { OfflineInitializer } from './components/OfflineInitializer';
import { startSyncScheduler, syncOnReconnect } from '@/lib/offline/sync';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startSyncScheduler();

    const handleOnline = () => {
      console.log('[Providers] Back online, syncing pending operations...');
      syncOnReconnect();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
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