'use client';

import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/login', '/register', '/onboarding'];

export default function AppMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  const showNav =
    !loading &&
    !!user &&
    user.rulesAccepted &&
    !AUTH_PATHS.includes(pathname);

  return (
    <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>{children}</main>
  );
}
