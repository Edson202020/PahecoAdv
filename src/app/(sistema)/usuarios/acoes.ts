"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Perfil, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import type { EstadoForm } from "@/components/Formulario";

export async function criarUsuario(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const admin = await exigir("usuarios:gerenciar");
  const nome = String(dados.get("nome") ?? "").trim();
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  const perfil = dados.get("perfil") as Perfil;
  const oab = String(dados.get("oab") ?? "").trim() || null;
  if (!nome || !email) return { erro: "Informe nome e e-mail." };
  if (senha.length < 10) return { erro: "A senha inicial deve ter ao menos 10 caracteres." };
  if (!Object.values(Perfil).includes(perfil)) return { erro: "Perfil inválido." };
  try {
    const u = await db.usuario.create({
      data: { nome, email, perfil, oab, senhaHash: await bcrypt.hash(senha, 12) },
    });
    await registrar(admin.id, "criar", "Usuario", u.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { erro: "E-mail já cadastrado." };
    throw e;
  }
  revalidatePath("/usuarios");
  return {};
}

export async function alternarAtivo(id: string) {
  const admin = await exigir("usuarios:gerenciar");
  if (id === admin.id) throw new Error("Você não pode bloquear o próprio acesso.");
  const u = await db.usuario.findUniqueOrThrow({ where: { id } });
  await db.usuario.update({ where: { id }, data: { ativo: !u.ativo } });
  await registrar(admin.id, u.ativo ? "bloquear" : "desbloquear", "Usuario", id);
  revalidatePath("/usuarios");
}

export async function redefinirSenha(id: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const admin = await exigir("usuarios:gerenciar");
  const senha = String(dados.get("senha") ?? "");
  if (senha.length < 10) return { erro: "A senha deve ter ao menos 10 caracteres." };
  await db.usuario.update({ where: { id }, data: { senhaHash: await bcrypt.hash(senha, 12) } });
  await registrar(admin.id, "redefinir_senha", "Usuario", id);
  return {};
}
