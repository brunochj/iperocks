"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { apiFetch } from "@/lib/api-fetch";
import { enqueueAndSync } from "@/lib/offline/sync";
import { isOnline } from "@/lib/offline/connectivity";
import ConfirmModal from "@/app/components/ConfirmModal";
import ImageModal from "@/app/components/ImageModal";
import AlertPopover from "@/app/components/AlertPopover";
import AddAlertModal from "@/app/components/AddAlertModal";

type Line = {
  id: string;
  name: string;
  grade: string;
  description?: string | null;
  imageUrl?: string | null;
};

type LinesClientProps = {
  blockName: string;
  blockDescription: string;
  lines: Line[];
  ascendedIds: Set<string>;
  grades: string[];
  alertsByLine: Record<string, string[]>;
  ratingMap?: Record<string, number>;
  gradeSuggestionMap?: Record<string, string>;
  expandLineId?: string | null;
  userAscents?: Array<{
    lineId: string;
    rating?: number | null;
    gradeSuggestion?: string | null;
  }>;
};

export default function LinesClient({
  blockName,
  blockDescription,
  lines,
  ascendedIds,
  grades,
  alertsByLine,
  ratingMap = {},
  gradeSuggestionMap = {},
  expandLineId = null,
  userAscents = [],
}: LinesClientProps) {
  const { user } = useUser();
  const router = useRouter();
  const [expandedLineId, setExpandedLineId] = useState<string | null>(
    expandLineId,
  );
  const [filterGrade, setFilterGrade] = useState("");
  const [sortBy, setSortBy] = useState<"grade-asc" | "grade-desc" | "name-asc">(
    "grade-asc",
  );
  const [ascending, setAscending] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      lines.map((line) => [line.id, ascendedIds.has(line.id)]),
    ),
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState<Record<string, number>>({});
  const [tempGradeSuggestion, setTempGradeSuggestion] = useState<
    Record<string, string>
  >({});
  const [ratingError, setRatingError] = useState<Record<string, string>>({});
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    lineId: string | null;
  }>({
    isOpen: false,
    lineId: null,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Alert Popover ---
  const [alertPopover, setAlertPopover] = useState<{
    open: boolean;
    lineId: string | null;
  }>({ open: false, lineId: null });
  const [lineAlerts, setLineAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  // --- Add Alert Modal ---
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertLineId, setAlertLineId] = useState<string>("");
  // Buscar alertas da linha quando o popover abrir
  useEffect(() => {
    if (!alertPopover.open || !alertPopover.lineId) {
      setLineAlerts([]);
      return;
    }
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const res = await apiFetch(`/api/alerts/line/${alertPopover.lineId}`);
        const data = await res.json();
        setLineAlerts(data.alerts || []);
      } catch (error) {
        console.error("Erro ao buscar alertas:", error);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, [alertPopover.open, alertPopover.lineId]);

  const handleResolveAlert = async (alertId: string) => {
    const res = await apiFetch(`/api/alerts/${alertId}`, { method: "PATCH" });
    if (res.ok) {
      setLineAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } else {
      alert("Erro ao resolver alerta");
    }
  };

  const openAlertPopover = (lineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertPopover({ open: true, lineId });
  };

  const closeAlertPopover = () => {
    setAlertPopover({ open: false, lineId: null });
  };

  // --- Fim Alert Popover ---

  // Determinar se a linha pode ser desmarcada (sem avaliação)
  const canUnmark = (lineId: string) => {
    if (!ascending[lineId]) return false;
    if (showReviewForm === lineId) return true;
    const ascent = userAscents.find((a: any) => a.lineId === lineId);
    return !ascent || (!ascent.rating && !ascent.gradeSuggestion);
  };

  useEffect(() => {
    if (expandLineId) {
      setExpandedLineId(expandLineId);
      setTimeout(() => {
        const element = document.getElementById(`line-${expandLineId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [expandLineId]);

  const getGradeValue = (grade: string): number => {
    if (grade === "P") return 999;
    const match = grade.match(/V(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const sortedLines = useMemo(() => {
    let filtered = lines;
    if (filterGrade)
      filtered = lines.filter((line) => line.grade === filterGrade);
    if (sortBy === "grade-asc")
      return [...filtered].sort(
        (a, b) => getGradeValue(a.grade) - getGradeValue(b.grade),
      );
    if (sortBy === "grade-desc")
      return [...filtered].sort(
        (a, b) => getGradeValue(b.grade) - getGradeValue(a.grade),
      );
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [lines, filterGrade, sortBy]);

  const handleAscent = async (lineId: string) => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, [lineId]: true }));

    // Optimistic update
    setAscending((prev) => ({ ...prev, [lineId]: true }));

    if (isOnline()) {
      try {
        const res = await apiFetch("/api/ascent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId }),
        });
        if (res.ok) {
          setShowReviewForm(lineId);
        } else {
          // API failed, queue for later
          await enqueueAndSync({
            endpoint: "/api/ascent",
            method: "POST",
            body: { lineId },
          });
          setShowReviewForm(lineId);
        }
      } catch {
        await enqueueAndSync({
          endpoint: "/api/ascent",
          method: "POST",
          body: { lineId },
        });
        setShowReviewForm(lineId);
      }
    } else {
      // Offline: queue for later sync
      await enqueueAndSync({
        endpoint: "/api/ascent",
        method: "POST",
        body: { lineId },
      });
      setShowReviewForm(lineId);
    }

    setLoading((prev) => ({ ...prev, [lineId]: false }));
  };

  const submitReview = async (lineId: string) => {
    const rating = tempRating[lineId];
    if (!rating) {
      setRatingError((prev) => ({
        ...prev,
        [lineId]: "Selecione uma nota de 1 a 5 estrelas",
      }));
      return;
    }
    setRatingError((prev) => ({ ...prev, [lineId]: "" }));
    const gradeSuggestion = tempGradeSuggestion[lineId] || null;

    if (isOnline()) {
      try {
        const res = await apiFetch("/api/ascent/review", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId, rating, gradeSuggestion }),
        });
        if (res.ok) {
          setShowReviewForm(null);
          window.location.reload();
          return;
        }
      } catch {
        // Fall through to queue
      }
    }

    // Offline or API failed: queue for later
    await enqueueAndSync({
      endpoint: "/api/ascent/review",
      method: "PUT",
      body: { lineId, rating, gradeSuggestion },
    });
    setShowReviewForm(null);
    window.location.reload();
  };

  const handleRemoveAscent = (lineId: string) => {
    if (!canUnmark(lineId)) return;
    setModalState({ isOpen: true, lineId });
  };

  const confirmRemove = async () => {
    const lineId = modalState.lineId!;
    setLoading((prev) => ({ ...prev, [lineId]: true }));

    // Optimistic update
    setAscending((prev) => ({ ...prev, [lineId]: false }));

    if (isOnline()) {
      try {
        const res = await apiFetch(`/api/ascent?lineId=${lineId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          window.location.reload();
          setModalState({ isOpen: false, lineId: null });
          setLoading((prev) => ({ ...prev, [lineId]: false }));
          return;
        }
      } catch {
        // Fall through to queue
      }
    }

    // Offline or API failed: queue for later
    await enqueueAndSync({
      endpoint: `/api/ascent?lineId=${lineId}`,
      method: "DELETE",
      body: null,
    });
    window.location.reload();
    setModalState({ isOpen: false, lineId: null });
    setLoading((prev) => ({ ...prev, [lineId]: false }));
  };

  const toggleExpand = (lineId: string) => {
    setExpandedLineId((prev) => (prev === lineId ? null : lineId));
  };

  const gradeOptions = [
    "V0",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
  ];

  const starLabels: Record<number, string> = {
    1: "Ok",
    2: "Legal",
    3: "Clássico do bloco",
    4: "Clássico de Iperocks",
    5: "Clássico mundial",
  };

  // Mapeamento de tipos de alerta para ícones/cores
  const alertTypeConfig: Record<
    string,
    { label: string; icon: string; color: string }
  > = {
    FALL_RISK: { label: "Risco de queda", icon: "⚠️", color: "text-red-600" },
    BROKEN_HOLD: {
      label: "Agarra quebrada",
      icon: "💔",
      color: "text-orange-500",
    },
    NEST: { label: "Ninho", icon: "🐦", color: "text-yellow-600" },
    NO_ACCESS: { label: "Sem acesso", icon: "🚧", color: "text-gray-500" },
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {blockName}
      </h1>
      {blockDescription && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {blockDescription}
        </p>
      )}

      {/* Filtro e ordenação */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtrar por grau
        </label>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="">Todos</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy("grade-asc")}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === "grade-asc"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Grau ▲
        </button>
        <button
          onClick={() => setSortBy("grade-desc")}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === "grade-desc"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Grau ▼
        </button>
        <button
          onClick={() => setSortBy("name-asc")}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === "name-asc"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Nome A-Z
        </button>
      </div>

      <div className="space-y-4">
        {sortedLines.map((line) => {
          const isExpanded = expandedLineId === line.id;
          const hasImage = !!line.imageUrl;
          const alertCount = alertsByLine[line.id]?.length || 0;

          return (
            <div
              key={line.id}
              id={`line-${line.id}`}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 transition-all cursor-pointer ${
                isExpanded
                  ? "ring-2 ring-blue-400"
                  : "hover:shadow-md dark:hover:shadow-gray-900"
              }`}
              onClick={() => toggleExpand(line.id)}
            >
              <div className="flex items-start gap-4">
                {hasImage && (
                  <img
                    src={line.imageUrl ?? undefined}
                    alt={line.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {line.name}
                      </h3>
                      {ratingMap[line.id] && ratingMap[line.id] > 3 && (
                        <span
                          className="material-symbols-outlined text-yellow-500 text-xl"
                          style={{ fontSize: "20px" }}
                          title={`Avaliação média: ${ratingMap[line.id].toFixed(
                            1,
                          )}`}
                        >
                          crown
                        </span>
                      )}
                      {/* Ícone de alerta com contagem e popover */}
                      {/* Botão único de alerta + reportar */}
                      <div className="relative inline-block">
                        <button
                          className="text-red-600 text-sm font-medium flex items-center gap-0.5 hover:underline"
                          onClick={(e) => openAlertPopover(line.id, e)}
                        >
                          🚨 {alertCount}
                        </button>
                        {alertPopover.open &&
                          alertPopover.lineId === line.id && (
                            <div
                              className="absolute z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 w-72 max-h-60 overflow-auto border dark:border-gray-700 -translate-x-1/2 left-1/2 top-full mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-sm dark:text-white">
                                  Alertas
                                </span>
                                <button
                                  className="text-xs text-indigo-600 hover:underline"
                                  onClick={() => {
                                    closeAlertPopover();
                                    router.push(`/alerts?lineId=${line.id}`);
                                  }}
                                >
                                  Ver todos
                                </button>
                              </div>
                              {loadingAlerts ? (
                                <p className="text-sm text-gray-500">
                                  Carregando...
                                </p>
                              ) : lineAlerts.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  Nenhum alerta ativo
                                </p>
                              ) : (
                                <ul className="space-y-2">
                                  {lineAlerts.map((alert) => {
                                    const config = alertTypeConfig[
                                      alert.type
                                    ] || {
                                      label: alert.type,
                                      icon: "📌",
                                      color: "text-gray-600",
                                    };
                                    return (
                                      <li
                                        key={alert.id}
                                        className="flex justify-between items-start text-sm border-b dark:border-gray-700 pb-1"
                                      >
                                        <div>
                                          <p
                                            className={`font-medium ${config.color}`}
                                          >
                                            {config.icon} {config.label}
                                          </p>
                                          {alert.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {alert.description}
                                            </p>
                                          )}
                                          <p className="text-xs text-gray-400 mt-0.5">
                                            {alert.user?.name ||
                                              alert.user?.username ||
                                              "Anônimo"}{" "}
                                            •{" "}
                                            {new Date(
                                              alert.createdAt,
                                            ).toLocaleDateString("pt-BR")}
                                          </p>
                                        </div>
                                        <button
                                          onClick={async () => {
                                            await handleResolveAlert(alert.id);
                                          }}
                                          className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs"
                                        >
                                          Resolver
                                        </button>
                                      </li>
                                    );
                                  })}
                                  {lineAlerts.length > 5 && (
                                    <li className="text-xs text-gray-400 text-center">
                                      + {lineAlerts.length - 5} mais
                                    </li>
                                  )}
                                </ul>
                              )}
                              {/* Opção de reportar novo alerta */}
                              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <button
                                  className="w-full text-left text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
                                  onClick={() => {
                                    closeAlertPopover();
                                    setAlertLineId(line.id);
                                    setAlertModalOpen(true);
                                  }}
                                >
                                  📌 Reportar problema
                                </button>
                              </div>
                            </div>
                          )}
                      </div>{" "}
                    </div>
                    {ascending[line.id] ? (
                      canUnmark(line.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAscent(line.id);
                          }}
                          disabled={loading[line.id]}
                          className="text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
                        >
                          {loading[line.id] ? "..." : "🗑️ Desfazer"}
                        </button>
                      ) : (
                        <span
                          className="text-green-600 text-sm"
                          title="Já avaliado"
                        >
                          ✓ Avaliado
                        </span>
                      )
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAscent(line.id);
                        }}
                        disabled={loading[line.id]}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        {loading[line.id] ? "..." : "Completei"}
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                      {line.grade}
                    </span>
                    {ratingMap[line.id] && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ★ {ratingMap[line.id].toFixed(1)}
                      </span>
                    )}
                    {gradeSuggestionMap[line.id] && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Sugestão: {gradeSuggestionMap[line.id]}
                      </span>
                    )}
                  </div>
                  {line.description && !isExpanded && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                      {line.description}
                    </p>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {hasImage && (
                    <div
                      className="mb-4 cursor-pointer"
                      onClick={() => setSelectedImage(line.imageUrl ?? null)}
                    >
                      <img
                        src={line.imageUrl ?? undefined}
                        alt={line.name}
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      Descrição
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {line.description || "Nenhuma descrição fornecida."}
                    </p>
                  </div>
                </div>
              )}

              {showReviewForm === line.id && (
                <div
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-sm font-medium mb-2 dark:text-white">
                    Avalie esta linha
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          setTempRating((prev) => ({
                            ...prev,
                            [line.id]: star,
                          }));
                          setRatingError((prev) => ({
                            ...prev,
                            [line.id]: "",
                          }));
                        }}
                      >
                        <span
                          className={
                            star <= (tempRating[line.id] || 0)
                              ? "text-yellow-500 text-xl"
                              : "text-gray-300 text-xl"
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>

                  {tempRating[line.id] && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {
                        starLabels[
                          tempRating[line.id] as keyof typeof starLabels
                        ]
                      }
                    </p>
                  )}

                  {ratingError[line.id] && (
                    <p className="text-red-500 text-xs mb-2">
                      {ratingError[line.id]}
                    </p>
                  )}
                  <select
                    value={tempGradeSuggestion[line.id] || ""}
                    onChange={(e) =>
                      setTempGradeSuggestion((prev) => ({
                        ...prev,
                        [line.id]: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 rounded p-1 text-sm w-full bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sugerir grau (opcional)</option>
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => submitReview(line.id)}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Salvar avaliação
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="Imagem da linha"
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        title="Desmarcar boulder"
        message="Tem certeza que quer desmarcar este boulder? Você só pode desmarcar se ainda não tiver avaliado."
        confirmText="Sim, desmarcar"
        cancelText="Cancelar"
        onConfirm={confirmRemove}
        onCancel={() => setModalState({ isOpen: false, lineId: null })}
      />

      <AddAlertModal
        isOpen={alertModalOpen}
        lineId={alertLineId}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertLineId("");
        }}
        onSuccess={() => {
          setAlertModalOpen(false);
          setAlertLineId("");
          // Recarregar a página para atualizar os alertas
          window.location.reload();
        }}
      />
    </div>
  );
}
