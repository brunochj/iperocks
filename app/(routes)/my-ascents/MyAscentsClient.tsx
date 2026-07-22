"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { CachedImage } from "@/hooks/useCachedImage";
import { apiFetch } from "@/lib/api-fetch";
import { enqueueAndSync } from "@/lib/offline/sync";
import { isOnline } from "@/lib/offline/connectivity";

const gradeOptions = [
  "V0","V1","V2","V3","V4","V5","V6","V7","V8","V9",
  "V10","V11","V12","V13","V14","V15","V16","V17","Projeto",
];

export default function MyAscentsClient({
  ascents,
  grades,
}: {
  ascents: any[];
  grades: string[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "grade-asc" | "grade-desc" | "name-asc"
  >("date-desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editGradeSuggestion, setEditGradeSuggestion] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openEdit = (ascent: any) => {
    setEditingId(ascent.id);
    setEditRating(ascent.rating || 0);
    setEditGradeSuggestion(ascent.gradeSuggestion || "");
    const date = new Date(ascent.completedAt);
    setEditDate(date.toISOString().split("T")[0]);
  };

  const saveEdit = async (ascent: any) => {
    setSaving(true);
    const body: Record<string, any> = {
      lineId: ascent.lineId,
      rating: editRating > 0 ? editRating : null,
      gradeSuggestion: editGradeSuggestion || null,
    };
    if (editDate) {
      body.completedAt = new Date(editDate + "T12:00:00").toISOString();
    }

    console.log("[saveEdit] body:", body);

    try {
      if (isOnline()) {
        const res = await apiFetch("/api/ascent/review", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        console.log("[saveEdit] response:", res.status, json);
        if (res.ok) {
          window.location.reload();
          return;
        }
        setSaving(false);
        return;
      }

      await enqueueAndSync({
        endpoint: "/api/ascent/review",
        method: "PUT",
        body,
      });
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar ascensão:", error);
      setSaving(false);
    }
  };

  const getGradeValue = (grade: string): number => {
    if (grade === "Projeto") return 999;
    const match = grade.match(/V(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const filteredAscents = useMemo(() => {
    let filtered = ascents;

    if (searchTerm.trim()) {
      filtered = filtered.filter((a) =>
        a.lineName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterGrade) {
      filtered = filtered.filter((a) => a.grade === filterGrade);
    }

    if (sortBy === "date-desc") {
      filtered.sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );
    } else if (sortBy === "grade-asc") {
      filtered.sort((a, b) => getGradeValue(a.grade) - getGradeValue(b.grade));
    } else if (sortBy === "grade-desc") {
      filtered.sort((a, b) => getGradeValue(b.grade) - getGradeValue(a.grade));
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.lineName.localeCompare(b.lineName));
    }

    return filtered;
  }, [ascents, searchTerm, filterGrade, sortBy]);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Minhas Ascensões
        </h1>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome da linha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Todos os graus</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="date-desc">Mais recentes</option>
          <option value="grade-asc">Grau (menor → maior)</option>
          <option value="grade-desc">Grau (maior → menor)</option>
          <option value="name-asc">Nome (A → Z)</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link
            href="/croqui"
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Registrar cadena
          </Link>
        </div>
        {filteredAscents.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma ascensão encontrada.
          </p>
        )}
        {filteredAscents.map((ascent) => (
          <div
            key={ascent.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-900 transition"
          >
            <Link
              href={`/croqui/${ascent.sectorId}/${ascent.blockId}?expandLine=${ascent.lineId}`}
              className="block"
            >
              <div className="flex items-start gap-3">
                {ascent.imageUrl && (
                  <CachedImage
                    src={ascent.imageUrl}
                    alt={ascent.lineName}
                    className="w-14 h-14 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                      {ascent.lineName}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editingId === ascent.id ? setEditingId(null) : openEdit(ascent);
                      }}
                      className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500" style={{ fontSize: "20px" }}>
                        more_vert
                      </span>
                    </button>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded">
                      {ascent.grade}
                    </span>
                    <span>
                      {new Date(ascent.completedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {ascent.rating && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 block">
                      ★ {ascent.rating}/5
                    </span>
                  )}
                  {ascent.gradeSuggestion && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      Sugestão: {ascent.gradeSuggestion}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Dropdown menu */}
            {editingId === ascent.id && (
              <div
                ref={dropdownRef}
                className="absolute right-3 top-10 z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 p-4 w-72"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                  Editar ascensão
                </h4>

                {/* Rating */}
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Nota
                </label>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditRating(star === editRating ? 0 : star)}
                    >
                      <span
                        className={
                          star <= editRating
                            ? "text-yellow-500 text-xl"
                            : "text-gray-300 text-xl"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>

                {/* Grade suggestion */}
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Sugestão de grau
                </label>
                <select
                  value={editGradeSuggestion}
                  onChange={(e) => setEditGradeSuggestion(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 text-sm mb-3 bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Nenhuma</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                {/* Date */}
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Data da ascensão
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 text-sm mb-3 bg-white dark:bg-gray-700 dark:text-white"
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => saveEdit(ascent)}
                    disabled={saving}
                    className="flex-1 text-sm px-3 py-1.5 rounded bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
