'use client';

import { ThemeProvider } from './components/ThemeProvider';
import { OAuthListener } from './components/oauth-listener';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OAuthListener />
      {children}
    </ThemeProvider>
  );
}
