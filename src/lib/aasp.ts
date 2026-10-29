import { db } from "./db";
import { normalizarCnj } from "./formatos";

// API de Intimações da AASP (serviço para associados).
// Endereço e parâmetros conforme o material público da AASP; os nomes dos campos de cada
// intimação ainda não foram confirmados na documentação técnica, por isso a leitura abaixo
// aceita as variações mais prováveis e guarda o texto bruto quando não reconhece o campo.
const BASE = "https://intimacaoapi.aasp.org.br/api/Associado/intimacao/json";

type Item = Record<string, unknown>;

export function urlIntimacoes(chave: string, data: Date) {
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(data);
  return `${BASE}?${new URLSearchParams({ chave, data: dia, diferencial: "false" })}`;
}

/** Procura o primeiro campo com um dos nomes, sem diferenciar maiúsculas. */
function campo(item: Item, ...nomes: string[]): string | null {
  const chaves = Object.keys(item);
  for (const nome of nomes) {
    const k = chaves.find((c) => c.toLowerCase() === nome.toLowerCase());
    const v = k ? item[k] : undefined;
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

function lerDataApi(valor: string | null): Date | null {
  if (!valor) return null;
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(Date.UTC(+br[3], +br[2] - 1, +br[1]));
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  return null;
}

export function converterIntimacao(item: Item, diaConsulta: Date) {
  const texto =
    campo(item, "textoPublicacao", "texto", "conteudo", "publicacao", "textoIntimacao") ??
    Object.entries(item).map(([k, v]) => `${k}: ${v}`).join("\n");
  const numeroBruto = campo(item, "numeroProcesso", "processo", "numeroUnicoProcesso", "numero_processo");
  const numero = (numeroBruto && normalizarCnj(numeroBruto)) || texto.match(/\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/)?.[0];
  return {
    idExterno: campo(item, "codigoRelacionamento", "codigo", "id", "idIntimacao", "numeroPublicacao"),
    dataDisponibilizacao: lerDataApi(campo(item, "dataDisponibilizacao", "dataDivulgacao", "data")) ?? diaConsulta,
    dataPublicacao: lerDataApi(campo(item, "dataPublicacao")),
    diario: campo(item, "jornal", "nomeJornal", "diario", "siglaJornal"),
    orgao: campo(item, "orgao", "tribunal", "titulo"),
    vara: campo(item, "vara", "secao", "nomeVara"),
    numeroProcesso: numero ? normalizarCnj(numero) ?? numero : null,
    texto,
  };
}

export async function buscarIntimacoes(chave: string, data: Date): Promise<Item[]> {
  const resposta = await fetch(urlIntimacoes(chave, data), { cache: "no-store" });
  if (!resposta.ok) throw new Error(`AASP respondeu ${resposta.status}`);
  const corpo = await resposta.json();
  const lista = Array.isArray(corpo) ? corpo : (corpo?.intimacoes ?? corpo?.Intimacoes ?? []);
  return Array.isArray(lista) ? lista : [];
}

/** Grava as intimações do dia, sem duplicar. Devolve quantas eram novas. */
export async function importarIntimacoes(chave: string, data: Date) {
  const itens = await buscarIntimacoes(chave, data);
  let novas = 0;
  for (const item of itens) {
    const pub = converterIntimacao(item, data);
    // Sem código próprio, usa data + início do texto como identificador estável.
    const idExterno = pub.idExterno ?? `${pub.dataDisponibilizacao.toISOString().slice(0, 10)}:${hash(pub.texto)}`;
    const existe = await db.publicacao.findUnique({ where: { origem_idExterno: { origem: "AASP", idExterno } } });
    if (existe) continue;
    await db.publicacao.create({ data: { ...pub, idExterno, origem: "AASP" } });
    novas++;
  }
  return { recebidas: itens.length, novas };
}

function hash(texto: string) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}
