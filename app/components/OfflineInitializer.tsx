'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/hooks/useUser';
import { initDatabase, populateDatabaseFromJSON } from '@/lib/sqlite';
import { isOnline } from '@/lib/offline/connectivity';
import { apiFetch } from '@/lib/api-fetch';

export function OfflineInitializer() {
  const { user, loading } = useUser();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // @capacitor-community/sqlite only works on native iOS/Android — skip on web.
    if (!Capacitor.isNativePlatform()) return;
    if (loading || !user || initialized) return;

    const initOffline = async () => {
      try {
        const db = await initDatabase();

        // Verificar se já há dados
        const countResult = await db.query('SELECT COUNT(*) as total FROM sectors');
        const count = countResult.values?.[0]?.total || 0;

        if (count === 0) {
          // Tentar baixar dados da API se online
          if (isOnline()) {
            try {
              // Exemplo: baixar setores, blocos, linhas da API
              // Você pode criar endpoints específicos para isso se quiser
              // Por enquanto, usamos o JSON embutido mesmo
              console.log('🌐 Online, baixando dados iniciais da API...');
              await populateDatabaseFromJSON();
            } catch (error) {
              console.warn('Falha ao baixar da API, usando JSON local.');
              await populateDatabaseFromJSON();
            }
          } else {
            await populateDatabaseFromJSON();
          }
        }

        setInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar banco offline:', error);
      }
    };

    initOffline();
  }, [user, loading, initialized]);

  return null;
}