import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BlocksPage({
  params,
}: {
  params: Promise<{ sectorId: string }>; // ← Promise
}) {
  const { sectorId } = await params; // ← await
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: {
      blocks: { orderBy: { order: "asc" } },
    },
  });

  if (!sector) notFound();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{sector.name}</h1>
      {sector.description && <p className="text-gray-600 mb-4">{sector.description}</p>}
      <div className="grid grid-cols-1 gap-4">
        {sector.blocks.map((block) => (
          <Link
            key={block.id}
            href={`/croqui/${sectorId}/${block.id}`}
            className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{block.name}</h2>
            {block.description && <p className="text-gray-600 text-sm mt-1">{block.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}