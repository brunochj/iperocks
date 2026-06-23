// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { redirect } from "next/navigation";

// export default async function ProfilePage() {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");
//   return (
//     <div className="max-w-2xl mx-auto p-4">
//       <h1 className="text-2xl font-bold">Meu Perfil</h1>
//       <p className="mt-2">Em breve você poderá editar suas informações.</p>
//     </div>
//   );
// }
'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <p className="mt-2">Em breve você poderá editar suas informações.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Nome:</strong> {user.name || "Não definido"}</p>
      </div>
    </div>
  );
}