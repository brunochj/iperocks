import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/back-button";

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  // Buscar todos os usuários com a contagem de ascensões
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
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
  let currentUserId = null;
  if (supabaseUser?.email) {
    const currentUser = users.find(u => u.email === supabaseUser.email);
    if (currentUser) {
      currentUserId = currentUser.id;
      const index = users.findIndex((u) => u.id === currentUser.id);
      if (index !== -1) currentUserRank = index + 1;
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ranking de Escaladores</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Classificação por número de vias concluídas.</p>

      {users.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum usuário registrou ascensões ainda.</p>
      )}

      <div className="space-y-2">
        {users.map((user, idx) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              currentUserId === user.id
                ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                : "bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-500 dark:text-gray-400 w-8">#{idx + 1}</span>
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user.name || user.username || "Anônimo"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user._count.ascents} {user._count.ascents === 1 ? "via" : "vias"}
                </p>
              </div>
            </div>
            {currentUserId === user.id && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Você
              </span>
            )}
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 50 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
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