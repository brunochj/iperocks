import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { sectorId: string } }
) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const blocks = await prisma.block.findMany({
    where: { sectorId: params.sectorId },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ blocks });
}