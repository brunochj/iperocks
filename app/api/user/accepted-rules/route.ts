// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function POST() {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
//   }

//   await prisma.user.update({
//     where: { id: session.user.id },
//     data: {
//       rulesAccepted: true,
//       rulesAcceptedAt: new Date(),
//       rulesVersion: "1.0",
//     },
//   });

//   return NextResponse.json({ success: true });
// }

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const rulesData = {
    rulesAccepted: true,
    rulesAcceptedAt: new Date(),
    rulesVersion: '1.0',
  };

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.email }],
    },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: rulesData,
    });
  } else {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        ...rulesData,
      },
    });
  }

  return NextResponse.json({ success: true });
}