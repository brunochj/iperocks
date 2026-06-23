'use client';

import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';
import { isAuthPath } from '@/lib/navigate';
import AppHeader from './app-header';
import AppFooterNav from './app-footer-nav';

export default function AppNavbar() {
  const { user, loading } = useUser();
  const pathname = usePathname();

  if (isAuthPath(pathname)) return null;
  if (loading) return null;
  if (!user?.rulesAccepted) return null;

  return (
    <>
      <AppHeader />
      <AppFooterNav />
    </>
  );
}
