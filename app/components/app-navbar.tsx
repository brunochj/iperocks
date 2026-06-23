'use client';

import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';
import AppHeader from './app-header';
import AppFooterNav from './app-footer-nav';

const AUTH_PATHS = ['/login', '/register', '/onboarding'];

export default function AppNavbar() {
  const { user, loading } = useUser();
  const pathname = usePathname();

  if (loading) return null;
  if (!user?.rulesAccepted) return null;
  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      <AppHeader />
      <AppFooterNav />
    </>
  );
}
