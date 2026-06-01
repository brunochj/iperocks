import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SectorsPage() {
  const sectors = await prisma.sector.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setores</h1>
      <div className="grid grid-cols-1 gap-4">
        {sectors.map((sector) => (
          <Link
            key={sector.id}
            href={`/croqui/${sector.id}`}
            className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{sector.name}</h2>
            {sector.description && (
              <p className="text-gray-600 text-sm mt-1">{sector.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}