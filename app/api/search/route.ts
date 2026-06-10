import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const searchTerm = q.trim().toLowerCase();

  // Buscar setores (limite 5)
  const sectors = await prisma.sector.findMany({
    where: { name: { contains: searchTerm, mode: "insensitive" } },
    select: { id: true, name: true },
    // take: 5,
  });

  // Buscar blocos (inclui nome do setor pai)
  const blocks = await prisma.block.findMany({
    where: { name: { contains: searchTerm, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      sector: { select: { id: true, name: true } },
    },
    // take: 5,
  });

  // Buscar linhas (inclui nome do bloco e do setor)
  const lines = await prisma.line.findMany({
    where: { name: { contains: searchTerm, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      block: {
        select: {
          id: true,
          name: true,
          sector: { select: { id: true, name: true } },
        },
      },
    },
    // take: 5,
  });

  const results = [
    ...sectors.map((s) => ({
      type: "sector" as const,
      id: s.id,
      name: s.name,
      url: `/croqui/${s.id}`,
    })),
    ...blocks.map((b) => ({
      type: "block" as const,
      id: b.id,
      name: b.name,
      parent: b.sector.name,
      url: `/croqui/${b.sector.id}/${b.id}`,
    })),
    ...// app/api/search/route.ts (trecho das linhas)
    lines.map((l) => ({
      type: "line" as const,
      id: l.id,
      name: l.name,
      parent: `${l.block.name} (${l.block.sector.name})`,
      url: `/croqui/${l.block.sector.id}/${l.block.id}?expandLine=${l.id}`,
    })),
  ];

  return NextResponse.json({ results });
}