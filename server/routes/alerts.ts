import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromAuthHeader } from '@/lib/server/auth-user';

const router = Router();

// POST /api/alerts - Criar alerta
router.post('/', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { lineId, type, description } = req.body;
    if (!lineId || !type) {
      return res.status(400).json({ error: 'lineId e type são obrigatórios' });
    }

    const validTypes = ['NEST', 'BROKEN_HOLD', 'FALL_RISK', 'NO_ACCESS'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de alerta inválido' });
    }

    const line = await prisma.line.findUnique({ where: { id: lineId } });
    if (!line) {
      return res.status(404).json({ error: 'Linha não encontrada' });
    }

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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/alerts/:id - Resolver alerta
router.patch('/:id', async (req, res) => {
  try {
    const user = await getAuthUserFromAuthHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const alertId = req.params.id;
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { resolved: true },
    });

    res.json({ success: true, alert: updated });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;