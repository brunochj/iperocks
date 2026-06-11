import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <p className="mt-2">Em breve você poderá editar suas informações.</p>
    </div>
  );
}