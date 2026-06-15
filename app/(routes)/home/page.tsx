import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import GradeChart from "@/app/components/GradeChart";
import CollapsibleCard from "@/app/components/CollapsibleCard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, username: true, image: true },
  });
  if (!user) redirect("/login");

  // 1. Gráfico: ascensões por grau (com zeros nos graus intermediários)
  const userAscentsWithGrade = await prisma.ascent.findMany({
    where: { userId: user.id },
    select: { line: { select: { grade: true } } },
  });

  const gradeCounts: Record<string, number> = {};
  for (const ascent of userAscentsWithGrade) {
    const grade = ascent.line.grade;
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  }

  // Ordem completa dos graus (do mais baixo ao mais alto)
  const fullGradeOrder = [
    "V0",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "Projeto",
  ];

  // Encontrar o índice do grau máximo que o usuário já escalou
  let maxGradeIndex = -1;
  for (const grade of Object.keys(gradeCounts)) {
    const idx = fullGradeOrder.indexOf(grade);
    if (idx > maxGradeIndex) maxGradeIndex = idx;
  }
  // Se nenhum grau foi escalado, não mostrar gráfico (ou mostrar apenas V0)
  if (maxGradeIndex === -1) {
    // fallback: mostrar até V0 (apenas um grau)
    maxGradeIndex = 0;
  }

  // Selecionar os graus até o máximo
  const gradesToShow = fullGradeOrder.slice(0, maxGradeIndex + 1);

  // Construir dados para o gráfico (com zeros onde não há contagem)
  const chartData = gradesToShow.map((grade) => ({
    grade,
    count: gradeCounts[grade] || 0,
  }));
  // 2. Ranking: top 5 e posição do usuário
  const top5 = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      _count: { select: { ascents: true } },
    },
    orderBy: { ascents: { _count: "desc" } },
    take: 5,
  });

  const userTotalAscents = await prisma.ascent.count({
    where: { userId: user.id },
  });

  // Calcular posição do usuário (sem usar _count no where)
  const allUsersWithCount = await prisma.user.findMany({
    select: {
      id: true,
      _count: { select: { ascents: true } },
    },
  });
  const sorted = allUsersWithCount.sort(
    (a, b) => b._count.ascents - a._count.ascents,
  );
  const userRankPosition = sorted.findIndex((u) => u.id === user.id) + 1;

  // 3. Últimas 5 ascensões
  const lastAscents = await prisma.ascent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { line: true },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-indigo-600">Iperocks</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-700">
            Olá, {user.name?.split(" ")[0] || user.username || "Usuário"}
          </span>
          <button className="relative text-xl">🔔</button>
        </div>
      </div> */}

      <CollapsibleCard title="Mandou quantos?">
        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma cadena registrada. Vá ao{" "}
            <Link href="/croqui" className="text-indigo-500">
              croqui
            </Link>{" "}
            e comece!
          </p>
        ) : (
          <GradeChart data={chartData} />
        )}
      </CollapsibleCard>

      <CollapsibleCard title="Ranking Geral" defaultExpanded={false}>
      <Link href="/ranking" className="text-sm text-gray-500 dark:text-gray-400 pb-4 block">
            Ver Ranking Geral
          </Link>
        <div className="space-y-2">
          {top5.map((u, idx) => (
            <div key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 w-6">#{idx + 1}</span>
                <span>{u.name || u.username}</span>
              </div>
              <span className="text-gray-600">{u._count.ascents} vias</span>
            </div>
          ))}
          {userRankPosition > 5 && (
            <>
              <div className="text-center text-gray-400">...</div>
              <div className="flex items-center justify-between bg-indigo-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-600 w-6">
                    #{userRankPosition}
                  </span>
                  <span className="font-medium">Você</span>
                </div>
                <span className="text-gray-600">{userTotalAscents} vias</span>
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Últimas cadenas" 
      // navigateMessage="Ver todas as cadenas" navigateLink="/my-ascents" 
      defaultExpanded={false}>
        <Link href="/my-ascents" className="text-sm text-gray-500 dark:text-gray-400 pb-4 block">
            Ver todas as cadenas
          </Link>
        {lastAscents.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum boulder mandado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {lastAscents.map((ascent) => (
              <li
                key={ascent.id}
                className="flex justify-between items-center border-b pb-1"
              >
                <div>
                  <span className="font-medium">{ascent.line.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {ascent.line.grade}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(ascent.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleCard>
    </div>
  );
}
