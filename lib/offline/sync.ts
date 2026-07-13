// lib/offline/sync.ts
import { apiFetch } from '@/lib/api-fetch';
import {
  getPendingOperations,
  dequeueOperation,
  enqueueOperation,
  PendingOperation,
} from './queue';
import { isOnline } from './connectivity';

const MAX_RETRIES = 5;
const SYNC_INTERVAL = 30000; // 30 segundos

export async function syncPendingOperations() {
  if (!isOnline()) {
    console.log('[Sync] Offline, aguardando conexão...');
    return { synced: 0, failed: 0 };
  }

  const pending = await getPendingOperations();
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Sincronizando ${pending.length} operações pendentes...`);

  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      const res = await apiFetch(op.endpoint, {
        method: op.method,
        headers: op.headers || { 'Content-Type': 'application/json' },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });

      if (res.ok) {
        await dequeueOperation(op.id!);
        synced++;
        console.log(`[Sync] ✅ ${op.method} ${op.endpoint} sincronizado`);
      } else {
        // Se for erro 401 ou 403, provavelmente token expirado – tentar mais tarde
        if (res.status === 401 || res.status === 403) {
          // Não aumentar retries para esses erros, apenas tentar de novo depois
          console.warn(`[Sync] ⚠️ Erro de autenticação em ${op.endpoint}, aguardando...`);
        } else {
          op.retries = (op.retries || 0) + 1;
          if (op.retries >= MAX_RETRIES) {
            // Desistir após muitas tentativas
            await dequeueOperation(op.id!);
            failed++;
            console.error(`[Sync] ❌ Falha permanente em ${op.endpoint} após ${MAX_RETRIES} tentativas`);
          } else {
            // Atualizar retries (reinserir com novo retry count)
            await dequeueOperation(op.id!);
            await enqueueOperation({
              endpoint: op.endpoint,
              method: op.method,
              body: op.body,
              headers: op.headers,
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Sync] ❌ Erro ao sincronizar ${op.endpoint}:`, error);
      op.retries = (op.retries || 0) + 1;
      if (op.retries < MAX_RETRIES) {
        await dequeueOperation(op.id!);
        await enqueueOperation({
          endpoint: op.endpoint,
          method: op.method,
          body: op.body,
          headers: op.headers,
        });
      } else {
        await dequeueOperation(op.id!);
        failed++;
      }
    }
  }

  return { synced, failed };
}

let syncInterval: NodeJS.Timeout | null = null;

export function startSyncScheduler() {
  if (syncInterval) return;
  syncInterval = setInterval(syncPendingOperations, SYNC_INTERVAL);
  console.log('[Sync] Scheduler iniciado');
}

export function stopSyncScheduler() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Sync] Scheduler parado');
  }
}

// Função para sincronizar quando voltar a ficar online
export function syncOnReconnect() {
  if (isOnline()) {
    console.log('[Sync] Conexão restabelecida, sincronizando...');
    syncPendingOperations();
  }
}

// Função para enfileirar uma operação e tentar sincronizar imediatamente
export async function enqueueAndSync(
  operation: Omit<PendingOperation, 'id' | 'createdAt' | 'retries'>
) {
  await enqueueOperation(operation);
  if (isOnline()) {
    // Sincronizar imediatamente, sem esperar o intervalo
    setTimeout(syncPendingOperations, 500);
  }
}