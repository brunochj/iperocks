// import { prisma } from "@/lib/prisma";
// import Link from "next/link";
// import { notFound } from "next/navigation";

// export default async function BlocksPage({
//   params,
// }: {
//   params: Promise<{ sectorId: string }>; // ← Promise
// }) {
//   const { sectorId } = await params; // ← await
//   const sector = await prisma.sector.findUnique({
//     where: { id: sectorId },
//     include: {
//       blocks: { orderBy: { order: "asc" } },
//     },
//   });

//   if (!sector) notFound();

//   return (
//     <div className="p-4 max-w-2xl mx-auto">
//       <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{sector.name}</h1>
//       {sector.description && <p className="text-gray-600 dark:text-gray-400 mb-4">{sector.description}</p>}
//       <div className="grid grid-cols-1 gap-4">
//         {sector.blocks.map((block) => (
//           <Link
//             key={block.id}
//             href={`/croqui/${sectorId}/${block.id}`}
//             className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-900 transition"
//           >
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{block.name}</h2>
//             {block.description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{block.description}</p>}
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }

'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BlocksPage({ params }: { params: { sectorId: string } }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await fetch(`/api/sectors/${params.sectorId}/blocks`);
        const data = await res.json();
        setBlocks(data.blocks || []);
      } catch (error) {
        console.error("Erro ao carregar blocos:", error);
      } finally {
        setDataReady(true);
      }
    };
    void loadData();
  }, [user, params.sectorId]);

  if (loading || !dataReady) return <div>Carregando...</div>;
  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Blocos</h1>
      <div className="grid grid-cols-1 gap-4">
        {blocks.map((block: any) => (
          <Link key={block.id} href={`/croqui/${params.sectorId}/${block.id}`} className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{block.name}</h2>
            {block.description && <p className="text-gray-600 text-sm mt-1">{block.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}