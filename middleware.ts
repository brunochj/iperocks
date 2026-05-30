export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/croqui/:path*", "/perfil/:path*"], // ajuste conforme suas rotas
}