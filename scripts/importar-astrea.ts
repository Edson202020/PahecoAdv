// Importa o backup do Astrea (pasta com os CSVs exportados).
// Uso: npm run importar:astrea -- /caminho/da/pasta
//
// Pode ser executado de novo: registros já importados (pelo código do Astrea) são ignorados.
// Financeiro, documentos e timesheets ficam para a etapa 4.
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { parse } from "csv-parse";
import { parse as parseSync } from "csv-parse/sync";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient, type Perfil, type StatusCompromisso, type TipoCaso } from "@prisma/client";
import {
  areaProvavel,
  dataAstrea,
  dataHoraAstrea,
  extrairCnj,
  lista,
  numeroProcesso,
  tribunalDoCnj,
} from "../src/lib/astrea";
import { somenteDigitos } from "../src/lib/formatos";

type Linha = Record<string, string>;

const db = new PrismaClient();
const pasta = process.argv[2];
if (!pasta || !existsSync(join(pasta, "Processos.csv"))) {
  console.error("Informe a pasta com os CSVs do Astrea (deve conter Processos.csv).");
  process.exit(1);
}

// O PostgreSQL não aceita o caractere nulo, que aparece em alguns textos do Astrea.
const opcoesCsv = {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_quotes: true,
  cast: (valor: string) => valor.replace(/\u0000/g, ""),
} as const;
const ler = (arquivo: string): Linha[] =>
  existsSync(join(pasta, arquivo)) ? parseSync(readFileSync(join(pasta, arquivo)), opcoesCsv) : [];
const mapa = (arquivo: string) => new Map(ler(arquivo).map((l) => [l["Código"], l["Nome"]]));
const texto = (v: string | undefined) => v?.trim() || null;
const resumo: Record<string, number | string> = {};

async function emLotes<T>(itens: T[], tamanho: number, gravar: (lote: T[]) => Promise<unknown>) {
  for (let i = 0; i < itens.length; i += tamanho) await gravar(itens.slice(i, i + tamanho));
}

// ---------------------------------------------------------------- usuários
const PERFIS: Record<string, Perfil> = {
  Coordenador: "ADVOGADO",
  "Advogado com autonomia": "ADVOGADO",
  // Perfil restrito por segurança; o sócio ajusta na tela Usuários.
  Colaborador: "SECRETARIA",
};

async function importarUsuarios() {
  const usuarios = new Map<string, string>();
  for (const u of ler("Usuário.csv")) {
    const email = u["Login"].trim().toLowerCase();
    const perfil: Perfil = u["Administrador"] === "Sim" ? "SOCIO" : (PERFIS[u["Perfil"]] ?? "SECRETARIA");
    const existente = await db.usuario.findFirst({ where: { OR: [{ codigoAstrea: u["Código"] }, { email }] } });
    const registro = existente
      ? await db.usuario.update({ where: { id: existente.id }, data: { codigoAstrea: u["Código"] } })
      : await db.usuario.create({
          data: {
            nome: u["Apelido"].trim(),
            email,
            perfil,
            ativo: u["Status"] === "Ativo",
            codigoAstrea: u["Código"],
            // Senha aleatória: o sócio define a senha de cada um na tela Usuários.
            senhaHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
          },
        });
    usuarios.set(u["Código"], registro.id);
  }
  resumo["Usuários"] = usuarios.size;
  return usuarios;
}

// ---------------------------------------------------------------- contatos
async function importarContatos(clientesDeProcesso: Set<string>) {
  const cpfsUsados = new Set(
    (await db.cliente.findMany({ where: { cpfCnpj: { not: null } }, select: { cpfCnpj: true } })).map((c) => c.cpfCnpj!),
  );
  const jaImportados = new Set(
    (await db.cliente.findMany({ where: { codigoAstrea: { not: null } }, select: { codigoAstrea: true } })).map((c) => c.codigoAstrea!),
  );
  let duplicados = 0;
  const dados: Prisma.ClienteCreateManyInput[] = [];
  for (const c of ler("Contatos.csv")) {
    if (c["Classificação"] === "Usuário" || jaImportados.has(c["Código"])) continue;
    const doc = somenteDigitos(c["CPF"] ?? "");
    let cpfCnpj: string | null = doc || null;
    if (cpfCnpj && cpfsUsados.has(cpfCnpj)) {
      duplicados++;
      cpfCnpj = null;
    }
    if (cpfCnpj) cpfsUsados.add(cpfCnpj);
    const endereco = [lista(c["Ruas"])[0], lista(c["Números"])[0], lista(c["Complementos"])[0], lista(c["Bairros"])[0]]
      .filter(Boolean)
      .join(", ");
    const nascimento =
      c["Ano de nascimento"] && c["Mês de nascimento"] && c["Dia de nascimento"]
        ? dataAstrea(`${c["Dia de nascimento"].padStart(2, "0")}/${c["Mês de nascimento"].padStart(2, "0")}/${c["Ano de nascimento"]}`)
        : null;
    const extras = Object.fromEntries(
      (["CTPS", "CNH", "PIS", "Título de eleitor", "Certidão reservista", "Passaporte", "Inscrição municipal", "Naturalidade", "Sites", "Empresa ou Contato na Empresa"] as const)
        .filter((k) => c[k]?.trim())
        .map((k) => [k, c[k].trim()]),
    );
    if (doc && !cpfCnpj) extras["CPF/CNPJ (repetido em outro contato)"] = c["CPF"];
    const telefones = lista(c["Número dos telefones"]);
    const emails = lista(c["Endereços de email"]);
    if (telefones.length > 1) extras["Outros telefones"] = telefones.slice(1).join("; ");
    if (emails.length > 1) extras["Outros e-mails"] = emails.slice(1).join("; ");
    dados.push({
      codigoAstrea: c["Código"],
      tipo: c["Tipo do contato"] === "Pessoa Jurídica" ? "JURIDICA" : "FISICA",
      ehCliente: c["Classificação"] === "Cliente" || clientesDeProcesso.has(c["Código"]),
      nome: c["Nome"].trim() || "(sem nome)",
      apelido: texto(c["Apelido"]),
      cpfCnpj,
      rg: texto(c["RG"]),
      email: emails[0] ?? null,
      telefone: telefones[0] ?? null,
      endereco: endereco || null,
      cidade: lista(c["Cidades"])[0] ?? null,
      uf: lista(c["Estados"])[0] ?? null,
      cep: lista(c["CEP"])[0] ?? null,
      dataNascimento: nascimento,
      estadoCivil: texto(c["Estado civil"]),
      nacionalidade: texto(c["Nacionalidade"]),
      profissao: texto(c["Ocupação"]),
      nomeMae: texto(c["Nome da mãe"]),
      nomePai: texto(c["Nome do pai"]),
      dadosExtras: Object.keys(extras).length ? extras : undefined,
      observacoes: texto(c["Comentário"]),
    });
  }
  await emLotes(dados, 1000, (lote) => db.cliente.createMany({ data: lote, skipDuplicates: true }));
  const contatos = new Map(
    (await db.cliente.findMany({ where: { codigoAstrea: { not: null } }, select: { id: true, codigoAstrea: true } })).map(
      (c) => [c.codigoAstrea!, c.id],
    ),
  );
  resumo["Contatos"] = contatos.size;
  resumo["Contatos com CPF/CNPJ repetido (guardado nos dados extras)"] = duplicados;
  return contatos;
}

// ---------------------------------------------------------------- processos
const TIPOS: Record<string, TipoCaso> = {
  Processo: "PROCESSO",
  Caso: "CASO",
  Atendimento: "ATENDIMENTO",
  Incidente: "INCIDENTE",
  Recurso: "RECURSO",
};

async function importarProcessos(linhas: Linha[], usuarios: Map<string, string>, contatos: Map<string, string>, padrao: string) {
  const foros = mapa("Juizados.csv");
  const acoes = mapa("Ações.csv");
  const qualificacoes = mapa("Qualificações.csv");
  const cnjsUsados = new Set(
    (await db.processo.findMany({ where: { numeroCnj: { not: null } }, select: { numeroCnj: true } })).map((p) => p.numeroCnj!),
  );
  const dados: Prisma.ProcessoCreateManyInput[] = [];
  for (const p of linhas) {
    let { cnj, alternativo } = numeroProcesso(p["Número do processo"]);
    if (cnj && cnjsUsados.has(cnj)) [cnj, alternativo] = [null, cnj];
    if (cnj) cnjsUsados.add(cnj);
    const vara = texto(p["Nome da Vara"]);
    const tipoAcao = acoes.get(p["Tipo de ação"]) ?? null;
    const tipo = TIPOS[p["Tipo"]] ?? "PROCESSO";
    dados.push({
      codigoAstrea: p["Código"],
      titulo: p["Titulo"].trim() || alternativo || cnj || "(sem título)",
      tipo,
      numeroCnj: cnj,
      numeroAlternativo: alternativo,
      consultivo: !cnj && !alternativo,
      area: tipo === "ATENDIMENTO" && !cnj ? "OUTRA" : areaProvavel(cnj, vara ?? "", tipoAcao ?? ""),
      status: p["Status"] === "Ativo" ? "ATIVO" : p["Data de encerramento"] ? "ENCERRADO" : "ARQUIVADO",
      tribunal: tribunalDoCnj(cnj),
      vara,
      comarca: foros.get(p["Tribunal"]) ?? null,
      valorCausa: p["Valor"] && !Number.isNaN(Number(p["Valor"].replace(",", "."))) ? p["Valor"].replace(",", ".") : null,
      dataDistribuicao: dataAstrea(p["Data de distribuição"]),
      dataEncerramento: dataAstrea(p["Data de encerramento"]),
      instancia: Number(p["Instância"]) || null,
      tipoAcao: tipoAcao?.replace(/\|+$/, "").replace(/\|/g, " > ") ?? null,
      pasta: texto(p["Pasta"]),
      url: texto(p["Url do Processo"]),
      observacoes: [texto(p["Descrição"]), texto(p["Observação"])].filter(Boolean).join("\n\n") || null,
      responsavelId: usuarios.get(p["Responsável"]) ?? padrao,
      criadoEm: dataHoraAstrea(p["Data de criação"]) ?? undefined,
    });
  }
  await emLotes(dados, 500, (lote) => db.processo.createMany({ data: lote, skipDuplicates: true }));
  const processos = new Map(
    (await db.processo.findMany({ where: { codigoAstrea: { not: null } }, select: { id: true, codigoAstrea: true } })).map(
      (p) => [p.codigoAstrea!, p.id],
    ),
  );

  // Clientes e demais partes de cada processo.
  const vinculos = new Map<string, Prisma.ProcessoClienteCreateManyInput>();
  for (const p of linhas) {
    const processoId = processos.get(p["Código"]);
    if (!processoId) continue;
    const partes = [
      { codigos: lista(p["Clientes"]), quals: lista(p["Qualificações dos clientes"]), principais: lista(p["Cliente principal"]), ehCliente: true },
      { codigos: lista(p["Contatos das partes"]), quals: lista(p["Qualificações das partes"]), principais: lista(p["Parte principal"]), ehCliente: false },
    ];
    for (const grupo of partes) {
      grupo.codigos.forEach((codigo, i) => {
        const clienteId = contatos.get(codigo);
        const chave = `${processoId}:${clienteId}`;
        if (!clienteId || vinculos.has(chave)) return;
        vinculos.set(chave, {
          processoId,
          clienteId,
          ehCliente: grupo.ehCliente,
          principal: grupo.principais.at(i) === "Sim",
          polo: qualificacoes.get(grupo.quals.at(i) ?? "") ?? null,
        });
      });
    }
  }
  await emLotes([...vinculos.values()], 1000, (lote) => db.processoCliente.createMany({ data: lote, skipDuplicates: true }));
  resumo["Processos e casos"] = processos.size;
  resumo["Vínculos de clientes e partes"] = vinculos.size;
  return processos;
}

// ---------------------------------------------------------------- agenda
const STATUS: Record<string, StatusCompromisso> = { Feito: "CONCLUIDO", "Em progresso": "PENDENTE", Cancelado: "CANCELADO" };

async function importarAgenda(usuarios: Map<string, string>, processos: Map<string, string>, padrao: string) {
  const comentarios = new Map<string, string[]>();
  for (const c of ler("Comentários.csv")) {
    const atual = comentarios.get(c["Código da origem"]) ?? [];
    atual.push(`${c["Data de criação"]}: ${c["Texto"].trim()}`);
    comentarios.set(c["Código da origem"], atual);
  }
  const descricao = (codigo: string, ...partes: (string | undefined)[]) =>
    [...partes.map(texto), ...(comentarios.get(codigo) ?? [])].filter(Boolean).join("\n") || null;
  const responsavel = (codigo: string) => usuarios.get(lista(codigo)[0]) ?? padrao;
  const dados: Prisma.CompromissoCreateManyInput[] = [];
  const contagem = { prazos: 0, audiencias: 0, eventos: 0, tarefas: 0, semData: 0 };

  for (const p of ler("Prazos.csv")) {
    const inicio = dataAstrea(p["Data de vencimento"]);
    if (!inicio) { contagem.semData++; continue; }
    contagem.prazos++;
    dados.push({
      codigoAstrea: p["Código"],
      tipo: "PRAZO",
      titulo: p["Nome"].trim() || "Prazo",
      descricao: descricao(p["Código"], p["Comentários"]),
      inicio,
      confirmado: true,
      status: STATUS[p["Status"]] ?? "PENDENTE",
      processoId: processos.get(p["Processo"]) ?? null,
      responsavelId: responsavel(p["Responsável"]),
    });
  }
  for (const a of ler("Audiências.csv")) {
    const inicio = dataHoraAstrea(a["Data de início"], a["Hora de início"]);
    if (!inicio) { contagem.semData++; continue; }
    contagem.audiencias++;
    dados.push({
      codigoAstrea: a["Código"],
      tipo: "AUDIENCIA",
      titulo: a["Nome"].trim() || "Audiência",
      descricao: descricao(a["Código"], a["Comentários"]),
      inicio,
      fim: dataHoraAstrea(a["Data de início"], a["Hora de fim"]),
      local: [a["Fórum"], a["Endereço"], a["Sala do Fórum"]].map(texto).filter(Boolean).join(" · ") || null,
      confirmado: true,
      status: STATUS[a["Status"]] ?? "PENDENTE",
      processoId: processos.get(a["Processo"]) ?? null,
      responsavelId: responsavel(a["Responsável"]),
    });
  }
  for (const e of ler("Eventos.csv")) {
    const inicio = dataHoraAstrea(e["Data de início"], e["Dia inteiro"] === "Sim" ? "" : e["Hora de início"]);
    if (!inicio) { contagem.semData++; continue; }
    contagem.eventos++;
    dados.push({
      codigoAstrea: e["Código"],
      tipo: "REUNIAO",
      titulo: e["Descrição"].trim() || "Evento",
      descricao: descricao(e["Código"], e["Detalhes"]),
      inicio,
      fim: dataHoraAstrea(e["Data de término"], e["Hora de fim"]),
      confirmado: true,
      status: STATUS[e["Status"]] ?? "PENDENTE",
      processoId: processos.get(e["Processo"]) ?? null,
      responsavelId: responsavel(e["Responsável"]),
    });
  }
  for (const t of ler("Tarefas.csv")) {
    // Tarefa sem vencimento entra na data em que foi criada.
    const inicio = dataHoraAstrea(t["Data de vencimento"]) ?? dataHoraAstrea(t["Data de criação"]);
    if (!inicio) { contagem.semData++; continue; }
    contagem.tarefas++;
    dados.push({
      codigoAstrea: t["Código"],
      tipo: "TAREFA",
      titulo: t["Descrição"].trim().slice(0, 300) || "Tarefa",
      descricao: descricao(t["Código"], t["Descrição"].length > 300 ? t["Descrição"] : "", t["Comentários"]),
      inicio,
      prioridade: texto(t["Prioridade"]),
      concluidoEm: dataHoraAstrea(t["Data fim"]),
      confirmado: true,
      status: t["Realizada"] === "Sim" ? "CONCLUIDO" : "PENDENTE",
      processoId: processos.get(t["Processo"]) ?? null,
      responsavelId: responsavel(t["Responsável"]),
    });
  }
  await emLotes(dados, 1000, (lote) => db.compromisso.createMany({ data: lote, skipDuplicates: true }));
  resumo["Prazos"] = contagem.prazos;
  resumo["Audiências"] = contagem.audiencias;
  resumo["Eventos (importados como reunião)"] = contagem.eventos;
  resumo["Tarefas"] = contagem.tarefas;
  resumo["Itens de agenda sem data (não importados)"] = contagem.semData;
}

// ---------------------------------------------------------------- históricos (arquivo grande, lido em fluxo)
async function importarHistoricos(processos: Map<string, string>) {
  let lote: Prisma.AndamentoCreateManyInput[] = [];
  let total = 0, semProcesso = 0, semData = 0;
  const leitor = createReadStream(join(pasta, "Históricos.csv")).pipe(parse(opcoesCsv));
  for await (const h of leitor as AsyncIterable<Linha>) {
    const processoId = processos.get(h["Processo"]);
    const data = dataAstrea(h["Data"]);
    if (!processoId) { semProcesso++; continue; }
    if (!data) { semData++; continue; }
    lote.push({ processoId, data, descricao: h["Descrição"], tipo: texto(h["Tipo"]), origem: "IMPORTACAO", codigoExterno: h["Código"] });
    if (lote.length === 5000) {
      total += (await db.andamento.createMany({ data: lote, skipDuplicates: true })).count;
      lote = [];
      process.stdout.write(`\r  históricos gravados: ${total}`);
    }
  }
  if (lote.length) total += (await db.andamento.createMany({ data: lote, skipDuplicates: true })).count;
  process.stdout.write("\n");
  resumo["Históricos (andamentos) gravados nesta execução"] = total;
  resumo["Históricos de processos que não vieram no backup (ignorados)"] = semProcesso;
  resumo["Históricos sem data válida (ignorados)"] = semData;
}

// ---------------------------------------------------------------- publicações
async function importarPublicacoes(processos: Map<string, string>) {
  const dados: Prisma.PublicacaoCreateManyInput[] = [];
  let semData = 0;
  for (const p of ler("Publicações.csv")) {
    const disponibilizacao = dataAstrea(p["Data divulgacao"]) ?? dataAstrea(p["Data de lançamento"]);
    if (!disponibilizacao) { semData++; continue; }
    dados.push({
      origem: "IMPORTACAO",
      idExterno: p["Código"],
      dataDisponibilizacao: disponibilizacao,
      dataPublicacao: dataAstrea(p["Data publicacao"]),
      orgao: texto(p["Orgão"]),
      vara: texto(p["Vara"]),
      numeroProcesso: extrairCnj(p["Matéria"]),
      texto: p["Matéria"],
      tratada: p["Status"] !== "Recebido",
      descartada: p["Status"] === "Rejeitada",
      processoId: processos.get(p["Processo"]) ?? null,
    });
  }
  await emLotes(dados, 1000, (lote) => db.publicacao.createMany({ data: lote, skipDuplicates: true }));
  resumo["Publicações"] = dados.length;
  resumo["Publicações sem data (não importadas)"] = semData;
}

async function main() {
  console.log(`Importando backup do Astrea de ${pasta}`);
  const usuarios = await importarUsuarios();
  const padrao = (await db.usuario.findFirstOrThrow({ where: { perfil: "SOCIO", ativo: true }, orderBy: { criadoEm: "asc" } })).id;
  const linhasProcessos = ler("Processos.csv");
  const clientesDeProcesso = new Set(linhasProcessos.flatMap((p) => lista(p["Clientes"])));
  const contatos = await importarContatos(clientesDeProcesso);
  const processos = await importarProcessos(linhasProcessos, usuarios, contatos, padrao);
  await importarAgenda(usuarios, processos, padrao);
  await importarPublicacoes(processos);
  await importarHistoricos(processos);
  console.log("\nResumo da importação:");
  for (const [k, v] of Object.entries(resumo)) console.log(`  ${k}: ${v}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
