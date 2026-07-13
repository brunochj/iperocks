// lib/offline/queue.ts
import { openDB } from 'idb';

const DB_NAME = 'iperocks-queue';
const STORE_NAME = 'pending';

export type PendingOperation = {
  id?: number;
  endpoint: string;
  method: string;
  body: any;
  headers?: Record<string, string>;
  createdAt: string;
  retries: number;
};

export async function getQueueDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

export async function enqueueOperation(operation: Omit<PendingOperation, 'id' | 'createdAt' | 'retries'>) {
  const db = await getQueueDB();
  const id = await db.add(STORE_NAME, {
    ...operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  return id;
}

export async function dequeueOperation(id: number) {
  const db = await getQueueDB();
  await db.delete(STORE_NAME, id);
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await getQueueDB();
  return db.getAll(STORE_NAME);
}

export async function getPendingOperationsCount(): Promise<number> {
  const db = await getQueueDB();
  return db.count(STORE_NAME);
}

export async function clearQueue() {
  const db = await getQueueDB();
  await db.clear(STORE_NAME);
}