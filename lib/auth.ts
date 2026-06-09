// lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
export const SESSION_MAX_AGE = 30 * 60; // 30 minutes without remember me

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Seu provedor do Google continua aqui
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ✨ Novo provedor de e-mail/senha
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: {
          label: "Email ou Usuário",
          type: "text",
          placeholder: "email@exemplo.com ou usuario",
        },
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        const raw =
          credentials?.identifier?.trim() || credentials?.email?.trim();
        const rememberMe = credentials?.rememberMe === "true";

        if (!raw || !password) {
          return null;
        }

        const username = raw.startsWith("@") ? raw.slice(1) : raw;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: raw, mode: "insensitive" } },
              { username: { equals: username, mode: "insensitive" } },
            ],
          },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe,
        };
      },
    })
  ],
  session: {
    strategy: "jwt",
    // Cookie container lifetime (max). Actual expiry is set per login in the JWT `exp` claim.
    maxAge: REMEMBER_ME_MAX_AGE,
    // Don't slide/extend the session on activity — keeps the 30 min timer accurate.
    updateAge: 0,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login", // Redireciona para sua página de login customizada
  },
  callbacks: {
    // Seus callbacks podem continuar os mesmos
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.rememberMe = user.rememberMe ?? true;
      }

      // Set session timer inside the cookie JWT on login.
      if (user) {
        const maxAge = token.rememberMe ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }

      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { rulesAccepted: true },
        });
        token.rulesAccepted = dbUser?.rulesAccepted ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.rulesAccepted = token.rulesAccepted;
        session.rememberMe = token.rememberMe ?? true;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };