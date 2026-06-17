// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function PUT(req: Request) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.email) {
//     return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
//   }

//   const user = await prisma.user.findUnique({ where: { email: session.user.email } });
//   if (!user) {
//     return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
//   }

//   const { lineId, rating, gradeSuggestion } = await req.json();
//   if (!lineId) {
//     return NextResponse.json({ error: "lineId obrigatório" }, { status: 400 });
//   }

//   const ascent = await prisma.ascent.findUnique({
//     where: { userId_lineId: { userId: user.id, lineId } },
//   });
//   if (!ascent) {
//     return NextResponse.json({ error: "Ascensão não encontrada" }, { status: 404 });
//   }

//   await prisma.ascent.update({
//     where: { id: ascent.id },
//     data: {
//       rating: rating ?? null,
//       gradeSuggestion: gradeSuggestion || null, // se for string vazia, vira null
//     },
//   });

//   return NextResponse.json({ success: true });
// }

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  // 1. Autenticação via Supabase (servidor)
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Buscar usuário no banco (Neon) usando o email do Supabase
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // 3. Validar dados da requisição
  const { lineId, rating, gradeSuggestion } = await req.json();
  if (!lineId) {
    return NextResponse.json({ error: 'lineId obrigatório' }, { status: 400 });
  }

  // 4. Verificar se a ascensão existe e pertence ao usuário
  const ascent = await prisma.ascent.findUnique({
    where: {
      userId_lineId: {
        userId: dbUser.id,
        lineId,
      },
    },
  });

  if (!ascent) {
    return NextResponse.json({ error: 'Ascensão não encontrada' }, { status: 404 });
  }

  // 5. Atualizar a ascensão
  await prisma.ascent.update({
    where: { id: ascent.id },
    data: {
      rating: rating ?? null,
      gradeSuggestion: gradeSuggestion || null,
    },
  });

  return NextResponse.json({ success: true });
}