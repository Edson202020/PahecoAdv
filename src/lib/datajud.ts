// Andamentos pela API Pública do DataJud (CNJ).
// Endereço e campos conforme o tutorial do CNJ:
// https://www.cnj.jus.br/wp-content/uploads/2023/05/tutorial-api-publica-datajud-beta.pdf
// A chave de acesso fica em DATAJUD_API_KEY (obtida na página da API Pública do DataJud).
import { db } from "./db";
import { somenteDigitos } from "./formatos";

const BASE = "https://api-publica.datajud.cnj.jus.br";

export interface MovimentoDataJud {
  codigo?: number;
  nome?: string;
  dataHora?: string;
  complementosTabelados?: { nome?: string; descricao?: string; valor?: number }[];
}

/** Alias do tribunal no DataJud: TJSP vira api_publica_tjsp, TRT2 vira api_publica_trt2. */
export const aliasDataJud = (tribunal: string) => `api_publica_${tribunal.toLowerCase()}`;

export function descreverMovimento(m: MovimentoDataJud): string {
  const complementos = (m.complementosTabelados ?? [])
    .map((c) => [c.descricao, c.nome].filter(Boolean).join(": "))
    .filter(Boolean);
  return [m.nome ?? "Movimento", ...complementos].join("\n");
}

export async function buscarMovimentos(tribunal: string, numeroCnj: string, chave: string): Promise<MovimentoDataJud[]> {
  const resposta = await fetch(`${BASE}/${aliasDataJud(tribunal)}/_search`, {
    method: "POST",
    headers: { Authorization: `APIKey ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { match: { numeroProcesso: somenteDigitos(numeroCnj) } } }),
  });
  if (!resposta.ok) throw new Error(`DataJud respondeu ${resposta.status} para ${numeroCnj}`);
  const corpo = (await resposta.json()) as { hits?: { hits?: { _source?: { movimentos?: MovimentoDataJud[] } }[] } };
  // Um processo pode ter um registro por grau de jurisdição; juntamos todos.
  return (corpo.hits?.hits ?? []).flatMap((h) => h._source?.movimentos ?? []);
}

/**
 * Grava como andamento os movimentos posteriores ao último andamento já registrado,
 * para não repetir o histórico que veio do Astrea.
 */
export async function sincronizarProcesso(
  processo: { id: string; numeroCnj: string; tribunal: string },
  chave: string,
): Promise<number> {
  const ultimo = await db.andamento.findFirst({
    where: { processoId: processo.id },
    orderBy: { data: "desc" },
    select: { data: true },
  });
  const movimentos = await buscarMovimentos(processo.tribunal, processo.numeroCnj, chave);
  const novos = movimentos
    .filter((m) => m.dataHora && !Number.isNaN(Date.parse(m.dataHora)))
    .map((m) => ({ ...m, data: new Date(m.dataHora!) }))
    .filter((m) => !ultimo || m.data > ultimo.data);
  if (!novos.length) return 0;
  const r = await db.andamento.createMany({
    data: novos.map((m) => ({
      processoId: processo.id,
      data: m.data,
      descricao: descreverMovimento(m),
      tipo: "DataJud",
      origem: "DATAJUD" as const,
      codigoExterno: String(m.codigo ?? ""),
    })),
    skipDuplicates: true,
  });
  return r.count;
}

const TRIBUNAIS_SUPORTADOS = /^(TJ[A-Z]{2}|TRT\d{1,2}|TRF\d|TST|STJ)$/;

export async function sincronizarTodos(chave: string, aoProgredir?: (feitos: number, total: number) => void) {
  const processos = await db.processo.findMany({
    where: { status: "ATIVO", numeroCnj: { not: null }, tribunal: { not: null } },
    select: { id: true, numeroCnj: true, tribunal: true },
  });
  const alvo = processos.filter((p) => TRIBUNAIS_SUPORTADOS.test(p.tribunal!));
  let novos = 0;
  const falhas: string[] = [];
  for (const [i, p] of alvo.entries()) {
    try {
      novos += await sincronizarProcesso({ id: p.id, numeroCnj: p.numeroCnj!, tribunal: p.tribunal! }, chave);
    } catch (e) {
      falhas.push(`${p.numeroCnj}: ${(e as Error).message}`);
    }
    aoProgredir?.(i + 1, alvo.length);
    await new Promise((r) => setTimeout(r, 250)); // não sobrecarregar a API do CNJ
  }
  return { processos: alvo.length, novos, falhas };
}
