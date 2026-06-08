"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Iperocks
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Home
              </Link>
              <Link
                href="/croqui"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/croqui") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Croqui
              </Link>
              <Link
                href="/ranking"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/ranking") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ranking
              </Link>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Sair
          </button>
        </div>
      </div>
      {/* Menu mobile (opcional, pode ser simplificado) */}
      <div className="md:hidden flex justify-around py-2 border-t">
        <Link href="/" className="text-gray-700">🏠</Link>
        <Link href="/croqui" className="text-gray-700">🗺️</Link>
        <Link href="/ranking" className="text-gray-700">🏆</Link>
      </div>
    </nav>
  );
}