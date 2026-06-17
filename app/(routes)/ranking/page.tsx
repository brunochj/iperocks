// // import { prisma } from "@/lib/prisma";
// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth";
// // import BackButton from "@/app/components/back-button";

// // export default async function RankingPage() {
// //   const session = await getServerSession(authOptions);

// //   // Buscar todos os usuários com a contagem de ascensões
// //   const users = await prisma.user.findMany({
// //     select: {
// //       id: true,
// //       name: true,
// //       username: true,
// //       image: true,
// //       _count: {
// //         select: { ascents: true },
// //       },
// //     },
// //     orderBy: {
// //       ascents: {
// //         _count: "desc",
// //       },
// //     },
// //     take: 50, // limite de 50 primeiros para desempenho
// //   });

// //   // Encontrar a posição do usuário atual (se logado)
// //   let currentUserRank = null;
// //   if (session?.user?.id) {
// //     const index = users.findIndex((u) => u.id === session.user.id);
// //     if (index !== -1) currentUserRank = index + 1;
// //   }

// //   return (
// //     <div className="p-4 max-w-2xl mx-auto">
// //       <BackButton />
// //       <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ranking de Escaladores</h1>
// //       <p className="text-gray-600 dark:text-gray-400 mb-6">Classificação por número de vias concluídas.</p>

// //       {users.length === 0 && (
// //         <p className="text-center text-gray-500 dark:text-gray-400">Nenhum usuário registrou ascensões ainda.</p>
// //       )}

// //       <div className="space-y-2">
// //         {users.map((user, idx) => (
// //           <div
// //             key={user.id}
// //             className={`flex items-center justify-between p-3 rounded-lg ${
// //               session?.user?.id === user.id
// //                 ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
// //                 : "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900"
// //             }`}
// //           >
// //             <div className="flex items-center gap-3">
// //               <span className="font-bold text-gray-500 dark:text-gray-400 w-8">#{idx + 1}</span>
// //               {user.image && (
// //                 <img
// //                   src={user.image}
// //                   alt={user.name || ""}
// //                   className="w-10 h-10 rounded-full object-cover"
// //                 />
// //               )}
// //               <div>
// //                 <p className="font-semibold text-gray-900 dark:text-white">{user.name || user.username || "Anônimo"}</p>
// //                 <p className="text-sm text-gray-500 dark:text-gray-400">
// //                   {user._count.ascents} {user._count.ascents === 1 ? "via" : "vias"}
// //                 </p>
// //               </div>
// //             </div>
// //             {session?.user?.id === user.id && (
// //               <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
// //                 Você
// //               </span>
// //             )}
// //           </div>
// //         ))}
// //       </div>

// //       {currentUserRank && currentUserRank > 50 && (
// //         <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
// //           <p className="text-gray-500 dark:text-gray-400 text-sm">
// //             Sua posição atual: #{currentUserRank} com{" "}
// //             {
// //               users.find((u) => u.id === session?.user?.id)?._count.ascents
// //             }{" "}
// //             vias.
// //           </p>
// //         </div>
// //       )}

// //     </div>
// //   );
// // }

// 'use client';

// import { useUser } from "@/hooks/useUser";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import BackButton from "@/app/components/back-button";

// interface UserRank {
//   id: string;
//   name: string | null;
//   username: string | null;
//   image: string | null;
//   ascents: number;
// }

// export default function RankingPage() {
//   const { user, loading } = useUser();
//   const router = useRouter();
//   const [users, setUsers] = useState<UserRank[]>([]);
//   const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
//   const [dataReady, setDataReady] = useState(false);

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/login");
//     }
//   }, [user, loading, router]);

//   useEffect(() => {
//     if (!user) return;

//     const loadData = async () => {
//       try {
//         const res = await fetch("/api/ranking");
//         if (!res.ok) {
//           throw new Error(`HTTP ${res.status}`);
//         }

//         const data = await res.json();
//         setUsers(data.users ?? []);
//         setCurrentUserRank(data.currentUserRank ?? null);
//       } catch (error) {
//         console.error("Erro ao carregar ranking:", error);
//       } finally {
//         setDataReady(true);
//       }
//     };

//     void loadData();
//   }, [user]);

//   if (loading || !dataReady) {
//     return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
//   }
//   if (!user) return null;

//   return (
//     <div className="p-4 max-w-2xl mx-auto">
//       <BackButton />
//       <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ranking de Escaladores</h1>
//       <p className="text-gray-600 dark:text-gray-400 mb-6">Classificação por número de vias concluídas.</p>

//       {users.length === 0 && (
//         <p className="text-center text-gray-500 dark:text-gray-400">Nenhum usuário registrou ascensões ainda.</p>
//       )}

//       <div className="space-y-2">
//         {users.map((rankingUser, idx) => (
//           <div
//             key={rankingUser.id}
//             className={`flex items-center justify-between p-3 rounded-lg ${
//               user.id === rankingUser.id
//                 ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
//                 : "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900"
//             }`}
//           >
//             <div className="flex items-center gap-3">
//               <span className="font-bold text-gray-500 dark:text-gray-400 w-8">#{idx + 1}</span>
//               {rankingUser.image && (
//                 <img
//                   src={rankingUser.image}
//                   alt={rankingUser.name || ""}
//                   className="w-10 h-10 rounded-full object-cover"
//                 />
//               )}
//               <div>
//                 <p className="font-semibold text-gray-900 dark:text-white">
//                   {rankingUser.name || rankingUser.username || "Anônimo"}
//                 </p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {rankingUser.ascents} {rankingUser.ascents === 1 ? "via" : "vias"}
//                 </p>
//               </div>
//             </div>
//             {user.id === rankingUser.id && (
//               <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
//                 Você
//               </span>
//             )}
//           </div>
//         ))}
//       </div>

//       {currentUserRank && currentUserRank > 50 && (
//         <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
//           <p className="text-gray-500 dark:text-gray-400 text-sm">
//             Sua posição atual: #{currentUserRank} com{" "}
//             {users.find((u) => u.id === user.id)?.ascents} vias.
//           </p>
//         </div>
//       )}

//       {users.length > 0 && users.length < 50 && (
//         <p className="text-center text-sm text-gray-400 mt-4">
//           Mostrando {users.length} usuários.
//         </p>
//       )}
//     </div>
//   );
// }

'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/app/components/back-button";

export default function RankingPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/ranking");
        const data = await res.json();
        setUsers(data.users || []);
        setCurrentUserRank(data.currentUserRank || null);
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, []);

  if (loading || !dataReady) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!user) return null;

  // Renderização igual à original, mas usando os dados do estado
  // (mantenha a mesma estrutura JSX que você tinha antes)
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ranking de Escaladores</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Classificação por número de vias concluídas.</p>

      {users.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">Nenhum usuário registrou ascensões ainda.</p>}

      <div className="space-y-2">
        {users.map((u, idx) => (
          <div
            key={u.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              user?.id === u.id
                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                : "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-500 dark:text-gray-400 w-8">#{idx + 1}</span>
              {u.image && <img src={u.image} alt={u.name || ""} className="w-10 h-10 rounded-full object-cover" />}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{u.name || u.username || "Anônimo"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {u._count.ascents} {u._count.ascents === 1 ? "via" : "vias"}
                </p>
              </div>
            </div>
            {user?.id === u.id && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Você</span>
            )}
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 50 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sua posição atual: #{currentUserRank} com{" "}
            {users.find((u) => u.id === user?.id)?._count.ascents} vias.
          </p>
        </div>
      )}
    </div>
  );
}