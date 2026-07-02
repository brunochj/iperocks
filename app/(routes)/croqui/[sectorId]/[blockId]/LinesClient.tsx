"use client";
import { useState, useMemo, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { apiFetch } from "@/lib/api-fetch";
import ConfirmModal from "@/app/components/ConfirmModal";
import ImageModal from "@/app/components/ImageModal";

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
  console.log("userAscents recebido:", userAscents); // no início do componente
  const { user } = useUser();
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

  // Determinar se a linha pode ser desmarcada (sem avaliação)
  const canUnmark = (lineId: string) => {
    // const ascent = userAscents.find((a: any) => a.lineId === lineId);
    // console.log("canUnmark check:", { lineId, ascent, hasAscent: !!ascent, rating: ascent?.rating, gradeSuggestion: ascent?.gradeSuggestion });
    // return ascent && !ascent.rating && !ascent.gradeSuggestion;
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
    const res = await apiFetch("/api/ascent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId }),
    });
    if (res.ok) {
      setAscending((prev) => ({ ...prev, [lineId]: true }));
      setShowReviewForm(lineId);
    } else {
      alert("Erro ao registrar ascensão");
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
    const res = await apiFetch("/api/ascent/review", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId, rating, gradeSuggestion }),
    });
    if (res.ok) {
      setShowReviewForm(null);
      window.location.reload();
    } else {
      alert("Erro ao salvar avaliação");
    }
  };

  const handleRemoveAscent = (lineId: string) => {
    if (!canUnmark(lineId)) return;
    setModalState({ isOpen: true, lineId });
  };

  const confirmRemove = async () => {
    const lineId = modalState.lineId!;
    setLoading((prev) => ({ ...prev, [lineId]: true }));
    const res = await apiFetch(`/api/ascent?lineId=${lineId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAscending((prev) => ({ ...prev, [lineId]: false }));
      window.location.reload();
    } else {
      alert("Erro ao remover ascensão");
    }
    setLoading((prev) => ({ ...prev, [lineId]: false }));
    setModalState({ isOpen: false, lineId: null });
  };

  const toggleExpand = (lineId: string) => {
    setExpandedLineId((prev) => (prev === lineId ? null : lineId));
  };

  const renderAlerts = (lineId: string) => {
    const types = alertsByLine[lineId] || [];
    if (types.includes("FALL_RISK")) {
      return (
        <span className="text-red-600 ml-2" title="Risco de queda">
          ⚠️
        </span>
      );
    }
    return null;
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

      {/* Filtro e ordenação (mesmo código) */}
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
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {line.name}
                      </h3>
                      {renderAlerts(line.id)}
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
                // <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                //   {hasImage && (
                //     <div className="mb-4">
                //       <img
                //         src={line.imageUrl ?? undefined}
                //         alt={line.name}
                //         className="w-full max-h-96 object-contain rounded-lg"
                //       />
                //     </div>
                //   )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {hasImage && (
                    <div
                      className="mb-4 cursor-pointer"
                      onClick={() => setSelectedImage(line.imageUrl)}
                    >
                      <img
                        src={line.imageUrl}
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

                  {/* ⭐ LEGENDA DA ESTRELA SELECIONADA */}
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

      {/* Modal de confirmação genérico */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title="Desmarcar boulder"
        message="Tem certeza que quer desmarcar este boulder? Você só pode desmarcar se ainda não tiver avaliado."
        confirmText="Sim, desmarcar"
        cancelText="Cancelar"
        onConfirm={confirmRemove}
        onCancel={() => setModalState({ isOpen: false, lineId: null })}
      />
    </div>
  );
}
