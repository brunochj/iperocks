'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import Image from "next/image";
import { Skeleton, SkeletonCard, SkeletonText } from "@/app/components/Skeleton";

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const res = await apiFetch("/api/profile");
        const data = await res.json();
        setProfileData(data);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingData(false);
      }
    };

    void loadData();
  }, [user]);

  // --- SKELETON ---
  if (loading || loadingData) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <SkeletonCard>
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonText lines={3} />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonText lines={3} />
        </SkeletonCard>
      </div>
    );
  }

  if (!user || !profileData) return null;

  const { user: userInfo, stats, lastAscents } = profileData;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Cabeçalho do perfil */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          {userInfo.image ? (
            <img
              src={userInfo.image}
              alt={userInfo.name || ""}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-2xl">
              {userInfo.name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userInfo.name || "Usuário"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">@{userInfo.username || userInfo.email}</p>
            {userInfo.bio && (
              <p className="text-gray-600 dark:text-gray-300 mt-1">{userInfo.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estatísticas
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalAscents}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vias completadas</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.hardestGrade || "-"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Grau mais difícil</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalFlashes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Flash</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalProjects}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Projetos</p>
          </div>
        </div>
      </div>

      {/* Últimas ascensões */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Últimas ascensões
        </h2>
        {lastAscents.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma via completada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {lastAscents.map((ascent: any) => (
              <li key={ascent.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{ascent.lineName}</span>
                  <span className="text-xs text-gray-500 ml-2">{ascent.grade}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(ascent.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}