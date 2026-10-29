import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { Perfil } from "@prisma/client";
import { db } from "./db";
import { pode, type Permissao } from "./permissoes";
import { registrar } from "./auditoria";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        const email = credenciais?.email?.trim().toLowerCase();
        const senha = credenciais?.senha;
        if (!email || !senha) return null;
        const usuario = await db.usuario.findUnique({ where: { email } });
        if (!usuario || !usuario.ativo) return null;
        if (!(await bcrypt.compare(senha, usuario.senhaHash))) return null;
        await registrar(usuario.id, "login", "Usuario", usuario.id);
        return { id: usuario.id, name: usuario.nome, email: usuario.email, perfil: usuario.perfil };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = user.perfil;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.perfil = token.perfil;
      return session;
    },
  },
};

export interface UsuarioSessao {
  id: string;
  nome: string;
  perfil: Perfil;
}

/** Usuário logado; redireciona para o login se não houver sessão ou se o acesso foi bloqueado. */
export async function usuarioAtual(): Promise<UsuarioSessao> {
  const sessao = await getServerSession(authOptions);
  if (!sessao?.user?.id) redirect("/login");
  const usuario = await db.usuario.findUnique({ where: { id: sessao.user.id } });
  if (!usuario?.ativo) redirect("/login");
  return { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
}

export async function exigir(permissao: Permissao): Promise<UsuarioSessao> {
  const usuario = await usuarioAtual();
  if (!pode(usuario.perfil, permissao)) throw new Error("Seu perfil não tem permissão para esta ação.");
  return usuario;
}
