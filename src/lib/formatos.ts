// Formatação e validação de dados usados nas telas.

const dataBR = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dataHoraBR = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatarData = (d: Date | null | undefined) => (d ? dataBR.format(d) : "");
export const formatarDataHora = (d: Date | null | undefined) => (d ? dataHoraBR.format(d) : "");
export const formatarMoeda = (v: number | string | { toString(): string } | null | undefined) =>
  v == null ? "" : moeda.format(Number(v.toString()));

/** Data AAAA-MM-DD de um campo de formulário, em UTC. */
export function lerData(valor: FormDataEntryValue | null): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  return new Date(`${valor}T00:00:00Z`);
}

export const paraCampoData = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export const somenteDigitos = (s: string) => s.replace(/\D/g, "");

/** Número único CNJ (Res. CNJ 65/2008): NNNNNNN-DD.AAAA.J.TR.OOOO, dígito verificador módulo 97. */
export function normalizarCnj(valor: string): string | null {
  const d = somenteDigitos(valor);
  if (d.length !== 20) return null;
  const n = d.slice(0, 7), dv = d.slice(7, 9), ano = d.slice(9, 13), j = d.slice(13, 14),
    tr = d.slice(14, 16), origem = d.slice(16, 20);
  const resto = BigInt(n + ano + j + tr + origem + "00") % 97n;
  const esperado = (98n - resto).toString().padStart(2, "0");
  if (esperado !== dv) return null;
  return `${n}-${dv}.${ano}.${j}.${tr}.${origem}`;
}

function digitoCpfCnpj(base: string, pesos: number[]): number {
  const soma = base.split("").reduce((acc, c, i) => acc + Number(c) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoCpfCnpj(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoCpfCnpj(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d.endsWith(`${d1}${d2}`);
}

export function validarCnpj(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const d1 = digitoCpfCnpj(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoCpfCnpj(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d.endsWith(`${d1}${d2}`);
}

/** Prazos guardam só a data (meia-noite UTC); os demais compromissos têm horário de Brasília. */
export const formatarQuando = (c: { tipo: string; inicio: Date }) =>
  c.tipo === "PRAZO" ? formatarData(c.inicio) : formatarDataHora(c.inicio);

/** Lê um campo datetime-local como horário de Brasília (sem horário de verão desde 2019). */
export function lerDataHora(valor: FormDataEntryValue | null): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  return new Date(`${valor}:00-03:00`);
}

const diaSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/** Dia (AAAA-MM-DD) em que o compromisso acontece no calendário de Brasília. */
export const diaDoCompromisso = (c: { tipo: string; inicio: Date }) =>
  c.tipo === "PRAZO" ? c.inicio.toISOString().slice(0, 10) : diaSP.format(c.inicio);

export const hojeSP = () => diaSP.format(new Date());
