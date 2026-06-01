"use client";
import { useState } from "react";

export default function LineCard({ line, isAscended: initialAscended }) {
  const [ascended, setAscended] = useState(initialAscended);
  const [loading, setLoading] = useState(false);

  const handleAscent = async () => {
    setLoading(true);
    const res = await fetch("/api/ascent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId: line.id }),
    });
    if (res.ok) setAscended(true);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4">
      {line.imageUrl && (
        <img
          src={line.imageUrl}
          alt={line.name}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{line.name}</h3>
            <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded mt-1">
              {line.grade}
            </span>
          </div>
          {!ascended ? (
            <button
              onClick={handleAscent}
              disabled={loading}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              {loading ? "..." : "Completei"}
            </button>
          ) : (
            <span className="text-green-600 text-sm">✓ Feito</span>
          )}
        </div>
        {line.description && (
          <p className="text-gray-600 text-sm mt-2">{line.description}</p>
        )}
      </div>
    </div>
  );
}
