"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TipoLancamento } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { registrar } from "@/lib/auditoria";
import { lerData } from "@/lib/formatos";
import type { EstadoForm } from "@/components/Formulario";

export async function criarLancamento(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("financeiro:editar");
  const tipo = dados.get("tipo") as TipoLancamento;
  if (!Object.values(TipoLancamento).includes(tipo)) return { erro: "Tipo inválido." };
  const descricao = String(dados.get("descricao") ?? "").trim();
  const valor = Number(String(dados.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const vencimento = lerData(dados.get("vencimento"));
  if (!descricao) return { erro: "Informe a descrição." };
  if (!(valor > 0)) return { erro: "Informe um valor maior que zero." };
  if (!vencimento) return { erro: "Informe o vencimento." };
  const pagamento = lerData(dados.get("pagamento"));
  const opcional = (k: string) => (dados.get(k) as string) || null;
  const { id } = await db.lancamento.create({
    data: {
      tipo,
      descricao,
      valor,
      vencimento,
      pagamento,
      status: pagamento ? "PAGO" : "ABERTO",
      subtipo: opcional("subtipo"),
      reembolsavel: dados.get("reembolsavel") === "1",
      contaId: opcional("contaId"),
      categoriaId: opcional("categoriaId"),
      clienteId: opcional("clienteId"),
      processoId: opcional("processoId"),
    },
  });
  await registrar(usuario.id, "criar", "Lancamento", id);
  redirect("/financeiro");
}

export async function marcarPago(id: string) {
  const usuario = await exigir("financeiro:editar");
  const hoje = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  await db.lancamento.update({ where: { id }, data: { status: "PAGO", pagamento: hoje } });
  await registrar(usuario.id, "baixar", "Lancamento", id);
  revalidatePath("/financeiro");
}

export async function cancelarLancamento(id: string) {
  const usuario = await exigir("financeiro:editar");
  await db.lancamento.update({ where: { id }, data: { status: "CANCELADO" } });
  await registrar(usuario.id, "cancelar", "Lancamento", id);
  revalidatePath("/financeiro");
}

export async function marcarFaturaPaga(id: string) {
  const usuario = await exigir("financeiro:editar");
  const hoje = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  await db.$transaction([
    db.fatura.update({ where: { id }, data: { status: "PAGA", pagamento: hoje } }),
    db.lancamento.updateMany({ where: { faturaId: id, status: "ABERTO" }, data: { status: "PAGO", pagamento: hoje } }),
  ]);
  await registrar(usuario.id, "baixar", "Fatura", id);
  revalidatePath("/financeiro/faturas");
}
