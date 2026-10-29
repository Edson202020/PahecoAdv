import { withAuth } from "next-auth/middleware";

export default withAuth({ pages: { signIn: "/login" } });

// Tudo exige login, exceto a tela de login, a autenticação e arquivos estáticos.
export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon).*)"],
};
