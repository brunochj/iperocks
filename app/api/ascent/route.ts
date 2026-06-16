import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Get Prisma user from Supabase email
  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { lineId } = await req.json();
  if (!lineId) {
    return NextResponse.json({ error: "lineId é obrigatório" }, { status: 400 });
  }

  // Verificar se já existe ascensão
  const existing = await prisma.ascent.findUnique({
    where: {
      userId_lineId: {
        userId: user.id,
        lineId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ message: "Já registrado" }, { status: 200 });
  }

  await prisma.ascent.create({
    data: {
      userId: user.id,
      lineId,
      isFlash: false,
      isProject: false,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Get Prisma user from Supabase email
  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const url = new URL(req.url);
  const lineId = url.searchParams.get("lineId");
  if (!lineId) {
    return NextResponse.json({ error: "lineId obrigatório" }, { status: 400 });
  }

  const ascent = await prisma.ascent.findUnique({
    where: {
      userId_lineId: {
        userId: user.id,
        lineId,
      },
    },
  });

  if (!ascent) {
    return NextResponse.json({ error: "Ascensão não encontrada" }, { status: 404 });
  }

  await prisma.ascent.delete({ where: { id: ascent.id } });
  return NextResponse.json({ success: true });
}