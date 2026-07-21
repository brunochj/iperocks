"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

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

  // Função auxiliar para ordenar graus
  const getGradeValue = (grade: string): number => {
    if (grade === "Projeto") return 999;
    const match = grade.match(/V(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Filtrar e ordenar
  const filteredAscents = useMemo(() => {
    let filtered = ascents;

    // Busca por nome (case insensitive)
    if (searchTerm.trim()) {
      filtered = filtered.filter((a) =>
        a.lineName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por grau
    if (filterGrade) {
      filtered = filtered.filter((a) => a.grade === filterGrade);
    }

    // Ordenação
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

      {/* Barra de busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome da linha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Filtro e ordenação */}
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

      {/* Lista */}
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
          <Link
            key={ascent.id}
            href={`/croqui/${ascent.sectorId}/${ascent.blockId}?expandLine=${ascent.lineId}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-900 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {ascent.lineName}
                </h3>
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
              {ascent.imageUrl && (
                <img
                  src={ascent.imageUrl}
                  alt={ascent.lineName}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
