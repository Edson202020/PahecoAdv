// Conversões usadas na importação do backup do Astrea (arquivos CSV).
import type { AreaDireito } from "@prisma/client";
import { normalizarCnj } from "./formatos";

/** "dd/mm/aaaa", "dd/mm/aaaa hh:mm" ou "aaaa-mm-dd" como data pura (meia-noite UTC). */
export function dataAstrea(valor: string | undefined): Date | null {
  const v = valor?.trim();
  if (!v) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(v);
  const [ano, mes, dia] = m ? [m[3], m[2], m[1]] : (/^(\d{4})-(\d{2})-(\d{2})/.exec(v)?.slice(1) ?? []);
  if (!ano || Number(ano) > 2100 || Number(ano) < 1900) return null;
  const d = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Data e hora em horário de Brasília (UTC-3). Sem hora, usa `horaPadrao`. */
export function dataHoraAstrea(data: string | undefined, hora?: string, horaPadrao = "00:00"): Date | null {
  const d = dataAstrea(data);
  if (!d) return null;
  const h = /(\d{2}):(\d{2})/.exec(hora?.trim() || data?.slice(10) || "")?.slice(1, 3).join(":") ?? horaPadrao;
  return new Date(`${d.toISOString().slice(0, 10)}T${h}:00-03:00`);
}

const UF_TJ = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SE", "SP", "TO"];

/** Sigla do tribunal pelo segmento J.TR do número CNJ (Res. CNJ 65/2008). */
export function tribunalDoCnj(cnj: string | null): string | null {
  const m = cnj && /^\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2})\.\d{4}$/.exec(cnj);
  if (!m) return null;
  const [j, tr] = [m[1], Number(m[2])];
  if (j === "1") return "STF";
  if (j === "3") return "STJ";
  if (j === "4") return `TRF${tr}`;
  if (j === "5") return tr === 0 ? "TST" : `TRT${tr}`;
  if (j === "8") return UF_TJ.at(tr - 1) ? `TJ${UF_TJ.at(tr - 1)}` : null;
  return null;
}

/** Área provável a partir do número, vara e tipo de ação; o escritório pode corrigir depois. */
export function areaProvavel(cnj: string | null, vara: string, tipoAcao: string): AreaDireito {
  const texto = `${vara} ${tipoAcao}`.toLowerCase();
  if (cnj && /\.5\.\d{2}\./.test(cnj)) return "TRABALHISTA";
  if (/trabalh/.test(texto)) return "TRABALHISTA";
  if (/fam[ií]lia|sucess|invent[aá]rio|div[oó]rcio|alimentos/.test(texto)) return "FAMILIA_SUCESSOES";
  if (/criminal|penal|crime/.test(texto)) return "CRIMINAL";
  if (/previd|inss|benef[ií]cio/.test(texto)) return "PREVIDENCIARIO";
  if (/tribut|fiscal/.test(texto)) return "TRIBUTARIO";
  if (/societ|empresarial|fal[eê]ncia|recupera[cç][aã]o judicial/.test(texto)) return "SOCIETARIO";
  if (/imobili|usucapi|loca[cç][aã]o|despejo/.test(texto)) return "IMOBILIARIO";
  return "CIVEL";
}

export function numeroProcesso(valor: string): { cnj: string | null; alternativo: string | null } {
  const v = valor.trim();
  if (!v) return { cnj: null, alternativo: null };
  const cnj = normalizarCnj(v);
  return cnj ? { cnj, alternativo: null } : { cnj: null, alternativo: v };
}

export const lista = (v: string | undefined) => (v ?? "").split(";").map((x) => x.trim()).filter(Boolean);

export function extrairCnj(texto: string): string | null {
  const m = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.exec(texto);
  return m ? normalizarCnj(m[0]) : null;
}
