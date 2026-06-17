import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.email }],
    },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Buscar ascensões com detalhes da linha
  const ascents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    include: {
      line: {
        select: {
          id: true,
          name: true,
          grade: true,
          description: true,
          imageUrl: true,
          block: {
            select: {
              id: true,
              sectorId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Extrair lista de graus distintos
  const grades = [...new Set(ascents.map((a) => a.line.grade))].sort((a, b) => {
    const order = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16','V17','Projeto'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const formattedAscents = ascents.map((a) => ({
    id: a.id,
    lineId: a.line.id,
    lineName: a.line.name,
    grade: a.line.grade,
    description: a.line.description,
    imageUrl: a.line.imageUrl,
    completedAt: a.createdAt,
    rating: a.rating,
    gradeSuggestion: a.gradeSuggestion,
    sectorId: a.line.block.sectorId,
    blockId: a.line.block.id,
  }));

  return NextResponse.json({ ascents: formattedAscents, grades });
}