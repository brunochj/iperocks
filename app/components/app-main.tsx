'use client';

import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';
import { isAuthPath } from '@/lib/navigate';

export default function AppMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  const showNav =
    !isAuthPath(pathname) &&
    !loading &&
    !!user &&
    user.rulesAccepted;

  return (
    <main className={`flex-1 ${showNav ? 'pb-20' : ''}`}>{children}</main>
  );
}
