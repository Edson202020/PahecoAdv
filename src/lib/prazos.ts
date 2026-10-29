// Cálculo de prazos processuais.
//
// Regras aplicadas (o advogado sempre confirma o resultado):
// - Publicação no DJEN: considera-se publicada no primeiro dia útil seguinte
//   à disponibilização (CPC, art. 224, §§ 2º e 3º).
// - Exclui-se o dia do começo e inclui-se o do vencimento (CPC, art. 224, caput).
// - Prazos em dias úteis (CPC, art. 219; CLT, art. 775).
// - Suspensão entre 20 de dezembro e 20 de janeiro (CPC, art. 220; CLT, art. 775-A).
// - Vencimento em dia não útil é prorrogado para o primeiro dia útil seguinte
//   (CPC, art. 224, § 1º).

export type Contagem = "DIAS_UTEIS" | "DIAS_CORRIDOS";

export interface EntradaPrazo {
  disponibilizacao: Date;
  dias: number;
  contagem: Contagem;
  /** Datas sem expediente, no formato AAAA-MM-DD. */
  feriados: Iterable<string>;
}

export interface ResultadoPrazo {
  publicacao: Date;
  inicio: Date;
  vencimento: Date;
}

const DIA = 24 * 60 * 60 * 1000;

/** Normaliza para meia-noite UTC, evitando erros de fuso horário. */
export function soData(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function chave(d: Date): string {
  return soData(d).toISOString().slice(0, 10);
}

function somaDias(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DIA);
}

export function emRecesso(d: Date): boolean {
  const mes = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  return (mes === 12 && dia >= 20) || (mes === 1 && dia <= 20);
}

export function diaUtil(d: Date, feriados: Set<string>): boolean {
  const semana = d.getUTCDay();
  return semana !== 0 && semana !== 6 && !feriados.has(chave(d));
}

function proximoDiaUtil(d: Date, feriados: Set<string>): Date {
  let atual = somaDias(d, 1);
  while (!diaUtil(atual, feriados)) atual = somaDias(atual, 1);
  return atual;
}

export function calcularPrazo(entrada: EntradaPrazo): ResultadoPrazo {
  if (!Number.isInteger(entrada.dias) || entrada.dias < 1) {
    throw new Error("O prazo deve ter ao menos 1 dia.");
  }
  const feriados = new Set(entrada.feriados);
  const publicacao = proximoDiaUtil(soData(entrada.disponibilizacao), feriados);

  // O prazo só conta em dias com expediente e fora do recesso.
  const conta = (d: Date) =>
    !emRecesso(d) && (entrada.contagem === "DIAS_CORRIDOS" || diaUtil(d, feriados));

  let atual = publicacao;
  let inicio: Date | null = null;
  let contados = 0;
  while (contados < entrada.dias) {
    atual = somaDias(atual, 1);
    if (conta(atual)) {
      contados++;
      inicio ??= atual;
    }
  }

  let vencimento = atual;
  while (!diaUtil(vencimento, feriados) || emRecesso(vencimento)) {
    vencimento = somaDias(vencimento, 1);
  }

  return { publicacao, inicio: inicio!, vencimento };
}
