import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MyAscentsClient from "./MyAscentsClient";

export default async function MyAscentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!user) redirect("/login");

  // Buscar todas as ascensões do usuário com detalhes da linha
  const ascents = await prisma.ascent.findMany({
    where: { userId: user.id },
    include: {
      line: {
        select: {
          id: true,
          name: true,
          grade: true,
          description: true,
          imageUrl: true,
          blockId: true,          // necessário
          block: {
            select: {
              id: true,
              sectorId: true,     // necessário
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Extrair lista de graus distintos para o filtro
  const grades = [...new Set(ascents.map((a) => a.line.grade))].sort((a, b) => {
    const order = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","V11","V12","V13","V14","V15","V16", "V17", "Projeto"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <MyAscentsClient
      ascents={ascents.map((a) => ({
        id: a.id,
        lineId: a.line.id,
        lineName: a.line.name,
        grade: a.line.grade,
        description: a.line.description,
        imageUrl: a.line.imageUrl,
        completedAt: a.createdAt,
        rating: a.rating,
        gradeSuggestion: a.gradeSuggestion,
        sectorId: a.line.block.sectorId,   // novo
        blockId: a.line.blockId,            // novo
      }))}
      grades={grades}
    />
  );
}