"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyAscentsClient from "./MyAscentsClient";
import { apiFetch } from "@/lib/api-fetch";
import {
  Skeleton,
  SkeletonCard,
  SkeletonAscents,
} from "@/app/components/Skeleton";
import { Capacitor } from "@capacitor/core";

export default function MyAscentsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [ascents, setAscents] = useState<any[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        const res = await apiFetch("/api/my-ascents");
        const data = await res.json();
        if (!cancelled) {
          setAscents(data.ascents || []);
          setGrades(data.grades || []);
        }
      } catch (error) {
        console.error("Erro ao carregar ascensões, tentando dados locais:", error);
        if (Capacitor.isNativePlatform()) {
          try {
            const { getAscentsByUserWithDetails, getDistinctGradesFromAscents } = await import("@/lib/sqlite");
            const localAscents = await getAscentsByUserWithDetails(user.id);
            const localGrades = await getDistinctGradesFromAscents(user.id);
            if (!cancelled) {
              setAscents(localAscents.map((a: any) => ({
                id: a.id,
                lineId: a.lineId,
                lineName: a.lineName,
                grade: a.grade,
                imageUrl: a.imageUrl || null,
                completedAt: a.createdAt,
                rating: a.rating || null,
                gradeSuggestion: a.gradeSuggestion || null,
                sectorId: a.sectorId,
                blockId: a.blockId,
              })));
              setGrades(localGrades);
            }
          } catch (sqliteError) {
            console.error("Erro ao carregar dados locais:", sqliteError);
          }
        }
      } finally {
        if (!cancelled) setDataReady(true);
      }
    };

    void loadData();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading || !dataReady) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <SkeletonCard>
          <SkeletonAscents items={5} />
        </SkeletonCard>
      </div>
    );
  }
  if (!user) return null;

  return <MyAscentsClient ascents={ascents} grades={grades} />;
}
