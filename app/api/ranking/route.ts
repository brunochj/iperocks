import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.email }],
    },
    select: { id: true },
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      _count: { select: { ascents: true } },
    },
    orderBy: { ascents: { _count: 'desc' } },
    take: 50,
  });

  const ranking = users.map((entry) => ({
    id: entry.id,
    name: entry.name,
    username: entry.username,
    image: entry.image,
    ascents: entry._count.ascents,
  }));

  let currentUserRank: number | null = null;

  if (dbUser) {
    const indexInTop50 = ranking.findIndex((entry) => entry.id === dbUser.id);
    if (indexInTop50 !== -1) {
      currentUserRank = indexInTop50 + 1;
    } else {
      const allUsersWithCount = await prisma.user.findMany({
        select: {
          id: true,
          _count: { select: { ascents: true } },
        },
      });

      const sorted = allUsersWithCount.sort(
        (a, b) => b._count.ascents - a._count.ascents
      );
      const fullIndex = sorted.findIndex((entry) => entry.id === dbUser.id);
      currentUserRank = fullIndex !== -1 ? fullIndex + 1 : null;
    }
  }

  return NextResponse.json({
    users: ranking,
    currentUserRank,
  });
}
