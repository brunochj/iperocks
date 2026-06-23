// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth";
// // import { redirect } from "next/navigation";
// // import { prisma } from "@/lib/prisma";
// // import MyAscentsClient from "./MyAscentsClient";

// // export default async function MyAscentsPage() {
// //   const session = await getServerSession(authOptions);
// //   if (!session) redirect("/login");

// //   const user = await prisma.user.findUnique({
// //     where: { email: session.user.email! },
// //     select: { id: true },
// //   });
// //   if (!user) redirect("/login");

// //   // Buscar todas as ascensões do usuário com detalhes da linha
// //   const ascents = await prisma.ascent.findMany({
// //     where: { userId: user.id },
// //     include: {
// //       line: {
// //         select: {
// //           id: true,
// //           name: true,
// //           grade: true,
// //           description: true,
// //           imageUrl: true,
// //           blockId: true,          // necessário
// //           block: {
// //             select: {
// //               id: true,
// //               sectorId: true,     // necessário
// //             },
// //           },
// //         },
// //       },
// //     },
// //     orderBy: { createdAt: "desc" },
// //   });

// //   // Extrair lista de graus distintos para o filtro
// //   const grades = [...new Set(ascents.map((a) => a.line.grade))].sort((a, b) => {
// //     const order = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14","V15","V16", "V17", "Projeto"];
// //     return order.indexOf(a) - order.indexOf(b);
// //   });

// //   return (
// //     <MyAscentsClient
// //       ascents={ascents.map((a) => ({
// //         id: a.id,
// //         lineId: a.line.id,
// //         lineName: a.line.name,
// //         grade: a.line.grade,
// //         description: a.line.description,
// //         imageUrl: a.line.imageUrl,
// //         completedAt: a.createdAt,
// //         rating: a.rating,
// //         gradeSuggestion: a.gradeSuggestion,
// //         sectorId: a.line.block.sectorId,   // novo
// //         blockId: a.line.blockId,            // novo
// //       }))}
// //       grades={grades}
// //     />
// //   );
// // }

// 'use client';

// import { useUser } from "@/hooks/useUser";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   getAscentsByUser,
//   getAscentsByUserWithDetails,
//   getDistinctGradesFromAscents,
// } from "@/lib/sqlite";
// import MyAscentsClient from "./MyAscentsClient";

// export default function MyAscentsPage() {
//   const { user, loading } = useUser();
//   const router = useRouter();
//   const [ascents, setAscents] = useState<any[]>([]);
//   const [grades, setGrades] = useState<string[]>([]);
//   const [dbReady, setDbReady] = useState(false);

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/login");
//     }
//   }, [user, loading, router]);

//   useEffect(() => {
//     if (!user) return;

//     const loadData = async () => {
//       try {
//         // Buscar ascensões com detalhes das linhas
//         const ascentsData = await getAscentsByUserWithDetails(user.id);
//         setAscents(ascentsData);

//         // Extrair lista de graus distintos para o filtro
//         const gradeOrder = [
//           "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9",
//           "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "Projeto"
//         ];
//         const distinctGrades = await getDistinctGradesFromAscents(user.id);
//         const sortedGrades = distinctGrades.sort(
//           (a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b)
//         );
//         setGrades(sortedGrades);

//         setDbReady(true);
//       } catch (error) {
//         console.error("Erro ao carregar ascensões:", error);
//       }
//     };

//     loadData();
//   }, [user]);

//   if (loading || !dbReady) {
//     return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
//   }
//   if (!user) return null;

//   return (
//     <MyAscentsClient
//       ascents={ascents.map((a) => ({
//         id: a.id,
//         lineId: a.lineId,
//         lineName: a.lineName,
//         grade: a.grade,
//         description: a.description,
//         imageUrl: a.imageUrl,
//         completedAt: a.createdAt,
//         rating: a.rating,
//         gradeSuggestion: a.gradeSuggestion,
//         sectorId: a.sectorId,
//         blockId: a.blockId,
//       }))}
//       grades={grades}
//     />
//   );
// }

'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyAscentsClient from "./MyAscentsClient";
import { apiFetch } from "@/lib/api-fetch";

export default function MyAscentsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [ascents, setAscents] = useState<any[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const res = await apiFetch("/api/my-ascents");
        const data = await res.json();
        setAscents(data.ascents || []);
        setGrades(data.grades || []);
      } catch (error) {
        console.error("Erro ao carregar ascensões:", error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user]);

  if (loading || !dataReady) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user) return null;

  return <MyAscentsClient ascents={ascents} grades={grades} />;
}