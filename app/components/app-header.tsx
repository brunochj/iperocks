'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import ThemeToggle from './ThemeToggle';
import SideDrawer from './SideDrawer';
import { useTheme } from './ThemeProvider';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function AppHeader() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const userName =
    user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/home" className="flex items-center">
            <Image
              src={theme === 'dark' ? '/iperocks_logo_white.svg' : '/iperocks_logo.svg'}
              alt="Iperocks"
              width={64}
              height={64}
              priority
              className="h-16 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-gray-700 dark:text-gray-300">
              Olá, {userName}
            </span>
            <Bars3Icon
              className="size-6 text-gray-700 dark:text-gray-300"
              onClick={() => setIsDrawerOpen(true)}
            />
          </div>
        </div>
      </header>

      <SideDrawer
        userName={userName}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
