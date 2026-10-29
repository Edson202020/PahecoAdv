"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, TipoPessoa } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import { somenteDigitos, validarCnpj, validarCpf } from "@/lib/formatos";
import type { EstadoForm } from "@/components/Formulario";

const vazioParaNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const opcional = z.preprocess(vazioParaNull, z.string().trim().nullable());

const esquema = z.object({
  tipo: z.nativeEnum(TipoPessoa),
  nome: z.string().trim().min(2, "Informe o nome."),
  cpfCnpj: opcional,
  rg: opcional,
  email: z.preprocess(vazioParaNull, z.string().trim().email("E-mail inválido.").nullable()),
  telefone: opcional,
  endereco: opcional,
  observacoes: opcional,
});

function lerCliente(dados: FormData) {
  const r = esquema.safeParse(Object.fromEntries(dados));
  if (!r.success) return { erro: r.error.issues[0].message } as const;
  const c = r.data;
  if (c.cpfCnpj) {
    const valido = c.tipo === "FISICA" ? validarCpf(c.cpfCnpj) : validarCnpj(c.cpfCnpj);
    if (!valido) return { erro: c.tipo === "FISICA" ? "CPF inválido." : "CNPJ inválido." } as const;
    c.cpfCnpj = somenteDigitos(c.cpfCnpj);
  }
  return { dados: c } as const;
}

function erroBanco(e: unknown): EstadoForm {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { erro: "Já existe um cliente com este CPF/CNPJ." };
  }
  throw e;
}

export async function criarCliente(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("clientes:editar");
  const lido = lerCliente(dados);
  if ("erro" in lido) return { erro: lido.erro };
  let id: string;
  try {
    ({ id } = await db.cliente.create({ data: lido.dados }));
  } catch (e) {
    return erroBanco(e);
  }
  await registrar(usuario.id, "criar", "Cliente", id);
  redirect(`/clientes/${id}`);
}

export async function editarCliente(id: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("clientes:editar");
  const lido = lerCliente(dados);
  if ("erro" in lido) return { erro: lido.erro };
  try {
    await db.cliente.update({ where: { id }, data: lido.dados });
  } catch (e) {
    return erroBanco(e);
  }
  await registrar(usuario.id, "editar", "Cliente", id);
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}
