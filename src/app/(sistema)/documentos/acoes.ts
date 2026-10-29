"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import { MODELOS_PADRAO } from "@/lib/modelos-padrao";
import type { EstadoForm } from "@/components/Formulario";

export async function salvarModelo(id: string | null, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("processos:editar_proprios");
  const nome = String(dados.get("nome") ?? "").trim();
  const conteudo = String(dados.get("conteudo") ?? "");
  const categoria = String(dados.get("categoria") ?? "").trim() || null;
  if (!nome || !conteudo.trim()) return { erro: "Informe o nome e o texto do modelo." };
  try {
    const m = id
      ? await db.modeloDocumento.update({ where: { id }, data: { nome, conteudo, categoria } })
      : await db.modeloDocumento.create({ data: { nome, conteudo, categoria } });
    await registrar(usuario.id, id ? "editar" : "criar", "ModeloDocumento", m.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { erro: "Já existe um modelo com esse nome." };
    throw e;
  }
  redirect("/documentos");
}

export async function excluirModelo(id: string) {
  const usuario = await exigir("processos:editar_proprios");
  await db.modeloDocumento.delete({ where: { id } });
  await registrar(usuario.id, "excluir", "ModeloDocumento", id);
  redirect("/documentos");
}

export async function instalarModelosPadrao() {
  await exigir("processos:editar_proprios");
  await db.modeloDocumento.createMany({ data: MODELOS_PADRAO, skipDuplicates: true });
  redirect("/documentos");
}
