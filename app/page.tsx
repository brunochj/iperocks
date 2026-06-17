// import { redirect } from "next/navigation";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// export default async function RootPage() {
//   const session = await getServerSession(authOptions);
  
//   if (!session) {
//     redirect("/login");
//   }
  
//   if (!session.user.rulesAccepted) {
//     redirect("/onboarding");
//   }
  
//   redirect("/home");
// }

'use client';

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (!user.rulesAccepted) {
      router.push("/onboarding");
    } else {
      router.push("/home");
    }
  }, [user, loading, router]);

  return <div>Carregando...</div>;
}