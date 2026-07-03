"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import BackButton from "@/app/components/back-button";
import { apiFetch } from "@/lib/api-fetch";
import { navigateTo } from "@/lib/navigate";
import { Skeleton, SkeletonRanking } from "@/app/components/Skeleton";

export default function RankingPage() {
  const { user, loading } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigateTo("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await apiFetch("/api/ranking");
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentUserRank(data.currentUserRank || null);
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, []);

  if (loading || !dataReady) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <SkeletonRanking items={8} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Ranking de Escaladores
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Classificação por número de vias concluídas.
      </p>

      {users.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum usuário registrou ascensões ainda.
        </p>
      )}

      <div className="space-y-2">
        {users.map((u, idx) => (
          <div
            key={u.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              user?.id === u.id
                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                : "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-500 dark:text-gray-400 w-8">
                #{idx + 1}
              </span>
              {u.image && (
                <img
                  src={u.image}
                  alt={u.name || ""}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {u.name || u.username || "Anônimo"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {u.ascents ?? u._count?.ascents}{" "}
                  {(u.ascents ?? u._count?.ascents) === 1 ? "via" : "vias"}
                </p>
              </div>
            </div>
            {user?.id === u.id && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Você
              </span>
            )}
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 50 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sua posição atual: #{currentUserRank} com{" "}
            {users.find((u) => u.id === user?.id)?.ascents ??
              users.find((u) => u.id === user?.id)?._count?.ascents}{" "}
            vias.
          </p>
        </div>
      )}
    </div>
  );
}
