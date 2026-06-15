import { prisma } from "@/lib/prisma";
import Link from "next/link";
// import BackButton from "@/app/components/back-button";

export default async function SectorsPage() {
  const sectors = await prisma.sector.findMany({
    orderBy: { order: "asc" },
  });

  return (
    
    <div className="p-4 max-w-2xl mx-auto">
      {/* <BackButton /> */}
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Setores</h1>
      <div className="grid grid-cols-1 gap-4">
        {sectors.map((sector) => (
          <Link
            key={sector.id}
            href={`/croqui/${sector.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-900 transition"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{sector.name}</h2>
            {sector.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{sector.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}