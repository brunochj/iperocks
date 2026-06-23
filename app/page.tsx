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
import { useEffect, useRef } from "react";
import { isOAuthInProgress } from "@/lib/auth/oauth";
import { navigateTo, isCurrentPath } from "@/lib/navigate";

export default function RootPage() {
  const { user, loading } = useUser();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (loading || isOAuthInProgress()) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    if (!user) {
      navigateTo("/login");
    } else if (!user.rulesAccepted) {
      navigateTo("/onboarding");
    } else if (!isCurrentPath("/home")) {
      navigateTo("/home");
    }
  }, [user, loading]);

  return <div>Carregando...</div>;
}