import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode, podeEditarProcesso } from "@/lib/permissoes";
import { listarAdvogados, listarClientesResumo } from "@/lib/consultas";
import { AREAS, STATUS_HONORARIO, STATUS_PROCESSO, TIPOS_CASO, TIPOS_COMPROMISSO } from "@/lib/rotulos";
import { formatarData, formatarMoeda, formatarQuando, paraCampoData } from "@/lib/formatos";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { CamposProcesso } from "../CamposProcesso";
import { adicionarAndamento, editarProcesso, vincularCliente } from "../acoes";

export default async function DetalheProcesso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const processo = await db.processo.findUnique({
    where: { id },
    include: {
      responsavel: { select: { nome: true } },
      clientes: { include: { cliente: { select: { id: true, nome: true } } }, orderBy: { principal: "desc" } },
      andamentos: { orderBy: [{ data: "desc" }, { criadoEm: "desc" }], take: 100 },
      _count: { select: { andamentos: true } },
      compromissos: { where: { status: "PENDENTE" }, orderBy: { inicio: "asc" }, include: { responsavel: { select: { nome: true } } } },
    },
  });
  if (!processo) notFound();
  const podeEditar = podeEditarProcesso(usuario.perfil, usuario.id, processo.responsavelId);
  const verFinanceiro = pode(usuario.perfil, "financeiro:ver");
  const [honorarios, lancamentos] = verFinanceiro
    ? await Promise.all([
        // Honorários já lançados aparecem na tabela de lançamentos; aqui só os demais (ex.: percentuais de êxito).
        db.honorario.findMany({ where: { processoId: id, lancamentoId: null }, orderBy: { vencimento: "desc" } }),
        db.lancamento.findMany({ where: { processoId: id, status: { not: "CANCELADO" } }, orderBy: { vencimento: "desc" }, take: 50 }),
      ])
    : [[], []];
  const [advogados, clientes] = podeEditar ? await Promise.all([listarAdvogados(), listarClientesResumo()]) : [[], []];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/processos" className="link text-sm">Processos</Link>
        <h1 className="text-2xl font-semibold">{processo.titulo}</h1>
        <p className="text-sm text-slate-500">
          {processo.numeroCnj ?? processo.numeroAlternativo ?? "Sem número"} · {TIPOS_CASO[processo.tipo]} · {AREAS[processo.area]} · {STATUS_PROCESSO[processo.status]} · Responsável: {processo.responsavel.nome}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="cartao space-y-1 text-sm">
          <h2 className="mb-2 font-semibold">Dados</h2>
          <p>Tribunal: {processo.tribunal ?? "não informado"}</p>
          <p>Vara: {processo.vara ?? "não informada"}</p>
          <p>Comarca: {processo.comarca ?? "não informada"}</p>
          <p>Parte contrária: {processo.parteContraria ?? "não informada"}</p>
          <p>Valor da causa: {formatarMoeda(processo.valorCausa) || "não informado"}</p>
          <p>Distribuição: {formatarData(processo.dataDistribuicao) || "não informada"}</p>
          {processo.instancia && <p>Instância: {processo.instancia}ª</p>}
          {processo.tipoAcao && <p>Tipo de ação: {processo.tipoAcao}</p>}
          {processo.pasta && <p>Pasta: {processo.pasta}</p>}
          {processo.dataEncerramento && <p>Encerramento: {formatarData(processo.dataEncerramento)}</p>}
          {processo.url && <p><a href={processo.url} target="_blank" rel="noreferrer" className="link">Abrir no site do tribunal</a></p>}
          {processo.observacoes && <p className="whitespace-pre-line pt-2 text-slate-600">{processo.observacoes}</p>}
        </section>
        <section className="cartao space-y-2 text-sm">
          <h2 className="font-semibold">Clientes</h2>
          <ul>
            {processo.clientes.filter((c) => c.ehCliente).map((c) => (
              <li key={c.clienteId}>
                <Link href={`/clientes/${c.cliente.id}`} className="link">{c.cliente.nome}</Link>
                {c.polo && <span className="text-slate-500"> · {c.polo}</span>}
              </li>
            ))}
          </ul>
          {processo.clientes.some((c) => !c.ehCliente) && (
            <>
              <h3 className="pt-2 font-semibold">Outras partes</h3>
              <ul>
                {processo.clientes.filter((c) => !c.ehCliente).map((c) => (
                  <li key={c.clienteId}>
                    <Link href={`/clientes/${c.cliente.id}`} className="link">{c.cliente.nome}</Link>
                    {c.polo && <span className="text-slate-500"> · {c.polo}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {podeEditar && (
            <Formulario limparAoSalvar acao={vincularCliente.bind(null, processo.id)} className="flex flex-wrap gap-2">
              <select name="clienteId" className="campo min-w-0 flex-1 basis-48" defaultValue="">
                <option value="">Vincular cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input name="polo" placeholder="Polo" className="campo w-28" />
              <BotaoEnviar>Vincular</BotaoEnviar>
            </Formulario>
          )}
        </section>
      </div>

      <section className="cartao space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Prazos e compromissos pendentes</h2>
          {pode(usuario.perfil, "prazos:criar") && (
            <Link href={`/agenda/novo?processo=${processo.id}`} className="link text-sm">Novo prazo ou compromisso</Link>
          )}
        </div>
        <ul className="space-y-1 text-sm">
          {processo.compromissos.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{formatarQuando(c)}</span> · {TIPOS_COMPROMISSO[c.tipo]}: {c.titulo}
              <span className="text-slate-500"> · {c.responsavel.nome}{c.tipo === "PRAZO" && !c.confirmado ? " · aguardando confirmação" : ""}</span>
            </li>
          ))}
          {processo.compromissos.length === 0 && <li className="text-slate-500">Nada pendente.</li>}
        </ul>
      </section>

      {verFinanceiro && (honorarios.length > 0 || lancamentos.length > 0) && (
        <section className="cartao space-y-3 text-sm">
          <h2 className="font-semibold">Honorários e financeiro</h2>
          {honorarios.length > 0 && (
            <ul className="space-y-1">
              {honorarios.map((h) => (
                <li key={h.id}>
                  {h.vencimento && <span className="font-medium">{formatarData(h.vencimento)} · </span>}
                  {h.descricao} · {h.tipo === "PERCENTUAL" ? `${h.percentual}%` : formatarMoeda(h.valor)}
                  <span className="text-slate-500"> · {STATUS_HONORARIO[h.status]}</span>
                </li>
              ))}
            </ul>
          )}
          {lancamentos.length > 0 && (
            <table className="tabela">
              <thead><tr><th>Vencimento</th><th>Lançamento</th><th className="text-right">Valor</th><th>Situação</th></tr></thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td>{formatarData(l.vencimento)}</td>
                    <td>{l.descricao}<span className="block text-xs text-slate-500">{l.subtipo}{l.reembolsavel ? " · reembolsável" : ""}</span></td>
                    <td className={`text-right ${l.tipo === "DESPESA" ? "text-red-700" : "text-green-700"}`}>{l.tipo === "DESPESA" ? "- " : ""}{formatarMoeda(l.valor)}</td>
                    <td>{l.status === "PAGO" ? `pago ${formatarData(l.pagamento)}` : "em aberto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section className="cartao space-y-3">
        <h2 className="font-semibold">
          Andamentos
          {processo._count.andamentos > 100 && <span className="text-sm font-normal text-slate-500"> (100 mais recentes de {processo._count.andamentos})</span>}
        </h2>
        {pode(usuario.perfil, "prazos:criar") && (
          <Formulario limparAoSalvar acao={adicionarAndamento.bind(null, processo.id)} className="flex flex-wrap gap-2">
            <input type="date" name="data" defaultValue={paraCampoData(new Date())} className="campo w-auto" />
            <input name="descricao" placeholder="Descrição do andamento" className="campo min-w-48 flex-1" />
            <BotaoEnviar>Registrar</BotaoEnviar>
          </Formulario>
        )}
        <ul className="divide-y divide-slate-100 text-sm">
          {processo.andamentos.map((a) => (
            <li key={a.id} className="py-2">
              <span className="font-medium">{formatarData(a.data)}</span>
              <span className="text-xs text-slate-400"> {a.tipo ?? (a.origem !== "MANUAL" ? a.origem : "")}</span>
              <p className="whitespace-pre-line">{a.descricao}</p>
            </li>
          ))}
          {processo.andamentos.length === 0 && <li className="py-2 text-slate-500">Nenhum andamento registrado.</li>}
        </ul>
      </section>

      {podeEditar && (
        <Formulario acao={editarProcesso.bind(null, processo.id)} className="cartao space-y-4">
          <h2 className="font-semibold">Editar dados do processo</h2>
          <CamposProcesso
            processo={processo}
            advogados={pode(usuario.perfil, "processos:editar_todos") ? advogados : advogados.filter((a) => a.id === usuario.id)}
            responsavelPadrao={processo.responsavelId}
          />
          <BotaoEnviar>Salvar alterações</BotaoEnviar>
        </Formulario>
      )}
    </div>
  );
}
