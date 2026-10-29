"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import { lerData } from "@/lib/formatos";
import type { EstadoForm } from "@/components/Formulario";

export async function criarFeriado(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const admin = await exigir("usuarios:gerenciar");
  const data = lerData(dados.get("data"));
  const descricao = String(dados.get("descricao") ?? "").trim();
  const tribunal = String(dados.get("tribunal") ?? "").trim().toUpperCase() || null;
  if (!data || !descricao) return { erro: "Informe a data e a descrição." };
  // O índice único não impede duplicidade quando o tribunal é vazio.
  if (await db.feriado.findFirst({ where: { data, tribunal } })) return { erro: "Feriado já cadastrado." };
  try {
    const f = await db.feriado.create({ data: { data, descricao, tribunal } });
    await registrar(admin.id, "criar", "Feriado", f.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { erro: "Feriado já cadastrado." };
    throw e;
  }
  revalidatePath("/feriados");
  return {};
}

export async function excluirFeriado(id: string) {
  const admin = await exigir("usuarios:gerenciar");
  await db.feriado.delete({ where: { id } });
  await registrar(admin.id, "excluir", "Feriado", id);
  revalidatePath("/feriados");
}
