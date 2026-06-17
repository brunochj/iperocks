'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

const HIDDEN_PATHS = new Set(['/login', '/home', '/']);
const AUTH_PATHS = new Set(['/login', '/register', '/onboarding']);

function getBackHref(pathname: string): string {
  if (pathname === '/register') return '/login';
  if (pathname === '/onboarding') return '/login';
  if (pathname === '/croqui') return '/home';
  if (pathname === '/ranking') return '/home';

  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'croqui' && parts.length === 3) {
    return `/croqui/${parts[1]}`;
  }
  if (parts[0] === 'croqui' && parts.length === 2) {
    return '/croqui';
  }

  if (parts.length > 1) {
    return `/${parts.slice(0, -1).join('/')}`;
  }

  return '/home';
}

function BackLink({ href, className }: { href: string; className: string }) {
  return (
    <Link href={href} className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}

export default function BackButton() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  if (HIDDEN_PATHS.has(pathname)) return null;

  const href = getBackHref(pathname);
  const hasNavbar =
    !loading &&
    !!user &&
    user.rulesAccepted &&
    !AUTH_PATHS.has(pathname);

  if (hasNavbar) {
    return (
      <BackLink
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      />
    );
  }

  return (
    <div className="fixed top-4 left-4 z-30">
      <BackLink
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-md backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
      />
    </div>
  );
}
