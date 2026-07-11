"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  NEST: "🐦 Ninho de pássaro",
  BROKEN_HOLD: "💔 Agarra quebrada",
  FALL_RISK: "⚠️ Risco de queda",
  NO_ACCESS: "🚧 Sem acesso",
};

const typeColors: Record<string, string> = {
  NEST: "text-yellow-600",
  BROKEN_HOLD: "text-orange-500",
  FALL_RISK: "text-red-600",
  NO_ACCESS: "text-gray-500",
};

export default function AlertsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterLineId, setFilterLineId] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [filterBlockId, setFilterBlockId] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Capturar parâmetros da URL (ex: ?lineId=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lineId = params.get("lineId");
      if (lineId) setFilterLineId(lineId);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadBlocks = async () => {
      const res = await apiFetch("/api/blocks");
      const data = await res.json();
      setBlocks(data.blocks || []);
    };
    loadBlocks();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadAlerts = async () => {
      setLoadingData(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          resolved: "false",
        });
        if (filterType) params.append("type", filterType);
        if (filterLineId) params.append("lineId", filterLineId);
        if (filterBlockId) params.append("blockId", filterBlockId);

        const res = await apiFetch(`/api/alerts?${params}`);
        const data = await res.json();
        setAlerts(data.alerts || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (error) {
        console.error("Erro ao carregar alertas:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadAlerts();
  }, [user, page, filterType, filterLineId, filterBlockId]);

  const handleResolve = async (alertId: string) => {
    if (!confirm("Marcar este alerta como resolvido?")) return;
    try {
      const res = await apiFetch(`/api/alerts/${alertId}`, { method: "PATCH" });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        // Atualizar a contagem da página se necessário
      } else {
        alert("Erro ao resolver alerta");
      }
    } catch (error) {
      console.error("Erro ao resolver:", error);
    }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterLineId("");
    setPage(1);
    router.push("/alerts");
  };

  if (loading || loadingData) {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Alertas ativos
        </h1>
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Voltar
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
        value={filterBlockId}
        onChange={(e) => {
          setFilterBlockId(e.target.value);
          setPage(1);
        }}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
      >
        <option value="">Todos os blocos</option>
        {blocks.map((block) => (
          <option key={block.id} value={block.id}>
            {block.name} ({block.sector?.name})
          </option>
        ))}
      </select>

        {filterLineId && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Filtrado por linha
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {alerts.length === 0 && !filterType && !filterLineId && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum alerta ativo no momento.
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const colorClass = typeColors[alert.type] || "text-gray-600";
          const label = typeLabels[alert.type] || alert.type;

          return (
            <div
              key={alert.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-semibold ${colorClass}`}>
                    {label}
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      #{alert.id.slice(0, 8)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Linha:{" "}
                    {alert.line?.block?.sectorId && alert.line?.block?.id ? (
                      <Link
                        href={`/croqui/${alert.line.block.sectorId}/${alert.line.block.id}?expandLine=${alert.line.id}`}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {alert.line?.name || "Linha não encontrada"}
                      </Link>
                    ) : (
                      <span>{alert.line?.name || "Linha não encontrada"}</span>
                    )}
                    {alert.line?.block?.name && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({alert.line.block.name})
                      </span>
                    )}
                  </p>
                  {alert.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {alert.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Reportado por{" "}
                    {alert.user?.name || alert.user?.username || "Anônimo"} •{" "}
                    {new Date(alert.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  Resolver
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Próxima
          </button>
        </div>
      )}
      

      <div className="mt-6 text-center">
        <Link
          href="/croqui"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Reportar novo problema →
        </Link>
      </div>
    </div>
  );
}
