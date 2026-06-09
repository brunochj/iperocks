import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    rememberMe?: boolean;
  }

  interface Session {
    rememberMe?: boolean;
    user: {
      id: string;
      rulesAccepted: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rulesAccepted?: boolean;
    rememberMe?: boolean;
  }
}
