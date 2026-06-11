"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="text-xl font-bold text-gray-800 dark:text-white">
          Iperocks
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white transition hover:bg-red-600"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
