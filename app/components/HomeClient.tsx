"use client";
import { useState } from "react";
import Link from "next/link";
import GradeChart from "./GradeChart";

type TopUser = {
  id: string;
  name: string | null;
  username: string | null;
  _count: { ascents: number };
};

type Ascent = {
  id: string;
  line: { name: string; grade: string };
  createdAt: Date;
};

export default function HomeClient({
  userName,
  chartData,
  top5,
  userRankPosition,
  userTotalAscents,
  lastAscents,
}: {
  userName: string;
  chartData: { grade: string; count: number }[];
  top5: TopUser[];
  userRankPosition: number;
  userTotalAscents: number;
  lastAscents: Ascent[];
}) {
  const [openCard, setOpenCard] = useState<"chart" | "ranking" | "last" | null>(null);

  const toggleCard = (card: "chart" | "ranking" | "last") => {
    setOpenCard(openCard === card ? null : card);
  };

  return (
    <>
      {/* Card Gráfico */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-white/20 p-4 mb-6 transition-all">
        <button
          onClick={() => toggleCard("chart")}
          className="w-full flex justify-between items-center text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Mandou quantos?</h2>
          <span className="text-gray-500">{openCard === "chart" ? "▲" : "▼"}</span>
        </button>
        {openCard === "chart" && (
          <div className="mt-3">
            {chartData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma cadena registrada. Vá ao{" "}
                <Link href="/croqui" className="text-indigo-500">
                  croqui
                </Link>{" "}
                e comece!
              </p>
            ) : (
              <GradeChart data={chartData} />
            )}
          </div>
        )}
      </div>

      {/* Card Ranking */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow p-4 mb-6 transition-all">
        <button
          onClick={() => toggleCard("ranking")}
          className="w-full flex justify-between items-center text-left"
        >
          <div className="flex justify-between items-center w-full">
            <h2 className="text-lg font-semibold text-gray-900">Ranking Geral</h2>
            <Link
              href="/ranking"
              className="text-sm text-indigo-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Ver todos →
            </Link>
          </div>
          <span className="text-gray-500 ml-2">{openCard === "ranking" ? "▲" : "▼"}</span>
        </button>
        {openCard === "ranking" && (
          <div className="mt-3 space-y-2">
            {top5.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-6">#{idx + 1}</span>
                  <span className="text-gray-800">{u.name || u.username}</span>
                </div>
                <span className="text-gray-600">{u._count.ascents} vias</span>
              </div>
            ))}
            {userRankPosition > 5 && (
              <>
                <div className="text-center text-gray-400">...</div>
                <div className="flex items-center justify-between bg-indigo-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600 w-6">
                      #{userRankPosition}
                    </span>
                    <span className="font-medium">Você</span>
                  </div>
                  <span className="text-gray-600">{userTotalAscents} vias</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Últimas ascensões */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-white/20 p-4 mb-6 transition-all">
        <button
          onClick={() => toggleCard("last")}
          className="w-full flex justify-between items-center text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Últimas cadenas</h2>
          <span className="text-gray-500">{openCard === "last" ? "▲" : "▼"}</span>
        </button>
        {openCard === "last" && (
          <div className="mt-3">
            {lastAscents.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum boulder mandado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {lastAscents.map((ascent) => (
                  <li
                    key={ascent.id}
                    className="flex justify-between items-center border-b pb-1"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {ascent.line.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {ascent.line.grade}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(ascent.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}