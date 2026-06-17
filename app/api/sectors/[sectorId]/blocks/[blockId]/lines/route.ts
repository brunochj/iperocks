import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectorId: string; blockId: string }> }
) {
  const { blockId } = await params;
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

  const block = await prisma.block.findUnique({
    where: { id: blockId },
    include: {
      lines: { orderBy: { name: 'asc' } },
    },
  });

  if (!block) {
    return NextResponse.json({ error: 'Bloco não encontrado' }, { status: 404 });
  }

  // Ascensões do usuário
  const ascents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    select: { lineId: true },
  });
  const ascendedIds = new Set(ascents.map((a) => a.lineId));

  const userAscents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    select: { lineId: true, rating: true, gradeSuggestion: true },
  });

  // Alertas (resolvidos = false)
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

  // Média de estrelas
  const ratingAgg = await prisma.ascent.groupBy({
    by: ['lineId'],
    where: { lineId: { in: block.lines.map((l) => l.id) }, rating: { not: null } },
    _avg: { rating: true },
  });
  const ratingMap = Object.fromEntries(ratingAgg.map((r) => [r.lineId, r._avg.rating]));

  // Sugestão mais comum
  const gradeSuggestionAgg = await prisma.ascent.groupBy({
    by: ['lineId', 'gradeSuggestion'],
    where: { lineId: { in: block.lines.map((l) => l.id) }, gradeSuggestion: { not: null } },
    _count: true,
  });
  const gradeSuggestionMap: Record<string, string> = {};
  gradeSuggestionAgg
    .sort((a, b) => b._count - a._count)
    .forEach((item) => {
      if (!gradeSuggestionMap[item.lineId]) {
        gradeSuggestionMap[item.lineId] = item.gradeSuggestion!;
      }
    });

  return NextResponse.json({
    blockName: block.name,
    blockDescription: block.description || '',
    lines: block.lines,
    ascendedIds: Array.from(ascendedIds),
    grades,
    alertsByLine,
    ratingMap,
    gradeSuggestionMap,
    userAscents,
  });
}