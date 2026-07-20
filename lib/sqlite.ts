// lib/sqlite.ts
import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

let db: SQLiteDBConnection | null = null;

// Inicializa o banco de dados e cria as tabelas
export async function initDatabase() {
  if (db) return db;

  const sqlite = new SQLiteConnection(Capacitor);
  try {
    db = await sqlite.createConnection('iperocks', false, 'no-encryption', 1, false);
    await db.open();

    // Criar tabelas se não existirem
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sectors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "order" INTEGER DEFAULT 0
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "order" INTEGER DEFAULT 0,
        sectorId TEXT,
        FOREIGN KEY (sectorId) REFERENCES sectors (id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS lines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade TEXT,
        description TEXT,
        imageUrl TEXT,
        blockId TEXT,
        FOREIGN KEY (blockId) REFERENCES blocks (id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ascents (
        id TEXT PRIMARY KEY,
        lineId TEXT NOT NULL,
        userId TEXT NOT NULL,
        rating INTEGER,
        gradeSuggestion TEXT,
        synced INTEGER DEFAULT 0,
        createdAt TEXT,
        FOREIGN KEY (lineId) REFERENCES lines (id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT,
        resolved INTEGER DEFAULT 0,
        lineId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT
      );
    `);

    console.log('✅ Banco SQLite inicializado');
    return db;
  } catch (error) {
    console.error('❌ Erro ao inicializar SQLite:', error);
    throw error;
  }
}

// -------- SECTORS --------
export async function getSectors() {
  const db = await initDatabase();
  const result = await db.query('SELECT * FROM sectors ORDER BY "order" ASC');
  return result.values || [];
}

// -------- BLOCKS --------
export async function getBlocksBySector(sectorId: string) {
  const db = await initDatabase();
  const result = await db.query('SELECT * FROM blocks WHERE sectorId = ? ORDER BY "order" ASC', [sectorId]);
  return result.values || [];
}

// -------- LINES --------
export async function getLinesByBlock(blockId: string) {
  const db = await initDatabase();
  const result = await db.query('SELECT * FROM lines WHERE blockId = ? ORDER BY name ASC', [blockId]);
  return result.values || [];
}

// -------- ASCENTS --------
export async function getAscents(userId: string) {
  const db = await initDatabase();
  const result = await db.query('SELECT * FROM ascents WHERE userId = ?', [userId]);
  return result.values || [];
}

export async function getAscentsByLine(lineId: string, userId: string) {
  const db = await initDatabase();
  const result = await db.query('SELECT * FROM ascents WHERE lineId = ? AND userId = ?', [lineId, userId]);
  return result.values || [];
}

export async function addAscent(lineId: string, userId: string, rating?: number, gradeSuggestion?: string) {
  const db = await initDatabase();
  const id = `ascent-${Date.now()}`;
  const createdAt = new Date().toISOString();
  await db.run(
    'INSERT INTO ascents (id, lineId, userId, rating, gradeSuggestion, synced, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, lineId, userId, rating || null, gradeSuggestion || null, 0, createdAt]
  );
  return id;
}

export async function updateAscentRating(lineId: string, userId: string, rating: number, gradeSuggestion?: string) {
  const db = await initDatabase();
  await db.run(
    'UPDATE ascents SET rating = ?, gradeSuggestion = ? WHERE lineId = ? AND userId = ?',
    [rating, gradeSuggestion || null, lineId, userId]
  );
}

export async function deleteAscent(lineId: string, userId: string) {
  const db = await initDatabase();
  await db.run('DELETE FROM ascents WHERE lineId = ? AND userId = ?', [lineId, userId]);
}

// -------- POPULATE INITIAL DATA (primeira execução) --------
export async function populateDatabaseFromJSON() {
  const db = await initDatabase();

  // Verifica se já há dados
  const count = await db.query('SELECT COUNT(*) as total FROM sectors');
  const total = count.values?.[0]?.total || 0;
  if (total > 0) {
    console.log('📦 Banco já populado, pulando seed.');
    return;
  }

  console.log('🌱 Populando banco com dados iniciais...');

  // Importar JSONs (você pode mantê-los em data/ ou embutir no bundle)
  try {
    const sectors = await import('@/data/sectors.json').then(m => m.default);
    for (const sector of sectors) {
      await db.run(
        'INSERT INTO sectors (id, name, description, "order") VALUES (?, ?, ?, ?)',
        [sector.id, sector.name, sector.description || '', sector.order || 0]
      );
    }

    const blocks = await import('@/data/blocks.json').then(m => m.default);
    for (const block of blocks) {
      await db.run(
        'INSERT INTO blocks (id, name, description, "order", sectorId) VALUES (?, ?, ?, ?, ?)',
        [block.id, block.name, block.description || '', block.order || 0, block.sectorId]
      );
    }

    const lines = await import('@/data/lines.json').then(m => m.default);
    for (const line of lines) {
      await db.run(
        'INSERT INTO lines (id, name, grade, description, imageUrl, blockId) VALUES (?, ?, ?, ?, ?, ?)',
        [line.id, line.name, line.grade, line.description || '', line.imageUrl || '', line.blockId]
      );
    }

    console.log('✅ Dados iniciais importados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao importar dados iniciais:', error);
  }
}

// -------- ALERTS --------
export async function getAlertsByLine(lineIds: string[]) {
    const db = await initDatabase();
    if (lineIds.length === 0) return {};
    const placeholders = lineIds.map(() => '?').join(',');
    const result = await db.query(
      `SELECT lineId, type FROM alerts WHERE lineId IN (${placeholders}) AND resolved = 0`,
      lineIds
    );
    const alertsMap: Record<string, string[]> = {};
    for (const row of result.values || []) {
      if (!alertsMap[row.lineId]) alertsMap[row.lineId] = [];
      alertsMap[row.lineId].push(row.type);
    }
    return alertsMap;
  }
  
  // -------- RATING --------
  export async function getAverageRating(lineIds: string[]) {
    const db = await initDatabase();
    if (lineIds.length === 0) return {};
    const placeholders = lineIds.map(() => '?').join(',');
    const result = await db.query(
      `SELECT lineId, AVG(rating) as avgRating FROM ascents WHERE lineId IN (${placeholders}) AND rating IS NOT NULL GROUP BY lineId`,
      lineIds
    );
    const map: Record<string, number> = {};
    for (const row of result.values || []) {
      map[row.lineId] = row.avgRating;
    }
    return map;
  }
  
  // -------- GRADE SUGGESTION --------
  export async function getMostCommonGradeSuggestion(lineIds: string[]) {
    const db = await initDatabase();
    if (lineIds.length === 0) return {};
    const placeholders = lineIds.map(() => '?').join(',');
    const result = await db.query(
      `SELECT lineId, gradeSuggestion, COUNT(*) as count FROM ascents 
       WHERE lineId IN (${placeholders}) AND gradeSuggestion IS NOT NULL 
       GROUP BY lineId, gradeSuggestion ORDER BY lineId, count DESC`,
      lineIds
    );
    const map: Record<string, string> = {};
    for (const row of result.values || []) {
      if (!map[row.lineId]) {
        map[row.lineId] = row.gradeSuggestion;
      }
    }
    return map;
  }

  // -------- MY ASCENTS --------

export async function getAscentsByUser(userId: string): Promise<any[]> {
    const db = await initDatabase();
    const result = await db.query(
      'SELECT * FROM ascents WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
    return result.values || [];
  }
  
  export async function getAscentsByUserWithDetails(userId: string): Promise<any[]> {
    const db = await initDatabase();
    const result = await db.query(
      `SELECT 
         ascents.id,
         ascents.lineId,
         ascents.rating,
         ascents.gradeSuggestion,
         ascents.createdAt,
         lines.name as lineName,
         lines.grade,
         lines.description,
         lines.imageUrl,
         blocks.id as blockId,
         blocks.sectorId
       FROM ascents 
       INNER JOIN lines ON ascents.lineId = lines.id
       INNER JOIN blocks ON lines.blockId = blocks.id
       WHERE ascents.userId = ?
       ORDER BY ascents.createdAt DESC`,
      [userId]
    );
    return result.values || [];
  }
  
  export async function getDistinctGradesFromAscents(userId: string): Promise<string[]> {
    const db = await initDatabase();
    const result = await db.query(
      `SELECT DISTINCT lines.grade 
       FROM ascents 
       INNER JOIN lines ON ascents.lineId = lines.id 
       WHERE ascents.userId = ?`,
      [userId]
    );
    return (result.values || []).map(row => row.grade);
  }

  // -------- RANKING --------

export async function getRankingUsers(limit: number): Promise<any[]> {
    const db = await initDatabase();
    // Esta consulta assume que você tem uma tabela `users` local com campo `ascents` (contagem)
    // Se você não tiver, você pode usar a função `getAllUsersWithAscentCount` (veja abaixo)
    // ou sincronizar periodicamente uma tabela de ranking.
    const result = await db.query(
      `SELECT id, name, username, image, 
         (SELECT COUNT(*) FROM ascents WHERE ascents.userId = users.id) as ascents
       FROM users 
       WHERE isAdmin = 0
       ORDER BY ascents DESC 
       LIMIT ?`,
      [limit]
    );
    return result.values || [];
  }
  
  // Caso você não tenha a tabela `users` local (apenas no Supabase),
  // você pode armazenar um snapshot do ranking em uma tabela separada.
  // Exemplo de tabela `ranking_cache`:
  // CREATE TABLE ranking_cache (userId TEXT, name TEXT, username TEXT, image TEXT, ascents INTEGER, updatedAt TEXT)
  // E uma função para buscar do cache:
  export async function getRankingFromCache(): Promise<any[]> {
    const db = await initDatabase();
    const result = await db.query(
      'SELECT userId as id, name, username, image, ascents FROM ranking_cache WHERE isAdmin = 0 ORDER BY ascents DESC'
    );
    return result.values || [];
  }