import type { Prisma } from "@prisma/client";
import { db } from "./db";

export async function registrar(
  usuarioId: string | null,
  acao: string,
  entidade: string,
  entidadeId?: string,
  detalhes?: Prisma.InputJsonValue,
) {
  await db.registroAuditoria.create({ data: { usuarioId, acao, entidade, entidadeId, detalhes } });
}
