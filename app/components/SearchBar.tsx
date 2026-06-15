"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Loader from "@/app/components/Loader";

type SearchResult = {
  type: "sector" | "block" | "line";
  id: string;
  name: string;
  parent?: string;
  url: string;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce da busca
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
        setIsOpen(true);
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (url: string) => {
    setLoading(true);
    setIsOpen(false);
    setQuery("");
    router.push(url);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sector":
        return "🗺️";
      case "block":
        return "🪨";
      case "line":
        return "🧗";
      default:
        return "🔍";
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto mb-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar setor, bloco ou linha..."
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg p-3 text-center text-gray-500">
          <Loader size="sm" />
          <span className="ml-2">Buscando...</span>
        </div>
      )}

      {isOpen && !loading && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result.url)}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
            >
              <span className="mr-2 text-lg">{getTypeIcon(result.type)}</span>
              <div className="flex-1">
                <div className="font-medium">{result.name}</div>
                {result.parent && (
                  <div className="text-xs text-gray-500">{result.parent}</div>
                )}
              </div>
              <span className="text-xs text-gray-400 ml-2 capitalize">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen &&
        !loading &&
        query.trim().length >= 2 &&
        results.length === 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg p-4 text-center text-gray-500">
            Nenhum resultado encontrado.
          </div>
        )}
    </div>
  );
}
