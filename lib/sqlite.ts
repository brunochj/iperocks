// lib/sqlite.ts
import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let db: SQLiteDBConnection | null = null

export async function initSQLite() {
  if (Capacitor.isNativePlatform()) {
    const sqlite = new SQLiteConnection(CapacitorSQLite)
    // Abre ou cria o banco
    const conn = await sqlite.createConnection('iperocks_db', false, 'no-encryption', 1)
    await conn.open()
    db = conn
    await createTables()
  } else {
    // Fallback para web: usar localStorage (simples)
    // Você pode criar uma implementação mock ou usar IndexedDB
    console.warn('SQLite não disponível na web, usando localStorage mock')
  }
}

async function createTables() {
  if (!db) return
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      "order" INTEGER
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      "order" INTEGER,
      sectorId TEXT,
      FOREIGN KEY (sectorId) REFERENCES sectors(id)
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lines (
      id TEXT PRIMARY KEY,
      name TEXT,
      grade TEXT,
      description TEXT,
      imageUrl TEXT,
      blockId TEXT,
      FOREIGN KEY (blockId) REFERENCES blocks(id)
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ascents (
      id TEXT PRIMARY KEY,
      lineId TEXT,
      userId TEXT,
      rating INTEGER,
      gradeSuggestion TEXT,
      completedAt INTEGER,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (lineId) REFERENCES lines(id)
    )
  `)
  // Adicione outras tabelas: reviews, alerts, etc.
}

export async function getSectors() {
  if (db) {
    const result = await db.query('SELECT * FROM sectors ORDER BY "order"')
    return result.values
  }
  // fallback web
  return JSON.parse(localStorage.getItem('sectors') || '[]')
}

export async function getBlocksBySector(sectorId: string) {
  if (db) {
    const result = await db.query('SELECT * FROM blocks WHERE sectorId = ? ORDER BY "order"', [sectorId])
    return result.values
  }
  // fallback
  const all = JSON.parse(localStorage.getItem('blocks') || '[]')
  return all.filter((b: any) => b.sectorId === sectorId)
}

// ... etc.