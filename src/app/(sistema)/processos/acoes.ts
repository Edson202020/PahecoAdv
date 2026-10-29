"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AreaDireito, Prisma, StatusProcesso } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir, usuarioAtual } from "@/lib/auth";
import { pode, podeEditarProcesso } from "@/lib/permissoes";
import { registrar } from "@/lib/auditoria";
import { lerData, normalizarCnj } from "@/lib/formatos";
import type { EstadoForm } from "@/components/Formulario";

const vazioParaNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const opcional = z.preprocess(vazioParaNull, z.string().trim().nullable());

const esquema = z.object({
  titulo: z.string().trim().min(3, "Informe um título para o caso."),
  numeroCnj: opcional,
  area: z.nativeEnum(AreaDireito),
  status: z.nativeEnum(StatusProcesso).default("ATIVO"),
  tribunal: opcional,
  vara: opcional,
  comarca: opcional,
  parteContraria: opcional,
  valorCausa: z.preprocess(
    (v) => (typeof v === "string" ? vazioParaNull(v.replace(/\./g, "").replace(",", ".")) : v),
    z.coerce.number().nonnegative("Valor da causa inválido.").nullable(),
  ),
  responsavelId: z.string().min(1, "Escolha o advogado responsável."),
  observacoes: opcional,
});

function lerProcesso(dados: FormData) {
  const r = esquema.safeParse(Object.fromEntries(dados));
  if (!r.success) return { erro: r.error.issues[0].message } as const;
  const { numeroCnj, ...resto } = r.data;
  let numero: string | null = null;
  if (numeroCnj) {
    numero = normalizarCnj(numeroCnj);
    if (!numero) return { erro: "Número CNJ inválido. Confira os 20 dígitos." } as const;
  }
  return {
    dados: {
      ...resto,
      numeroCnj: numero,
      consultivo: !numero,
      dataDistribuicao: lerData(dados.get("dataDistribuicao")),
    },
  } as const;
}

function erroBanco(e: unknown): EstadoForm {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { erro: "Já existe um processo com este número." };
  }
  throw e;
}

export async function criarProcesso(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await usuarioAtual();
  if (!pode(usuario.perfil, "processos:editar_proprios")) return { erro: "Seu perfil não pode cadastrar processos." };
  const lido = lerProcesso(dados);
  if ("erro" in lido) return { erro: lido.erro };
  if (!pode(usuario.perfil, "processos:editar_todos") && lido.dados.responsavelId !== usuario.id) {
    return { erro: "Você só pode cadastrar processos sob sua responsabilidade." };
  }
  const clienteId = dados.get("clienteId");
  const polo = dados.get("polo");
  let id: string;
  try {
    ({ id } = await db.processo.create({
      data: {
        ...lido.dados,
        clientes:
          typeof clienteId === "string" && clienteId
            ? { create: { clienteId, polo: typeof polo === "string" && polo ? polo : null } }
            : undefined,
      },
    }));
  } catch (e) {
    return erroBanco(e);
  }
  await registrar(usuario.id, "criar", "Processo", id);
  redirect(`/processos/${id}`);
}

async function exigirEdicao(processoId: string) {
  const usuario = await usuarioAtual();
  const processo = await db.processo.findUniqueOrThrow({ where: { id: processoId } });
  if (!podeEditarProcesso(usuario.perfil, usuario.id, processo.responsavelId)) {
    throw new Error("Seu perfil não pode editar este processo.");
  }
  return usuario;
}

export async function editarProcesso(id: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirEdicao(id);
  const lido = lerProcesso(dados);
  if ("erro" in lido) return { erro: lido.erro };
  try {
    await db.processo.update({ where: { id }, data: lido.dados });
  } catch (e) {
    return erroBanco(e);
  }
  await registrar(usuario.id, "editar", "Processo", id);
  revalidatePath(`/processos/${id}`);
  return {};
}

export async function vincularCliente(processoId: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirEdicao(processoId);
  const clienteId = dados.get("clienteId");
  if (typeof clienteId !== "string" || !clienteId) return { erro: "Escolha o cliente." };
  const polo = dados.get("polo");
  await db.processoCliente.upsert({
    where: { processoId_clienteId: { processoId, clienteId } },
    create: { processoId, clienteId, polo: typeof polo === "string" && polo ? polo : null },
    update: { polo: typeof polo === "string" && polo ? polo : null },
  });
  await registrar(usuario.id, "vincular_cliente", "Processo", processoId, { clienteId });
  revalidatePath(`/processos/${processoId}`);
  return {};
}

export async function adicionarAndamento(processoId: string, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  // Estagiário também registra andamentos (especificação, perfis de acesso).
  const usuario = await exigir("prazos:criar");
  const data = lerData(dados.get("data"));
  const descricao = String(dados.get("descricao") ?? "").trim();
  if (!data || !descricao) return { erro: "Informe a data e a descrição do andamento." };
  await db.andamento.create({ data: { processoId, data, descricao } });
  await registrar(usuario.id, "criar", "Andamento", processoId);
  revalidatePath(`/processos/${processoId}`);
  return {};
}
