"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import SideDrawer from "./SideDrawer";
import { useTheme } from "./ThemeProvider";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const userName = user?.user_metadata?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/home" className="flex items-center">
            <Image
              src={theme === "dark" ? "/iperocks_logo_white.svg" : "/iperocks_logo.svg"}
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
            <Bars3Icon className="size-6 text-gray-700 dark:text-gray-300" onClick={() => setIsDrawerOpen(true)}/>
            {/* <button 
              onClick={() => setIsDrawerOpen(true)}
              className="relative text-xl hover:opacity-70 transition" 
              aria-label="Notificações"
            >
              🔔
            </button> */}
            {/* <ThemeToggle /> */}
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
