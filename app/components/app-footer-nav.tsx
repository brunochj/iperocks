"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/croqui", label: "Croqui", icon: "🗺️" },
  { href: "/ranking", label: "Ranking", icon: "🏆" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppFooterNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-stretch justify-around px-2 sm:px-6">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium transition sm:text-sm ${
                active
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="text-lg leading-none sm:text-xl" aria-hidden="true">
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
