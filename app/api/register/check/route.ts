import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, username } = await req.json();

  if (!email || !username) {
    return NextResponse.json(
      { error: 'Email e nome de usuário são obrigatórios.' },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email ou nome de usuário já em uso.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ available: true });
}
