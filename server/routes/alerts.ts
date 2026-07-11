import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromAuthHeader } from '@/lib/server/auth-user';

const router = Router();

// GET /api/alerts – Listar alertas com paginação e filtros
router.get('/', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const where: any = { resolved: false };
    if (req.query.lineId) where.lineId = req.query.lineId as string;
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.blockId) {
      where.line = { blockId: req.query.blockId as string };
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          user: { select: { name: true, username: true } },
          line: {
            select: {
              id: true,
              name: true,
              block: {
                select: {
                  id: true,
                  name: true,
                  sectorId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/alerts/line/:lineId – Alertas ativos de uma linha específica
router.get('/line/:lineId', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const alerts = await prisma.alert.findMany({
      where: { lineId: req.params.lineId, resolved: false },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Erro ao buscar alertas da linha:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/alerts/count – Contagem total de alertas ativos (para badge)
router.get('/count', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const count = await prisma.alert.count({ where: { resolved: false } });
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar alertas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/alerts – Criar alerta
router.post('/', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const { lineId, type, description } = req.body;
    if (!lineId || !type) {
      return res.status(400).json({ error: 'lineId e type são obrigatórios' });
    }

    const validTypes = ['NEST', 'BROKEN_HOLD', 'FALL_RISK', 'NO_ACCESS'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de alerta inválido' });
    }

    const line = await prisma.line.findUnique({ where: { id: lineId } });
    if (!line) return res.status(404).json({ error: 'Linha não encontrada' });

    const alert = await prisma.alert.create({
      data: {
        type,
        description: description || null,
        lineId,
        userId: user.id,
      },
    });

    res.status(201).json({ success: true, alert });
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/alerts/:id – Resolver alerta
router.patch('/:id', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const alertId = req.params.id;
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { resolved: true },
    });

    res.json({ success: true, alert: updated });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;