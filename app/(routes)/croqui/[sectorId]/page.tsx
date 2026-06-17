import BlocksPageClient from './BlocksPageClient';
import { getSectorStaticParams } from '@/lib/croqui-static-params';

export function generateStaticParams() {
  return getSectorStaticParams();
}

export default function BlocksPage({
  params,
}: {
  params: Promise<{ sectorId: string }>;
}) {
  return <BlocksPageClient params={params} />;
}
