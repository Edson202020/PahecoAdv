import { db } from "./db";
import { diaDoCompromisso, hojeSP } from "./formatos";
import type { ItemAgenda } from "@/components/ListaCompromissos";

/** Compromissos pendentes até `dias` à frente, separados em atrasados, hoje e próximos. */
export async function agendaPendente(opcoes: { responsavelId?: string; dias: number }) {
  const hoje = hojeSP();
  const limite = new Date(`${hoje}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() + opcoes.dias + 1);
  const itens: ItemAgenda[] = await db.compromisso.findMany({
    where: { status: "PENDENTE", inicio: { lt: limite }, ...(opcoes.responsavelId && { responsavelId: opcoes.responsavelId }) },
    orderBy: { inicio: "asc" },
    include: { processo: { select: { id: true, titulo: true } }, responsavel: { select: { nome: true } } },
  });
  const atrasados: ItemAgenda[] = [], deHoje: ItemAgenda[] = [], proximos: ItemAgenda[] = [];
  for (const c of itens) {
    const dia = diaDoCompromisso(c);
    if (dia < hoje) atrasados.push(c);
    else if (dia === hoje) deHoje.push(c);
    else proximos.push(c);
  }
  return { atrasados, deHoje, proximos };
}
