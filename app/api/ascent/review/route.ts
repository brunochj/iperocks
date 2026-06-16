import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: supabaseUser.email! } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { lineId, rating, gradeSuggestion } = await req.json();
  if (!lineId) {
    return NextResponse.json({ error: "lineId obrigatório" }, { status: 400 });
  }

  const ascent = await prisma.ascent.findUnique({
    where: { userId_lineId: { userId: user.id, lineId } },
  });
  if (!ascent) {
    return NextResponse.json({ error: "Ascensão não encontrada" }, { status: 404 });
  }

  await prisma.ascent.update({
    where: { id: ascent.id },
    data: {
      rating: rating ?? null,
      gradeSuggestion: gradeSuggestion || null, // se for string vazia, vira null
    },
  });

  return NextResponse.json({ success: true });
}