import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LinesClient from "./components/LinesClient";

export default async function LinesPage({
  params,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
}) {
  const { blockId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: { lines: { orderBy: { name: "asc" } } },
  });

  if (!block) notFound();

  const ascents = await prisma.ascent.findMany({
    where: { userId: session.user.id },
    select: { lineId: true },
  });
  const ascendedIds = new Set(ascents.map((a) => a.lineId));

  const grades = [...new Set(block.lines.map((l) => l.grade))].sort();

  return (
    <LinesClient
      blockName={block.name}
      blockDescription={block.description}
      lines={block.lines}
      ascendedIds={ascendedIds}
      grades={grades}
    />
  );
}
