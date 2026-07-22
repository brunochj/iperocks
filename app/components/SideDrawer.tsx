"use client";
import { useState, useEffect, useRef } from "react";
import { signOutUser } from "@/lib/auth/logout";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "./ThemeProvider";
import { apiFetch } from "@/lib/api-fetch";

type SideDrawerProps = {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function SideDrawer({
  userName,
  isOpen,
  onClose,
}: SideDrawerProps) {
  const { theme, toggleTheme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Buscar contagem de alertas ativos quando o drawer abrir
  useEffect(() => {
    if (!isOpen) return;
    const fetchAlertCount = async () => {
      setLoadingCount(true);
      try {
        // Rota que retorna o total de alertas não resolvidos
        const res = await apiFetch("/api/alerts/count");
        const data = await res.json();
        setAlertCount(data.count ?? 0);
      } catch (error) {
        console.error("Erro ao buscar contagem de alertas:", error);
        setAlertCount(0);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchAlertCount();
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
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

  // Função para obter o texto do badge de alertas
  const getAlertBadge = () => {
    if (loadingCount) return "…";
    if (alertCount === null) return "0";
    if (alertCount === 0) return "0";
    if (alertCount > 99) return "99+";
    return String(alertCount);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
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
          {/* 🔔 ALERTAS COM BADGE */}
          <li>
            <Link
              href="/alerts"
              onClick={onClose}
              className="flex items-center gap-4 py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              <span className="material-symbols-outlined">report</span> Alertas
              {alertCount !== null && alertCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {getAlertBadge()}
                </span>
              )}
            </Link>
          </li>
          <li>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-4 w-full text-left py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
            >
              {theme === "light" ? <><span className="material-symbols-outlined">dark_mode</span> Modo escuro</> : <><span className="material-symbols-outlined">light_mode</span> Modo claro</>}
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                void signOutUser();
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