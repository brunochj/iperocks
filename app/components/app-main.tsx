"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/register", "/onboarding"];

export default function AppMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const showNav =
    status === "authenticated" &&
    !!session?.user?.rulesAccepted &&
    !AUTH_PATHS.includes(pathname);

  return (
    <main className={`flex-1 ${showNav ? "pb-20" : ""}`}>{children}</main>
  );
}
