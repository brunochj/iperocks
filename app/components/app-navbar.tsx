"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import AppHeader from "./app-header";
import AppFooterNav from "./app-footer-nav";

const AUTH_PATHS = ["/login", "/register", "/onboarding"];

export default function AppNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") return null;
  if (!session?.user?.rulesAccepted) return null;
  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <>
      {/* <AppHeader /> */}
      <AppFooterNav />
    </>
  );
}
