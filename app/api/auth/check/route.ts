// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { NextResponse } from "next/server";

// export async function GET() {
//   const session = await getServerSession(authOptions);
//   return NextResponse.json({ session });
// }

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ session: null });
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.email ?? undefined }],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      rulesAccepted: true,
    },
  });

  return NextResponse.json({
    session: {
      user: {
        id: dbUser?.id ?? user.id,
        email: user.email,
        name: dbUser?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? null,
        username: dbUser?.username ?? null,
        image: dbUser?.image ?? user.user_metadata?.avatar_url ?? null,
        rulesAccepted: dbUser?.rulesAccepted ?? false,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}