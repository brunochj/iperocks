// components/SideDrawer.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";

type SideDrawerProps = {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function SideDrawer({ userName, isOpen, onClose }: SideDrawerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <>
      {/* Backdrop com animação de fade */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer com animação de deslize */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 p-4 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold dark:text-white">Menu</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="mb-4 border-b pb-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Olá,</p>
          <p className="font-medium dark:text-white">{userName}</p>
        </div>
        <ul className="space-y-2">
          <li>
            <Link
              href="/profile"
              onClick={onClose}
              className="block py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              Meu Perfil
            </Link>
          </li>
          <li>
            <Link
              href="/my-ascents"
              onClick={onClose}
              className="block py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              Minhas Ascensões
            </Link>
          </li>
          <li>
            <button
              onClick={toggleTheme}
              className="block w-full text-left py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              {theme === "light" ? "🌙 Modo escuro" : "☀️ Modo claro"}
            </button>
          </li>
          <li>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="block w-full text-left py-2 px-3 rounded text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sair
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}