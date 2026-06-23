'use client';

import { ThemeProvider } from './components/ThemeProvider';
import { OAuthListener } from './components/oauth-listener';
import { UserProvider } from './contexts/user-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <OAuthListener />
        {children}
      </UserProvider>
    </ThemeProvider>
  );
}
