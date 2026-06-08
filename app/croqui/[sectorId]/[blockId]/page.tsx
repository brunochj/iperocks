import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LinesClient from "./LinesClient";

export default async function LinesPage({
  params,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
}) {
  const { sectorId, blockId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: {
      lines: { orderBy: { name: "asc" } },
    },
  });

  if (!block) return <div>Bloco não encontrado</div>;

  // Buscar ascensões do usuário
  const ascents = await prisma.ascent.findMany({
    where: { userId: session.user.id },
    select: { lineId: true },
  });
  const ascendedIds = new Set(ascents.map((a) => a.lineId));

  // Buscar alertas não resolvidos
  const alerts = await prisma.alert.findMany({
    where: {
      lineId: { in: block.lines.map((l) => l.id) },
      resolved: false,
    },
    select: { lineId: true, type: true },
  });
  const alertsByLine = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.lineId]) acc[alert.lineId] = [];
      acc[alert.lineId].push(alert.type);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const grades = [...new Set(block.lines.map((l) => l.grade))].sort();

  // Fetch ratings and grade suggestions per line
  const lineIds = block.lines.map((l) => l.id);

  const ascentsWithRatings = await prisma.ascent.findMany({
    where: { lineId: { in: lineIds }, rating: { not: null } },
    select: { lineId: true, rating: true },
  });
  const lineRatingAverages: Record<string, number> = {};
  const ratingCounts: Record<string, number> = {};
  for (const a of ascentsWithRatings) {
    if (a.rating) {
      lineRatingAverages[a.lineId] =
        (lineRatingAverages[a.lineId] || 0) + a.rating;
      ratingCounts[a.lineId] = (ratingCounts[a.lineId] || 0) + 1;
    }
  }
  for (const lineId in lineRatingAverages) {
    lineRatingAverages[lineId] =
      lineRatingAverages[lineId] / ratingCounts[lineId];
  }

  const ascentsWithSuggestions = await prisma.ascent.findMany({
    where: { lineId: { in: lineIds }, gradeSuggestion: { not: null } },
    select: { lineId: true, gradeSuggestion: true },
  });
  const suggestionCounts: Record<string, Record<string, number>> = {};
  for (const a of ascentsWithSuggestions) {
    if (a.gradeSuggestion) {
      suggestionCounts[a.lineId] = suggestionCounts[a.lineId] || {};
      suggestionCounts[a.lineId][a.gradeSuggestion] =
        (suggestionCounts[a.lineId][a.gradeSuggestion] || 0) + 1;
    }
  }
  const gradeSuggestionMap: Record<string, string> = {};
  for (const lineId in suggestionCounts) {
    const entries = Object.entries(suggestionCounts[lineId]);
    entries.sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      gradeSuggestionMap[lineId] = entries[0][0];
    }
  }

  return (
    <LinesClient
      blockName={block.name}
      blockDescription={block.description || ""}
      lines={block.lines}
      ascendedIds={ascendedIds}
      grades={grades}
      alertsByLine={alertsByLine}
      ratingMap={lineRatingAverages}
      gradeSuggestionMap={gradeSuggestionMap}
    />
  );
}
