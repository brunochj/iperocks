"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { enqueueAndSync } from "@/lib/offline/sync";
import { isOnline } from "@/lib/offline/connectivity";
import { CachedImage } from "@/hooks/useCachedImage";

type LineCardProps = {
  line: {
    id: string;
    name: string;
    grade: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  isAscended: boolean;
  ratingMap?: Record<string, number>;
  gradeSuggestionMap?: Record<string, string>;
};

export default function LineCard({
  line,
  isAscended: initialAscended,
  ratingMap = {},
  gradeSuggestionMap = {},
}: LineCardProps) {
  const [ascended, setAscended] = useState(initialAscended);
  const [loading, setLoading] = useState(false);

  const handleAscent = async () => {
    setLoading(true);

    // Optimistic update
    setAscended(true);

    if (isOnline()) {
      try {
        const res = await apiFetch("/api/ascent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId: line.id }),
        });
        if (res.ok) {
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to queue
      }
    }

    // Offline or API failed: queue for later
    await enqueueAndSync({
      endpoint: "/api/ascent",
      method: "POST",
      body: { lineId: line.id },
    });
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex items-start gap-4">
      {line.imageUrl && (
        <CachedImage
          src={line.imageUrl}
          alt={line.name}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{line.name}</h3>
            <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mt-1">
              {line.grade}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {ratingMap[line.id] && (
              <span>★ {ratingMap[line.id].toFixed(1)}</span>
            )}
            {gradeSuggestionMap[line.id] && (
              <span className="text-xs text-gray-500">
                Sugestão: {gradeSuggestionMap[line.id]}
              </span>
            )}
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
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{line.description}</p>
        )}
      </div>
    </div>
  );
}
