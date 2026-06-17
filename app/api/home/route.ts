import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const FULL_GRADE_ORDER = [
  'V0',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V7',
  'V8',
  'V9',
  'V10',
  'Projeto',
];

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

  if (!dbUser) {
    return NextResponse.json({
      chartData: [],
      top5: [],
      userRankPosition: null,
      userTotalAscents: 0,
      lastAscents: [],
    });
  }

  const userAscentsWithGrade = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    select: { line: { select: { grade: true } } },
  });

  const gradeCounts: Record<string, number> = {};
  for (const ascent of userAscentsWithGrade) {
    const grade = ascent.line.grade;
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  }

  let maxGradeIndex = -1;
  for (const grade of Object.keys(gradeCounts)) {
    const idx = FULL_GRADE_ORDER.indexOf(grade);
    if (idx > maxGradeIndex) maxGradeIndex = idx;
  }
  if (maxGradeIndex === -1) maxGradeIndex = 0;

  const chartData = FULL_GRADE_ORDER.slice(0, maxGradeIndex + 1).map((grade) => ({
    grade,
    count: gradeCounts[grade] || 0,
  }));

  const top5 = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      _count: { select: { ascents: true } },
    },
    orderBy: { ascents: { _count: 'desc' } },
    take: 5,
  });

  const userTotalAscents = await prisma.ascent.count({
    where: { userId: dbUser.id },
  });

  const allUsersWithCount = await prisma.user.findMany({
    select: {
      id: true,
      _count: { select: { ascents: true } },
    },
  });

  const sorted = allUsersWithCount.sort(
    (a, b) => b._count.ascents - a._count.ascents
  );
  const userRankPosition = sorted.findIndex((u) => u.id === dbUser.id) + 1;

  const lastAscents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { line: { select: { name: true, grade: true } } },
  });

  return NextResponse.json({
    chartData,
    top5,
    userRankPosition: userRankPosition > 0 ? userRankPosition : null,
    userTotalAscents,
    lastAscents: lastAscents.map((ascent) => ({
      id: ascent.id,
      lineName: ascent.line.name,
      grade: ascent.line.grade,
      createdAt: ascent.createdAt.toISOString(),
    })),
  });
}
