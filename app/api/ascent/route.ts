import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";  // ← importa daqui
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { lineId } = await req.json();
  if (!lineId) {
    return NextResponse.json({ error: "lineId é obrigatório" }, { status: 400 });
  }

  // Verificar se já existe ascensão
  const existing = await prisma.ascent.findUnique({
    where: {
      userId_lineId: {
        userId: session.user.id,
        lineId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ message: "Já registrado" }, { status: 200 });
  }

  await prisma.ascent.create({
    data: {
      userId: session.user.id,
      lineId,
      isFlash: false,
      isProject: false,
    },
  });

  return NextResponse.json({ success: true });
}