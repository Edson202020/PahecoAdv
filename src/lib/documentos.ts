// Geração de documentos Word (.docx) no timbrado do escritório.
//
// O modelo é texto simples com marcações:
//   # TÍTULO               título centralizado, em negrito, com fundo e linha dourada (padrão do timbrado)
//   ## Subtítulo           parágrafo em negrito
//   **texto**              negrito
//   __texto__              sublinhado
//   {{cliente.nome}}       campo preenchido com os dados do sistema
// Campo sem valor sai em vermelho como [PREENCHER: nome do campo].
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";

const FONTE = '<w:rFonts w:ascii="Century Gothic" w:eastAsia="Aptos" w:hAnsi="Century Gothic" w:cs="Times New Roman"/>';
const ESPACAMENTO = '<w:spacing w:line="360" w:lineRule="auto"/>';

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Trecho {
  texto: string;
  negrito?: boolean;
  sublinhado?: boolean;
  pendente?: boolean;
}

function run({ texto, negrito, sublinhado, pendente }: Trecho): string {
  const props = [
    FONTE,
    negrito || pendente ? "<w:b/><w:bCs/>" : "",
    sublinhado ? '<w:u w:val="single"/>' : "",
    pendente ? '<w:color w:val="C00000"/>' : "",
    '<w:szCs w:val="18"/>',
  ].join("");
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${escapar(texto)}</w:t></w:r>`;
}

/** Quebra a linha em trechos com negrito, sublinhado e campos pendentes. */
export function trechos(linha: string, negritoBase = false): Trecho[] {
  const partes = linha.split(/(\*\*.+?\*\*|__[^_\s][^_]*?__|\[PREENCHER: [^\]]+\])/g).filter(Boolean);
  return partes.map((p) => {
    if (p.startsWith("**") && p.endsWith("**")) return { texto: p.slice(2, -2), negrito: true };
    if (/^__[^_\s][^_]*__$/.test(p)) return { texto: p.slice(2, -2), sublinhado: true, negrito: negritoBase };
    if (p.startsWith("[PREENCHER:")) return { texto: p, pendente: true };
    return { texto: p, negrito: negritoBase };
  });
}

function paragrafo(linha: string): string {
  if (linha.startsWith("# ")) {
    const pPr =
      '<w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="9C783C"/></w:pBdr>' +
      `<w:shd w:val="clear" w:color="auto" w:fill="F7F2EA"/>${ESPACAMENTO}<w:jc w:val="center"/></w:pPr>`;
    return `<w:p>${pPr}${trechos(linha.slice(2), true).map(run).join("")}</w:p>`;
  }
  if (linha.startsWith("## ")) {
    return `<w:p><w:pPr><w:keepNext/>${ESPACAMENTO}<w:jc w:val="left"/></w:pPr>${trechos(linha.slice(3), true).map(run).join("")}</w:p>`;
  }
  if (linha.startsWith(">> ")) {
    // linha centralizada (local e data, assinatura)
    return `<w:p><w:pPr>${ESPACAMENTO}<w:jc w:val="center"/></w:pPr>${trechos(linha.slice(3)).map(run).join("")}</w:p>`;
  }
  return `<w:p><w:pPr>${ESPACAMENTO}</w:pPr>${trechos(linha).map(run).join("")}</w:p>`;
}

/** Substitui {{campos}}; os que não têm valor viram [PREENCHER: campo]. */
export function preencher(texto: string, campos: Record<string, string | null | undefined>): string {
  return texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, nome: string) => {
    const valor = campos[nome]?.trim();
    return valor ? valor : `[PREENCHER: ${nome}]`;
  });
}

export function corpoXml(texto: string): string {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "")
    .map(paragrafo)
    .join("");
}

export async function gerarDocx(texto: string, campos: Record<string, string | null | undefined>): Promise<Buffer> {
  const base = await readFile(join(process.cwd(), "modelos", "timbrado.docx"));
  const zip = await JSZip.loadAsync(base);
  const documento = await zip.file("word/document.xml")!.async("string");
  zip.file("word/document.xml", documento.replace("{{CORPO}}", corpoXml(preencher(texto, campos))));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function dataPorExtenso(d: Date): string {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d).split("-").map(Number);
  return `${dia} de ${MESES.at(mes - 1)} de ${ano}`;
}

/** Campos que podem ser usados nos modelos, com a descrição mostrada na tela. */
export const CAMPOS_DISPONIVEIS: Record<string, string> = {
  "cliente.nome": "Nome ou razão social",
  "cliente.qualificacao": "Qualificação completa (nacionalidade, estado civil, profissão, documentos e endereço)",
  "cliente.cpfCnpj": "CPF ou CNPJ",
  "cliente.rg": "RG",
  "cliente.nacionalidade": "Nacionalidade",
  "cliente.estadoCivil": "Estado civil",
  "cliente.profissao": "Profissão",
  "cliente.endereco": "Endereço",
  "cliente.cidade": "Cidade",
  "cliente.uf": "UF",
  "cliente.cep": "CEP",
  "cliente.email": "E-mail",
  "cliente.telefone": "Telefone",
  "processo.numero": "Número do processo",
  "processo.titulo": "Título do caso",
  "processo.vara": "Vara",
  "processo.comarca": "Comarca ou foro",
  "processo.tribunal": "Tribunal",
  "processo.parteContraria": "Parte contrária",
  "processo.valorCausa": "Valor da causa",
  "advogado.nome": "Advogado responsável",
  "advogado.oab": "OAB do advogado",
  "data.hoje": "Data de hoje por extenso",
};
