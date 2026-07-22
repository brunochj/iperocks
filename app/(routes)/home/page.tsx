"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { navigateTo, isCurrentPath } from "@/lib/navigate";
import AppLink from "@/app/components/AppLink";
import GradeChart from "@/app/components/GradeChart";
import CollapsibleCard from "@/app/components/CollapsibleCard";
import InfoCard from "@/app/components/InfoCard";
import { apiFetch } from "@/lib/api-fetch";
import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonRanking,
  SkeletonAscents,
} from "@/app/components/Skeleton";
import Link from "next/link";

const alertTypeLabels: Record<string, string> = {
  NEST: "🐦 Ninho de pássaro",
  BROKEN_HOLD: "💔 Agarra quebrada",
  FALL_RISK: "⚠️ Risco de queda",
  NO_ACCESS: "🚧 Sem acesso",
};

export default function HomePage() {
  const { user, loading } = useUser();
  const [chartData, setChartData] = useState<any[]>([]);
  const [top5, setTop5] = useState<any[]>([]);
  const [userRankPosition, setUserRankPosition] = useState<number | null>(null);
  const [userTotalAscents, setUserTotalAscents] = useState(0);
  const [lastAscents, setLastAscents] = useState<any[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const timeout = window.setTimeout(() => {
        if (!isCurrentPath("/login")) {
          navigateTo("/login");
        }
      }, 600);
      return () => window.clearTimeout(timeout);
    }

    if (!user.rulesAccepted && !isCurrentPath("/onboarding")) {
      navigateTo("/onboarding");
    }
  }, [user, loading]);

  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.rulesAccepted) return;

    let cancelled = false;
    const controller = new AbortController();
    // Render free tier cold-starts can take 30-60s
    const timeout = window.setTimeout(() => controller.abort(), 60000);

    const loadData = async () => {
      try {
        const res = await apiFetch("/api/home", { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const alertsRes = await apiFetch("/api/alerts?limit=5&page=1");
        const alertsData = await alertsRes.json();
        const data = await res.json();
        if (cancelled) return;

        setChartData(data.chartData ?? []);
        setTop5(data.top5 ?? []);
        setUserRankPosition(data.userRankPosition ?? null);
        setUserTotalAscents(data.userTotalAscents ?? 0);
        setLastAscents(data.lastAscents ?? []);
        setRecentAlerts(alertsData.alerts || []);
      } catch (error) {
        // Ignore AbortError from cleanup or navigation
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Erro ao carregar dados da home:", error);
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setDataReady(true);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [user?.id, user?.rulesAccepted]);

  if (loading || !dataReady) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <SkeletonCard>
          <SkeletonChart />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonRanking items={5} />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonAscents items={5} />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonAscents items={5} />
        </SkeletonCard>
      </div>
    );
  }

  if (!user || !user.rulesAccepted) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <CollapsibleCard title="Mandou quantos?">
        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma cadena registrada. Vá ao{" "}
            <AppLink href="/croqui" className="text-indigo-500">
              croqui
            </AppLink>{" "}
            e comece!
          </p>
        ) : (
          <GradeChart data={chartData} />
        )}
      </CollapsibleCard>

      <CollapsibleCard title="Ranking Geral" defaultExpanded={false}>
        <AppLink
          href="/ranking"
          className="text-sm text-gray-500 dark:text-gray-400 pb-4 block"
        >
          Ver Ranking Geral
        </AppLink>
        <div className="space-y-2">
          {top5.length === 0 ? (
            <p className="text-sm text-gray-500">Ranking disponível online.</p>
          ) : (
            top5.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-6">
                    #{idx + 1}
                  </span>
                  <span>{u.name || u.username}</span>
                </div>
                <span className="text-gray-600">
                  {u._count?.ascents ?? u.ascents ?? 0} vias
                </span>
              </div>
            ))
          )}
          {userRankPosition !== null && userRankPosition > 5 && (
            <>
              <div className="text-center text-gray-400">...</div>
              <div className="flex items-center justify-between bg-indigo-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-600 w-6">
                    #{userRankPosition}
                  </span>
                  <span className="font-medium">Você</span>
                </div>
                <span className="text-gray-600">{userTotalAscents} vias</span>
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Últimas cadenas" defaultExpanded={false}>
        <AppLink
          href="/my-ascents"
          className="text-sm text-gray-500 dark:text-gray-400 pb-4 block"
        >
          Ver todas as cadenas
        </AppLink>
        {lastAscents.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum boulder mandado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {lastAscents.map((ascent) => (
              <li
                key={ascent.id}
                className="flex justify-between items-center border-b pb-1"
              >
                <div>
                  <span className="font-medium">{ascent.lineName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {ascent.grade}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(ascent.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleCard>

      <CollapsibleCard title="Alertas recentes" defaultExpanded={false}>
        <AppLink
          href="/alerts"
          className="text-sm text-gray-500 dark:text-gray-400 pb-4 block"
        >
          Ver todos os alertas
        </AppLink>
        {recentAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum alerta ainda.</p>
        ) : (
          <ul className="space-y-2">
            {recentAlerts.map((alert) => (
              <li
                key={alert.id}
                className="flex justify-between items-center border-b pb-1"
              >
                <div className="flex items-center gap-2 justify-between w-full">
                  <span className="font-medium">{alert.line.name}</span>

                  <span className="text-xs text-gray-500 ml-2">
                    {alertTypeLabels[alert.type] ?? alert.type}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/croqui"
          className="block text-center text-sm text-indigo-600 hover:underline dark:text-indigo-400 mt-3"
        >
          Encontrou um problema? Reporte no croqui →
        </Link>
      </CollapsibleCard>

      <InfoCard />
    </div>
  );
}
