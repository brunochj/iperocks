'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import LinesClient from './LinesClient';

export default function LinesPageClient({
  params,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [dataReady, setDataReady] = useState(false);
  const [expandLineId, setExpandLineId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const { sectorId, blockId } = await params;
        const expandLine = searchParams.get('expandLine');
        setExpandLineId(expandLine || null);

        const res = await apiFetch(`/api/sectors/${sectorId}/blocks/${blockId}/lines`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Erro ao carregar linhas:', error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user, params, searchParams]);

  if (loading || !dataReady) return <div>Carregando...</div>;
  if (!user || !data) return null;

  return (
    <LinesClient
      blockName={data.blockName}
      blockDescription={data.blockDescription}
      lines={data.lines}
      ascendedIds={new Set(data.ascendedIds)}
      grades={data.grades}
      alertsByLine={data.alertsByLine}
      ratingMap={data.ratingMap}
      gradeSuggestionMap={data.gradeSuggestionMap}
      expandLineId={expandLineId}
      userAscents={data.userAscents}
    />
  );
}
