// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { redirect } from "next/navigation";
// import { prisma } from "@/lib/prisma";

// export default async function RootPage() {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");

//   const user = await prisma.user.findUnique({
//     where: { id: session.user.id },
//     select: { rulesAccepted: true },
//   });

//   if (!user?.rulesAccepted) redirect("/onboarding");
//   redirect("/home");
// }

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserMenu from "@/app/components/UserMenu";
import HomeClient from "@/app/components/HomeClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, username: true, image: true },
  });
  if (!user) redirect("/login");

  // --- Gráfico: ascensões por grau (com zeros até o máximo) ---
  const userAscentsWithGrade = await prisma.ascent.findMany({
    where: { userId: user.id },
    select: { line: { select: { grade: true } } },
  });
  const gradeCounts: Record<string, number> = {};
  for (const ascent of userAscentsWithGrade) {
    const grade = ascent.line.grade;
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  }
  const fullGradeOrder = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "Projeto"];
  let maxGradeIndex = -1;
  for (const grade of Object.keys(gradeCounts)) {
    const idx = fullGradeOrder.indexOf(grade);
    if (idx > maxGradeIndex) maxGradeIndex = idx;
  }
  if (maxGradeIndex === -1) maxGradeIndex = 0;
  const gradesToShow = fullGradeOrder.slice(0, maxGradeIndex + 1);
  const chartData = gradesToShow.map((grade) => ({
    grade,
    count: gradeCounts[grade] || 0,
  }));

  // --- Ranking: top 5 e posição do usuário ---
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
  const userTotalAscents = await prisma.ascent.count({ where: { userId: user.id } });
  const allUsersWithCount = await prisma.user.findMany({
    select: {
      id: true,
      _count: { select: { ascents: true } },
    },
  });
  const sorted = allUsersWithCount.sort((a, b) => b._count.ascents - a._count.ascents);
  const userRankPosition = sorted.findIndex((u) => u.id === user.id) + 1;

  // --- Últimas 5 ascensões ---
  const lastAscents = await prisma.ascent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { line: true },
  });

  const userNameDisplay = user.name?.split(" ")[0] || user.username || "Usuário";

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-indigo-600">Iperocks</span>
        </div>
        <UserMenu userName={userNameDisplay} />
      </div>

      {/* Cards colapsíveis (client component) */}
      <HomeClient
        userName={userNameDisplay}
        chartData={chartData}
        top5={top5}
        userRankPosition={userRankPosition}
        userTotalAscents={userTotalAscents}
        lastAscents={lastAscents}
      />
    </div>
  );
}