'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import LinesClient from './LinesClient';
import { SkeletonCard, SkeletonText } from '@/app/components/Skeleton';
import { getLinesByBlock, getBlockById, getAlertsByLine } from '@/lib/data/croqui';

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
        console.error('Erro ao carregar linhas, usando dados locais:', error);
        // Offline fallback: use bundled JSON data
        try {
          const { blockId } = await params;
          const block = getBlockById(blockId);
          const offlineLines = getLinesByBlock(blockId);
          const lineIds = offlineLines.map((l) => l.id);
          const alertsByLine = getAlertsByLine(lineIds);

          setData({
            blockName: block?.name || '',
            blockDescription: block?.description || '',
            lines: offlineLines,
            ascendedIds: [],
            grades: [...new Set(offlineLines.map((l) => l.grade))].sort(),
            alertsByLine,
            ratingMap: {},
            gradeSuggestionMap: {},
            userAscents: [],
          });
        } catch (fallbackError) {
          console.error('Erro no fallback offline:', fallbackError);
        }
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user, params, searchParams]);

  if (loading || !dataReady) {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <SkeletonCard>
          <SkeletonText lines={1} className="mb-2" />
          <SkeletonText lines={2} />
        </SkeletonCard>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonText lines={3} />
          </SkeletonCard>
        ))}
      </div>
    );
  }
  
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
