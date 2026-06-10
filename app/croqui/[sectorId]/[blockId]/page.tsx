import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LinesClient from "./LinesClient";

export default async function LinesPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
  searchParams: Promise<{ expandLine?: string }>;
}) {
  // Aguarda a resolução das Promises
  const { sectorId, blockId } = await params;
  const { expandLine } = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: {
      lines: { orderBy: { name: "asc" } },
    },
  });

  if (!block) return <div>Bloco não encontrado</div>;

  const ascents = await prisma.ascent.findMany({
    where: { userId: session.user.id },
    select: { lineId: true },
  });
  const ascendedIds = new Set(ascents.map((a) => a.lineId));

  const alerts = await prisma.alert.findMany({
    where: {
      lineId: { in: block.lines.map((l) => l.id) },
      resolved: false,
    },
    select: { lineId: true, type: true },
  });
  const alertsByLine = alerts.reduce((acc, alert) => {
    if (!acc[alert.lineId]) acc[alert.lineId] = [];
    acc[alert.lineId].push(alert.type);
    return acc;
  }, {} as Record<string, string[]>);

  const grades = [...new Set(block.lines.map((l) => l.grade))].sort();

  const ratingAgg = await prisma.ascent.groupBy({
    by: ["lineId"],
    where: { lineId: { in: block.lines.map((l) => l.id) }, rating: { not: null } },
    _avg: { rating: true },
  });
  const ratingMap = Object.fromEntries(ratingAgg.map((r) => [r.lineId, r._avg.rating]));

  const gradeSuggestionAgg = await prisma.ascent.groupBy({
    by: ["lineId", "gradeSuggestion"],
    where: { lineId: { in: block.lines.map((l) => l.id) }, gradeSuggestion: { not: null } },
    _count: true,
  });
  
  // Ordenação manual para obter a sugestão mais frequente por linha
  const gradeSuggestionMap: Record<string, string> = {};
  gradeSuggestionAgg
    .sort((a, b) => b._count - a._count)
    .forEach((item) => {
      if (!gradeSuggestionMap[item.lineId]) {
        gradeSuggestionMap[item.lineId] = item.gradeSuggestion!;
      }
    });

  return (
    <LinesClient
      blockName={block.name}
      blockDescription={block.description || ""}
      lines={block.lines}
      ascendedIds={ascendedIds}
      grades={grades}
      alertsByLine={alertsByLine}
      ratingMap={ratingMap}
      gradeSuggestionMap={gradeSuggestionMap}
      expandLineId={expandLine || null}
    />
  );
}