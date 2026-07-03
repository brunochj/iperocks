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

    const loadData = async () => {
      try {
        const res = await apiFetch("/api/my-ascents");
        const data = await res.json();
        setAscents(data.ascents || []);
        setGrades(data.grades || []);
      } catch (error) {
        console.error("Erro ao carregar ascensões:", error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user]);

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
