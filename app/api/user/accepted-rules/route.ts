import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Update user metadata in Supabase (no longer using Prisma for this)
  const { error } = await supabase.auth.updateUser({
    data: { 
      rulesAccepted: true,
      rulesAcceptedAt: new Date().toISOString(),
      rulesVersion: "1.0",
    }
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}