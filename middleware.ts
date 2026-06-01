import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname;

    // Se não estiver logado, o withAuth já cuida do redirecionamento para /login
    if (!token) return NextResponse.next();

    const isOnboarding = req.nextUrl.pathname === "/onboarding"
    const isCroqui = req.nextUrl.pathname === "/croqui" || req.nextUrl.pathname.startsWith("/croqui")
    
    // Se usuário logado e NÃO aceitou regras, redirecionar para onboarding
    if (!token.rulesAccepted && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }
    
    // Se já aceitou e tentar acessar onboarding, redireciona para croqui
    if (token.rulesAccepted && isOnboarding) {
      return NextResponse.redirect(new URL("/croqui", req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // exige login em todas as rotas protegidas
    },
  }
)

export const config = {
  matcher: ["/croqui/:path*", "/onboarding", "/perfil/:path*"],
}
