"use client";
import { useState, useMemo } from "react";
import LineCard from "./LineCard";

export default function LinesClient({
  blockName,
  blockDescription,
  lines,
  ascendedIds,
  grades,
}: {
  blockName: string;
  blockDescription: string | null;
  lines: { id: string; name: string; grade: string; description: string; imageUrl: string | null }[];
  ascendedIds: Set<string>;
  grades: string[];
}) {
  const [filterGrade, setFilterGrade] = useState("");

  const filteredLines = useMemo(() => {
    if (!filterGrade) return lines;
    return lines.filter((line) => line.grade === filterGrade);
  }, [lines, filterGrade]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{blockName}</h1>
      <p className="text-gray-600 mb-4">{blockDescription}</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Filtrar por grau</label>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        >
          <option value="">Todos</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredLines.map((line) => (
          <LineCard
            key={line.id}
            line={line}
            isAscended={ascendedIds.has(line.id)}
          />
        ))}
      </div>
    </div>
  );
}
