import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <p className="mt-2">Em breve você poderá editar suas informações.</p>
    </div>
  );
}