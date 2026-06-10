import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  // Total de ascensões
  const totalAscents = await prisma.ascent.count({
    where: { userId },
  });

  // Últimas 5 ascensões com dados da linha
  const lastAscents = await prisma.ascent.findMany({
    where: { userId },
    include: {
      line: {
        select: {
          name: true,
          grade: true,
          block: {
            select: { name: true, sector: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Meu Progresso</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6 text-center">
        <div className="text-4xl font-bold text-green-600">{totalAscents}</div>
        <div className="text-gray-600">vias concluídas</div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Últimas Conquistas</h2>
      {lastAscents.length === 0 ? (
        <p className="text-gray-500">Nenhuma ascensão registrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {lastAscents.map((ascent) => (
            <li key={ascent.id} className="bg-white p-3 rounded shadow">
              <div className="font-medium">{ascent.line.name}</div>
              <div className="text-sm text-gray-500">
                {ascent.line.grade} • {ascent.line.block.name} (
                {ascent.line.block.sector.name})
              </div>
              <div className="text-xs text-gray-400">
                {ascent.createdAt
                  ? new Date(ascent.createdAt).toLocaleDateString("pt-BR")
                  : ""}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* <div className="mt-8 text-center">
        <Link
          href="/croqui"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Explorar Setores →
        </Link>
        <Link href="/ranking" className="text-blue-500 hover:underline">
          Ver Ranking
        </Link>
      </div> */}
    </div>
  );
}
