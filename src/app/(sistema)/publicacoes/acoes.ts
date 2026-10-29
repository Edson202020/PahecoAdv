"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import { normalizarCnj } from "@/lib/formatos";
import { vincularPorNumero } from "@/lib/publicacoes";
import type { EstadoForm } from "@/components/Formulario";

async function alterar(id: string, acao: string, data: { tratada?: boolean; descartada?: boolean }) {
  const usuario = await exigir("prazos:criar");
  await db.publicacao.update({ where: { id }, data });
  await registrar(usuario.id, acao, "Publicacao", id);
  revalidatePath("/publicacoes");
}

export async function marcarTratada(id: string) {
  await alterar(id, "tratar", { tratada: true, descartada: false });
}
export async function descartar(id: string) {
  await alterar(id, "descartar", { tratada: true, descartada: true });
}
export async function reabrir(id: string) {
  await alterar(id, "reabrir", { tratada: false, descartada: false });
}

export async function vincular(id: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("prazos:criar");
  const numero = normalizarCnj(String(dados.get("numero") ?? ""));
  if (!numero) return { erro: "Número CNJ inválido." };
  const processo = await db.processo.findUnique({ where: { numeroCnj: numero } });
  if (!processo) return { erro: "Nenhum processo cadastrado com esse número." };
  await db.publicacao.update({
    where: { id },
    data: { processoId: processo.id, responsavelId: processo.responsavelId },
  });
  await registrar(usuario.id, "vincular", "Publicacao", id, { processoId: processo.id });
  revalidatePath("/publicacoes");
  return {};
}

export async function distribuir(id: string, dados: FormData) {
  const usuario = await exigir("prazos:criar");
  const responsavelId = String(dados.get("responsavelId") ?? "") || null;
  await db.publicacao.update({ where: { id }, data: { responsavelId } });
  await registrar(usuario.id, "distribuir", "Publicacao", id, { responsavelId });
  revalidatePath("/publicacoes");
}

export async function vincularAutomaticamente() {
  const usuario = await exigir("prazos:criar");
  const n = await vincularPorNumero();
  await registrar(usuario.id, "vincular_automatico", "Publicacao", undefined, { quantidade: n });
  revalidatePath("/publicacoes");
}
