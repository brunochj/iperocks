import { Suspense } from 'react';
import LinesPageClient from './LinesPageClient';
import { getBlockStaticParams } from '@/lib/croqui-static-params';

export function generateStaticParams() {
  return getBlockStaticParams();
}

export default function LinesPage({
  params,
}: {
  params: Promise<{ sectorId: string; blockId: string }>;
}) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LinesPageClient params={params} />
    </Suspense>
  );
}
