'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlocksBySector } from '@/lib/data/croqui';

export default function BlocksPageClient({
  params,
}: {
  params: Promise<{ sectorId: string }>;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    void params.then(({ sectorId }) => setSectorId(sectorId));
  }, [params]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !sectorId) return;

    const loadData = async () => {
      try {
        setBlocks(getBlocksBySector(sectorId));
      } catch (error) {
        console.error('Erro ao carregar blocos:', error);
      } finally {
        setDataReady(true);
      }
    };

    void loadData();
  }, [user, sectorId]);

  if (loading || !dataReady || !sectorId) return <div>Carregando...</div>;
  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Blocos</h1>
      <div className="grid grid-cols-1 gap-4">
        {blocks.map((block: any) => (
          <Link
            key={block.id}
            href={`/croqui/${sectorId}/${block.id}`}
            className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{block.name}</h2>
            {block.description && (
              <p className="text-gray-600 text-sm mt-1">{block.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
