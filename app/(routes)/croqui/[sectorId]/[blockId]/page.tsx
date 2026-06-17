// // import { prisma } from "@/lib/prisma";
// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth";
// // import { redirect } from "next/navigation";
// // import LinesClient from "./LinesClient";

// // export default async function LinesPage({
// //   params,
// //   searchParams,
// // }: {
// //   params: Promise<{ sectorId: string; blockId: string }>;
// //   searchParams: Promise<{ expandLine?: string }>;
// // }) {
// //   // Aguarda a resolução das Promises
// //   const { sectorId, blockId } = await params;
// //   const { expandLine } = await searchParams;

// //   const session = await getServerSession(authOptions);
// //   if (!session) redirect("/login");

// //   const block = await prisma.block.findUnique({
// //     where: { id: blockId },
// //     include: {
// //       lines: { orderBy: { name: "asc" } },
// //     },
// //   });

// //   if (!block) return <div>Bloco não encontrado</div>;

// //   const ascents = await prisma.ascent.findMany({
// //     where: { userId: session.user.id },
// //     select: { lineId: true },
// //   });
// //   const ascendedIds = new Set(ascents.map((a) => a.lineId));

// //   const userAscents = await prisma.ascent.findMany({
// //     where: { userId: session.user.id },
// //     select: { lineId: true, rating: true, gradeSuggestion: true },
// //   });

// //   const alerts = await prisma.alert.findMany({
// //     where: {
// //       lineId: { in: block.lines.map((l) => l.id) },
// //       resolved: false,
// //     },
// //     select: { lineId: true, type: true },
// //   });
// //   const alertsByLine = alerts.reduce((acc, alert) => {
// //     if (!acc[alert.lineId]) acc[alert.lineId] = [];
// //     acc[alert.lineId].push(alert.type);
// //     return acc;
// //   }, {} as Record<string, string[]>);

// //   const grades = [...new Set(block.lines.map((l) => l.grade))].sort();

// //   const ratingAgg = await prisma.ascent.groupBy({
// //     by: ["lineId"],
// //     where: { lineId: { in: block.lines.map((l) => l.id) }, rating: { not: null } },
// //     _avg: { rating: true },
// //   });
// //   const ratingMap = Object.fromEntries(ratingAgg.map((r) => [r.lineId, r._avg.rating]));

// //   const gradeSuggestionAgg = await prisma.ascent.groupBy({
// //     by: ["lineId", "gradeSuggestion"],
// //     where: { lineId: { in: block.lines.map((l) => l.id) }, gradeSuggestion: { not: null } },
// //     _count: true,
// //   });
  
// //   // Ordenação manual para obter a sugestão mais frequente por linha
// //   const gradeSuggestionMap: Record<string, string> = {};
// //   gradeSuggestionAgg
// //     .sort((a, b) => b._count - a._count)
// //     .forEach((item) => {
// //       if (!gradeSuggestionMap[item.lineId]) {
// //         gradeSuggestionMap[item.lineId] = item.gradeSuggestion!;
// //       }
// //     });

// //   return (
// //     <LinesClient
// //       blockName={block.name}
// //       blockDescription={block.description || ""}
// //       lines={block.lines}
// //       ascendedIds={ascendedIds}
// //       grades={grades}
// //       alertsByLine={alertsByLine}
// //       ratingMap={ratingMap}
// //       gradeSuggestionMap={gradeSuggestionMap}
// //       expandLineId={expandLine || null}
// //       userAscents={userAscents}
// //     />
// //   );
// // }

// 'use client';

// import { useUser } from "@/hooks/useUser";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   getLinesByBlock,
//   getAscentsByLine,
//   getAverageRating,
//   getMostCommonGradeSuggestion,
//   getAlertsByLine,
// } from "@/lib/sqlite";
// import LinesClient from "./LinesClient";

// export default function LinesPage({
//   params,
//   searchParams,
// }: {
//   params: Promise<{ sectorId: string; blockId: string }>;
//   searchParams: Promise<{ expandLine?: string }>;
// }) {
//   const { user, loading } = useUser();
//   const router = useRouter();
//   const [blockData, setBlockData] = useState<any>(null);
//   const [lines, setLines] = useState<any[]>([]);
//   const [ascendedIds, setAscendedIds] = useState<Set<string>>(new Set());
//   const [userAscents, setUserAscents] = useState<any[]>([]);
//   const [alertsByLine, setAlertsByLine] = useState<Record<string, string[]>>({});
//   const [grades, setGrades] = useState<string[]>([]);
//   const [ratingMap, setRatingMap] = useState<Record<string, number>>({});
//   const [gradeSuggestionMap, setGradeSuggestionMap] = useState<Record<string, string>>({});
//   const [dbReady, setDbReady] = useState(false);
//   const [expandLineId, setExpandLineId] = useState<string | null>(null);

//   useEffect(() => {
//     if (!loading && !user) router.push("/login");
//   }, [user, loading, router]);

//   useEffect(() => {
//     if (!user) return;

//     const loadData = async () => {
//       // Resolve params (já que é Promise)
//       const { sectorId, blockId } = await params;
//       const { expandLine } = await searchParams;
//       setExpandLineId(expandLine || null);

//       // Buscar linhas do bloco (SQLite)
//       const linesData = await getLinesByBlock(blockId);
//       setLines(linesData);

//       // Buscar ascensões do usuário para essas linhas
//       const ascentsMap: Record<string, any> = {};
//       const ascentsList: any[] = [];
//       const ids = new Set<string>();
//       for (const line of linesData) {
//         const ascent = await getAscentsByLine(line.id, user.id);
//         if (ascent.length > 0) {
//           ascentsMap[line.id] = ascent[0];
//           ascentsList.push(ascent[0]);
//           ids.add(line.id);
//         }
//       }
//       setAscendedIds(ids);
//       setUserAscents(ascentsList);

//       // Buscar alertas (se você tiver tabela de alertas no SQLite)
//       // Se não tiver, pode deixar vazio ou simular.
//       const alerts = await getAlertsByLine(linesData.map(l => l.id));
//       setAlertsByLine(alerts);

//       // Buscar grades distintas
//       const gradeSet = new Set(linesData.map(l => l.grade));
//       setGrades(Array.from(gradeSet).sort());

//       // Buscar média de estrelas (do SQLite)
//       const ratings = await getAverageRating(linesData.map(l => l.id));
//       setRatingMap(ratings);

//       // Buscar sugestão mais comum
//       const suggestions = await getMostCommonGradeSuggestion(linesData.map(l => l.id));
//       setGradeSuggestionMap(suggestions);

//       setDbReady(true);
//     };

//     loadData();
//   }, [user, params, searchParams]);

//   if (loading || !dbReady) return <div>Carregando...</div>;
//   if (!user) return null;

//   return (
//     <LinesClient
//       blockName={blockData?.name || "Bloco"}
//       blockDescription={blockData?.description || ""}
//       lines={lines}
//       ascendedIds={ascendedIds}
//       grades={grades}
//       alertsByLine={alertsByLine}
//       ratingMap={ratingMap}
//       gradeSuggestionMap={gradeSuggestionMap}
//       expandLineId={expandLineId}
//       userAscents={userAscents}
//     />
//   );
// }

'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LinesClient from "./LinesClient";

export default function LinesPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
  searchParams: Promise<{ expandLine?: string }>;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [dataReady, setDataReady] = useState(false);
  const [expandLineId, setExpandLineId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const { sectorId, blockId } = await params;
        const { expandLine } = await searchParams;
        setExpandLineId(expandLine || null);

        const res = await fetch(`/api/sectors/${sectorId}/blocks/${blockId}/lines`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Erro ao carregar linhas:", error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user, params, searchParams]);

  if (loading || !dataReady) return <div>Carregando...</div>;
  if (!user || !data) return null;

  return (
    <LinesClient
      blockName={data.blockName}
      blockDescription={data.blockDescription}
      lines={data.lines}
      ascendedIds={new Set(data.ascendedIds)}
      grades={data.grades}
      alertsByLine={data.alertsByLine}
      ratingMap={data.ratingMap}
      gradeSuggestionMap={data.gradeSuggestionMap}
      expandLineId={expandLineId}
      userAscents={data.userAscents}
    />
  );
}