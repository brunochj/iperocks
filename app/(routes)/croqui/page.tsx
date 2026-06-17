// import { prisma } from "@/lib/prisma";
// import Link from "next/link";
// // import BackButton from "@/app/components/back-button";

// export default async function SectorsPage() {
//   const sectors = await prisma.sector.findMany({
//     orderBy: { order: "asc" },
//   });

//   return (
    
//     <div className="p-4 max-w-2xl mx-auto">
//       {/* <BackButton /> */}
//       <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Setores</h1>
//       <div className="grid grid-cols-1 gap-4">
//         {sectors.map((sector) => (
//           <Link
//             key={sector.id}
//             href={`/croqui/${sector.id}`}
//             className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-900 transition"
//           >
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{sector.name}</h2>
//             {sector.description && (
//               <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{sector.description}</p>
//             )}
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

export default function CroquiPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [sectors, setSectors] = useState<any[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await fetch("/api/sectors");
        const data = await res.json();
        setSectors(data.sectors || []);
      } catch (error) {
        console.error("Erro ao carregar setores:", error);
      } finally {
        setDataReady(true);
      }
    };
    void loadData();
  }, [user]);

  if (loading || !dataReady) return <div>Carregando...</div>;
  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setores</h1>
      <div className="grid grid-cols-1 gap-4">
        {sectors.map((sector: any) => (
          <Link key={sector.id} href={`/croqui/${sector.id}`} className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{sector.name}</h2>
            {sector.description && <p className="text-gray-600 text-sm mt-1">{sector.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}