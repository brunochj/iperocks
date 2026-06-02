import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LinesClient from "./LinesClient";

export default async function LinesPage({ params }: { params: Promise<{ sectorId: string; blockId: string }> }) {
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
    const alertsByLine = alerts.reduce((acc, alert) => {
      if (!acc[alert.lineId]) acc[alert.lineId] = [];
      acc[alert.lineId].push(alert.type);
      return acc;
    }, {} as Record<string, string[]>);
  
    const grades = [...new Set(block.lines.map((l) => l.grade))].sort();
  
    return (
      <LinesClient
        blockName={block.name}
        blockDescription={block.description || ""}
        lines={block.lines}
        ascendedIds={ascendedIds}
        grades={grades}
        alertsByLine={alertsByLine}
      />
    );
  }