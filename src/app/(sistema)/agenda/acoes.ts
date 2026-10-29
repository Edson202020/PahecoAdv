"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ContagemPrazo, TipoCompromisso } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir, usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { registrar } from "@/lib/auditoria";
import { calcularPrazo, chave } from "@/lib/prazos";
import { feriadosPara } from "@/lib/feriados";
import { lerData, lerDataHora } from "@/lib/formatos";
import type { EstadoForm } from "@/components/Formulario";

async function tribunalDo(processoId: string | null) {
  if (!processoId) return null;
  const p = await db.processo.findUnique({ where: { id: processoId }, select: { tribunal: true } });
  return p?.tribunal ?? null;
}

export async function simularPrazo(entrada: {
  disponibilizacao: string;
  dias: number;
  contagem: ContagemPrazo;
  processoId: string | null;
}) {
  await usuarioAtual();
  const disponibilizacao = lerData(entrada.disponibilizacao);
  if (!disponibilizacao || !(entrada.dias >= 1)) return null;
  const feriados = await feriadosPara(await tribunalDo(entrada.processoId));
  const r = calcularPrazo({ disponibilizacao, dias: entrada.dias, contagem: entrada.contagem, feriados });
  return { publicacao: chave(r.publicacao), inicio: chave(r.inicio), vencimento: chave(r.vencimento) };
}

export async function criarCompromisso(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigir("prazos:criar");
  const tipo = dados.get("tipo") as TipoCompromisso;
  if (!Object.values(TipoCompromisso).includes(tipo)) return { erro: "Tipo inválido." };
  const titulo = String(dados.get("titulo") ?? "").trim();
  if (!titulo) return { erro: "Informe o título." };
  const processoId = (dados.get("processoId") as string) || null;
  const responsavelId = String(dados.get("responsavelId") ?? "");
  if (!responsavelId) return { erro: "Escolha o responsável." };
  const comum = {
    tipo,
    titulo,
    descricao: String(dados.get("descricao") ?? "").trim() || null,
    local: String(dados.get("local") ?? "").trim() || null,
    processoId,
    responsavelId,
  };

  let id: string;
  if (tipo === "PRAZO") {
    const disponibilizacao = lerData(dados.get("disponibilizacao"));
    const dias = Number(dados.get("dias"));
    const contagem = dados.get("contagem") as ContagemPrazo;
    if (!disponibilizacao) return { erro: "Informe a data de disponibilização." };
    if (!Number.isInteger(dias) || dias < 1) return { erro: "Informe o número de dias do prazo." };
    if (!Object.values(ContagemPrazo).includes(contagem)) return { erro: "Escolha a forma de contagem." };
    const feriados = await feriadosPara(await tribunalDo(processoId));
    const calculado = calcularPrazo({ disponibilizacao, dias, contagem, feriados });
    // Se o advogado ajustou o vencimento manualmente, vale o ajuste.
    const vencimento = lerData(dados.get("vencimento")) ?? calculado.vencimento;
    ({ id } = await db.compromisso.create({
      data: {
        ...comum,
        inicio: vencimento,
        dataPublicacao: calculado.publicacao,
        diasPrazo: dias,
        contagem,
        // Prazo lançado por quem pode confirmar já nasce confirmado.
        confirmado: pode(usuario.perfil, "prazos:confirmar") && dados.get("confirmar") === "1",
      },
    }));
  } else {
    const inicio = lerDataHora(dados.get("inicio"));
    if (!inicio) return { erro: "Informe a data e o horário." };
    ({ id } = await db.compromisso.create({ data: { ...comum, inicio, confirmado: true } }));
  }
  await registrar(usuario.id, "criar", "Compromisso", id);
  redirect(processoId ? `/processos/${processoId}` : "/agenda");
}

async function alterar(id: string, acao: string, data: { status?: "CONCLUIDO" | "CANCELADO"; confirmado?: boolean }) {
  const usuario = await usuarioAtual();
  const c = await db.compromisso.findUniqueOrThrow({ where: { id } });
  if (data.confirmado && !pode(usuario.perfil, "prazos:confirmar")) {
    throw new Error("Somente advogados confirmam prazos.");
  }
  if (data.status && c.responsavelId !== usuario.id && !pode(usuario.perfil, "processos:editar_todos")) {
    throw new Error("Somente o responsável pode concluir ou cancelar este compromisso.");
  }
  await db.compromisso.update({ where: { id }, data });
  await registrar(usuario.id, acao, "Compromisso", id);
  revalidatePath("/agenda");
  revalidatePath("/");
}

export async function concluir(id: string) {
  await alterar(id, "concluir", { status: "CONCLUIDO" });
}
export async function cancelar(id: string) {
  await alterar(id, "cancelar", { status: "CANCELADO" });
}
export async function confirmar(id: string) {
  await alterar(id, "confirmar", { confirmado: true });
}
