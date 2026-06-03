"use client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";

export default function LinesClient({
  blockName,
  blockDescription,
  lines,
  ascendedIds,
  grades,
  alertsByLine,
}) {
  const { data: session } = useSession();
  const [filterGrade, setFilterGrade] = useState("");
  const [ascending, setAscending] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      lines.map((line) => [line.id, ascendedIds.has(line.id)]),
    ),
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filteredLines = useMemo(() => {
    if (!filterGrade) return lines;
    return lines.filter((line) => line.grade === filterGrade);
  }, [lines, filterGrade]);

  const handleAscent = async (lineId: string) => {
    if (!session) return;
    setLoading((prev) => ({ ...prev, [lineId]: true }));
    const res = await fetch("/api/ascent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId }),
    });
    if (res.ok) {
      setAscending((prev) => ({ ...prev, [lineId]: true }));
    } else {
      alert("Erro ao registrar ascensão");
    }
    setLoading((prev) => ({ ...prev, [lineId]: false }));
  };

  // Função para renderizar ícones de alerta
  const renderAlerts = (lineId: string) => {
    const types = alertsByLine[lineId] || [];
    if (types.includes("FALL_RISK")) {
      return (
        <span className="text-red-600 ml-2" title="Risco de queda">
          ⚠️
        </span>
      );
    }
    // outros tipos podem ser adicionados
    return null;
  };

  const [sortBy, setSortBy] = useState("name");

  const sortedAndFiltered = useMemo(() => {
    let result = [...lines];
    if (filterGrade) result = result.filter((l) => l.grade === filterGrade);
    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "grade") {
      // ordenação customizada para graus (V0, V1, V2...)
      const gradeOrder = {
        VB: 0,
        V0: 1,
        V1: 2,
        V2: 3,
        V3: 4,
        V4: 5,
        V5: 6,
        V6: 7,
        V7: 8,
        V8: 9,
        V9: 10,
        V10: 11,
        V11: 12,
        V12: 13,
        V13: 14,
      };
      result.sort(
        (a, b) => (gradeOrder[a.grade] || 99) - (gradeOrder[b.grade] || 99),
      );
    }
    return result;
  }, [lines, filterGrade, sortBy]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{blockName}</h1>
      {blockDescription && (
        <p className="text-gray-600 mb-4">{blockDescription}</p>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Filtrar por grau
        </label>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
        >
          <option value="">Todos</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="mb-3 p-2 border rounded"
        >
          <option value="name">Nome</option>
          <option value="grade">Grau</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedAndFiltered.map((line) => (
          <div
            key={line.id}
            className="bg-white rounded-lg shadow p-4 flex items-start gap-4"
          >
            {line.imageUrl && (
              <img
                src={line.imageUrl}
                alt={line.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">{line.name}</h3>
                  {renderAlerts(line.id)}
                </div>
                {!ascending[line.id] ? (
                  <button
                    onClick={() => handleAscent(line.id)}
                    disabled={loading[line.id]}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    {loading[line.id] ? "..." : "Completei"}
                  </button>
                ) : (
                  <span className="text-green-600 text-sm">✓ Feito</span>
                )}
              </div>
              <div className="mt-1">
                <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                  {line.grade}
                </span>
              </div>
              {line.description && (
                <p className="text-gray-600 text-sm mt-2">{line.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
