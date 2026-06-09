import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RankingPage() {
  const session = await getServerSession(authOptions);

  // Buscar todos os usuários com a contagem de ascensões
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      _count: {
        select: { ascents: true },
      },
    },
    orderBy: {
      ascents: {
        _count: "desc",
      },
    },
    take: 50, // limite de 50 primeiros para desempenho
  });

  // Encontrar a posição do usuário atual (se logado)
  let currentUserRank = null;
  if (session?.user?.id) {
    const index = users.findIndex((u) => u.id === session.user.id);
    if (index !== -1) currentUserRank = index + 1;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ranking de Escaladores</h1>
      <p className="text-gray-600 mb-6">Classificação por número de vias concluídas.</p>

      {users.length === 0 && (
        <p className="text-center text-gray-500">Nenhum usuário registrou ascensões ainda.</p>
      )}

      <div className="space-y-2">
        {users.map((user, idx) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              session?.user?.id === user.id
                ? "bg-blue-50 border border-blue-200"
                : "bg-white shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-500 w-8">#{idx + 1}</span>
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{user.name || user.username || "Anônimo"}</p>
                <p className="text-sm text-gray-500">
                  {user._count.ascents} {user._count.ascents === 1 ? "via" : "vias"}
                </p>
              </div>
            </div>
            {session?.user?.id === user.id && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Você
              </span>
            )}
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 50 && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-gray-500 text-sm">
            Sua posição atual: #{currentUserRank} com{" "}
            {
              users.find((u) => u.id === session?.user?.id)?._count.ascents
            }{" "}
            vias.
          </p>
        </div>
      )}

    </div>
  );
}