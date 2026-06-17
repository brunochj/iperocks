import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromAuthHeader, resolveDbUser } from '@/lib/server/auth-user';

const FULL_GRADE_ORDER = [
  'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'Projeto',
];

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/auth/check', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    return res.json({ session: null });
  }

  const dbUser = await resolveDbUser(user);
  return res.json({
    session: {
      user: {
        id: dbUser?.id ?? user.id,
        email: user.email,
        name:
          dbUser?.name ??
          user.user_metadata?.name ??
          user.email?.split('@')[0] ??
          null,
        username: dbUser?.username ?? null,
        image: dbUser?.image ?? user.user_metadata?.avatar_url ?? null,
        rulesAccepted: dbUser?.rulesAccepted ?? false,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

app.get('/api/home', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) {
    return res.json({
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
    gradeCounts[ascent.line.grade] = (gradeCounts[ascent.line.grade] || 0) + 1;
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

  const userTotalAscents = await prisma.ascent.count({ where: { userId: dbUser.id } });

  const allUsersWithCount = await prisma.user.findMany({
    select: { id: true, _count: { select: { ascents: true } } },
  });
  const sorted = allUsersWithCount.sort((a, b) => b._count.ascents - a._count.ascents);
  const userRankPosition = sorted.findIndex((entry) => entry.id === dbUser.id) + 1;

  const lastAscents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { line: { select: { name: true, grade: true } } },
  });

  return res.json({
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
});

app.get('/api/ranking', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
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
        select: { id: true, _count: { select: { ascents: true } } },
      });
      const sorted = allUsersWithCount.sort((a, b) => b._count.ascents - a._count.ascents);
      const fullIndex = sorted.findIndex((entry) => entry.id === dbUser.id);
      currentUserRank = fullIndex !== -1 ? fullIndex + 1 : null;
    }
  }

  return res.json({ users: ranking, currentUserRank });
});

app.get('/api/my-ascents', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) return res.status(404).json({ error: 'Usuário não encontrado' });

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
          block: { select: { id: true, sectorId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const grades = [...new Set(ascents.map((a) => a.line.grade))].sort((a, b) => {
    const order = ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16','V17','Projeto'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return res.json({
    ascents: ascents.map((a) => ({
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
    })),
    grades,
  });
});

app.get('/api/sectors/:sectorId/blocks/:blockId/lines', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) return res.status(404).json({ error: 'Usuário não encontrado' });

  const block = await prisma.block.findUnique({
    where: { id: req.params.blockId },
    include: { lines: { orderBy: { name: 'asc' } } },
  });
  if (!block) return res.status(404).json({ error: 'Bloco não encontrado' });

  const ascents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    select: { lineId: true },
  });
  const ascendedIds = new Set(ascents.map((a) => a.lineId));
  const userAscents = await prisma.ascent.findMany({
    where: { userId: dbUser.id },
    select: { lineId: true, rating: true, gradeSuggestion: true },
  });

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
  const ratingAgg = await prisma.ascent.groupBy({
    by: ['lineId'],
    where: { lineId: { in: block.lines.map((l) => l.id) }, rating: { not: null } },
    _avg: { rating: true },
  });
  const ratingMap = Object.fromEntries(ratingAgg.map((r) => [r.lineId, r._avg.rating]));

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

  return res.json({
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
});

app.post('/api/ascent', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { lineId } = req.body;
  if (!lineId) return res.status(400).json({ error: 'lineId é obrigatório' });

  const existing = await prisma.ascent.findUnique({
    where: { userId_lineId: { userId: dbUser.id, lineId } },
  });
  if (existing) return res.json({ message: 'Já registrado' });

  await prisma.ascent.create({
    data: { userId: dbUser.id, lineId, isFlash: false, isProject: false },
  });
  return res.json({ success: true });
});

app.delete('/api/ascent', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) return res.status(404).json({ error: 'Usuário não encontrado' });

  const lineId = req.query.lineId as string;
  if (!lineId) return res.status(400).json({ error: 'lineId obrigatório' });

  const ascent = await prisma.ascent.findUnique({
    where: { userId_lineId: { userId: dbUser.id, lineId } },
  });
  if (!ascent) return res.status(404).json({ error: 'Ascensão não encontrada' });

  await prisma.ascent.delete({ where: { id: ascent.id } });
  return res.json({ success: true });
});

app.put('/api/ascent/review', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const dbUser = await resolveDbUser(user);
  if (!dbUser) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { lineId, rating, gradeSuggestion } = req.body;
  if (!lineId) return res.status(400).json({ error: 'lineId obrigatório' });

  const ascent = await prisma.ascent.findUnique({
    where: { userId_lineId: { userId: dbUser.id, lineId } },
  });
  if (!ascent) return res.status(404).json({ error: 'Ascensão não encontrada' });

  await prisma.ascent.update({
    where: { id: ascent.id },
    data: { rating: rating ?? null, gradeSuggestion: gradeSuggestion || null },
  });
  return res.json({ success: true });
});

app.post('/api/user/accepted-rules', async (req, res) => {
  const user = await getAuthUserFromAuthHeader(req.headers.authorization);
  if (!user?.email) return res.status(401).json({ error: 'Não autorizado' });

  const rulesData = {
    rulesAccepted: true,
    rulesAcceptedAt: new Date(),
    rulesVersion: '1.0',
  };

  const existingUser = await resolveDbUser(user);
  if (existingUser) {
    await prisma.user.update({ where: { id: existingUser.id }, data: rulesData });
  } else {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        ...rulesData,
      },
    });
  }

  return res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!email || !password || !name || !username) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ou nome de usuário já em uso.' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: await bcrypt.hash(password, 10),
      },
    });

    return res.json({ success: true, userId: user.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q ?? '');
  if (!q.trim() || q.trim().length < 2) return res.json({ results: [] });

  const searchTerm = q.trim().toLowerCase();
  const sectors = await prisma.sector.findMany({
    where: { name: { contains: searchTerm, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  const blocks = await prisma.block.findMany({
    where: { name: { contains: searchTerm, mode: 'insensitive' } },
    select: { id: true, name: true, sector: { select: { id: true, name: true } } },
  });
  const lines = await prisma.line.findMany({
    where: { name: { contains: searchTerm, mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      block: { select: { id: true, name: true, sector: { select: { id: true, name: true } } } },
    },
  });

  return res.json({
    results: [
      ...sectors.map((s) => ({
        type: 'sector' as const,
        id: s.id,
        name: s.name,
        url: `/croqui/${s.id}`,
      })),
      ...blocks.map((b) => ({
        type: 'block' as const,
        id: b.id,
        name: b.name,
        parent: b.sector.name,
        url: `/croqui/${b.sector.id}/${b.id}`,
      })),
      ...lines.map((l) => ({
        type: 'line' as const,
        id: l.id,
        name: l.name,
        parent: `${l.block.name} (${l.block.sector.name})`,
        url: `/croqui/${l.block.sector.id}/${l.block.id}?expandLine=${l.id}`,
      })),
    ],
  });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
