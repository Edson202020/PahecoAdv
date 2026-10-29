import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { formatarData, formatarMoeda, hojeSP } from "@/lib/formatos";
import { AbasFinanceiro } from "./Abas";
import { cancelarLancamento, marcarPago } from "./acoes";

const POR_PAGINA = 50;

export default async function PaginaFinanceiro({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string; de?: string; ate?: string; q?: string; conta?: string; pagina?: string }>;
}) {
  const usuario = await exigir("financeiro:ver");
  const podeEditar = pode(usuario.perfil, "financeiro:editar");
  const f = await searchParams;
  const pagina = Math.max(Number(f.pagina) || 1, 1);
  const status = f.status ?? "ABERTO";
  const hoje = new Date(`${hojeSP()}T00:00:00Z`);
  const em30 = new Date(hoje.getTime() + 30 * 864e5);
  const inicioMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));

  const filtro: Prisma.LancamentoWhereInput = {
    ...(f.tipo && { tipo: f.tipo as never }),
    ...(status && { status: status as never }),
    ...(f.conta && { contaId: f.conta }),
    ...((f.de || f.ate) && {
      vencimento: { ...(f.de && { gte: new Date(`${f.de}T00:00:00Z`) }), ...(f.ate && { lte: new Date(`${f.ate}T00:00:00Z`) }) },
    }),
    ...(f.q && {
      OR: [
        { descricao: { contains: f.q, mode: "insensitive" } },
        { cliente: { nome: { contains: f.q, mode: "insensitive" } } },
        { processo: { titulo: { contains: f.q, mode: "insensitive" } } },
      ],
    }),
  };

  const soma = (where: Prisma.LancamentoWhereInput) =>
    db.lancamento.aggregate({ where, _sum: { valor: true } }).then((r) => Number(r._sum.valor ?? 0));
  const [vencido, aReceber30, aPagar, recebidoMes, pagoMes, contas, saldos, lancamentos, total] = await Promise.all([
    soma({ tipo: "RECEITA", status: "ABERTO", vencimento: { lt: hoje } }),
    soma({ tipo: "RECEITA", status: "ABERTO", vencimento: { gte: hoje, lte: em30 } }),
    soma({ tipo: "DESPESA", status: "ABERTO" }),
    soma({ tipo: "RECEITA", status: "PAGO", pagamento: { gte: inicioMes } }),
    soma({ tipo: "DESPESA", status: "PAGO", pagamento: { gte: inicioMes } }),
    db.contaBancaria.findMany({ orderBy: [{ ativa: "desc" }, { nome: "asc" }] }),
    db.lancamento.groupBy({ by: ["contaId", "tipo"], where: { status: "PAGO" }, _sum: { valor: true } }),
    db.lancamento.findMany({
      where: filtro,
      orderBy: { vencimento: status === "PAGO" ? "desc" : "asc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        cliente: { select: { id: true, nome: true } },
        processo: { select: { id: true, titulo: true } },
        categoria: { select: { nome: true } },
        conta: { select: { nome: true } },
      },
    }),
    db.lancamento.count({ where: filtro }),
  ]);
  const saldoConta = (id: string, inicial: Prisma.Decimal) => {
    const v = (tipo: string) => Number(saldos.find((s) => s.contaId === id && s.tipo === tipo)?._sum.valor ?? 0);
    return Number(inicial) + v("RECEITA") - v("DESPESA");
  };
  const cartoes = [
    { rotulo: "A receber vencido", valor: vencido, cor: vencido ? "text-red-700" : "" },
    { rotulo: "A receber em 30 dias", valor: aReceber30, cor: "" },
    { rotulo: "A pagar em aberto", valor: aPagar, cor: "" },
    { rotulo: "Recebido no mês", valor: recebidoMes, cor: "text-green-700" },
    { rotulo: "Pago no mês", valor: pagoMes, cor: "" },
  ];
  const url = (mudar: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries({ ...f, status }).filter(([, v]) => v) as [string, string][]);
    for (const [k, v] of Object.entries(mudar)) q.set(k, String(v));
    return `/financeiro?${q}`;
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        {podeEditar && <Link href="/financeiro/novo" className="botao">Novo lançamento</Link>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="cartao">
            <p className="text-sm text-slate-500">{c.rotulo}</p>
            <p className={`text-xl font-semibold ${c.cor}`}>{formatarMoeda(c.valor)}</p>
          </div>
        ))}
      </div>
      <section className="cartao">
        <h2 className="mb-2 font-semibold">Saldo por conta</h2>
        <ul className="grid gap-2 text-sm md:grid-cols-3">
          {contas.filter((c) => c.ativa).map((c) => (
            <li key={c.id} className="flex justify-between gap-2">
              <span>{c.nome}{c.agencia && <span className="text-xs text-slate-500"> ag. {c.agencia} cc. {c.conta}</span>}</span>
              <span className="font-medium">{formatarMoeda(saldoConta(c.id, c.saldoInicial))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Saldo inicial da conta mais recebimentos menos pagamentos lançados. Confira com o extrato bancário.</p>
      </section>

      <AbasFinanceiro ativa="lancamentos" />
      <form className="flex flex-wrap items-end gap-2 text-sm">
        <select name="tipo" defaultValue={f.tipo ?? ""} className="campo w-auto">
          <option value="">Receitas e despesas</option>
          <option value="RECEITA">Receitas</option>
          <option value="DESPESA">Despesas</option>
        </select>
        <select name="status" defaultValue={status} className="campo w-auto">
          <option value="ABERTO">Em aberto</option>
          <option value="PAGO">Pagos/recebidos</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        <select name="conta" defaultValue={f.conta ?? ""} className="campo w-auto">
          <option value="">Todas as contas</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <label>De <input type="date" name="de" defaultValue={f.de} className="campo w-auto" /></label>
        <label>Até <input type="date" name="ate" defaultValue={f.ate} className="campo w-auto" /></label>
        <input name="q" defaultValue={f.q} placeholder="Descrição, cliente ou processo" className="campo w-60" />
        <button className="botao-secundario">Filtrar</button>
      </form>

      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead>
            <tr><th>Vencimento</th><th>Descrição</th><th className="hidden md:table-cell">Cliente / processo</th><th className="hidden md:table-cell">Categoria</th><th className="text-right">Valor</th><th /></tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => {
              const atrasado = l.status === "ABERTO" && l.vencimento < hoje;
              return (
                <tr key={l.id}>
                  <td className={`whitespace-nowrap ${atrasado ? "text-red-700" : ""}`}>
                    {formatarData(l.vencimento)}
                    {l.pagamento && <span className="block text-xs text-slate-500">pago {formatarData(l.pagamento)}</span>}
                  </td>
                  <td>
                    {l.descricao}
                    <span className="block text-xs text-slate-500">
                      {[l.subtipo, l.conta?.nome, l.reembolsavel && `reembolsável${l.statusReembolso ? ` (${l.statusReembolso.toLowerCase()})` : ""}`].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    {l.cliente && <Link href={`/clientes/${l.cliente.id}`} className="link block">{l.cliente.nome}</Link>}
                    {l.processo && <Link href={`/processos/${l.processo.id}`} className="block text-xs text-slate-500 hover:underline">{l.processo.titulo}</Link>}
                  </td>
                  <td className="hidden md:table-cell">{l.categoria?.nome}</td>
                  <td className={`whitespace-nowrap text-right font-medium ${l.tipo === "DESPESA" ? "text-red-700" : "text-green-700"}`}>
                    {l.tipo === "DESPESA" ? "- " : ""}{formatarMoeda(l.valor)}
                  </td>
                  <td className="whitespace-nowrap">
                    {podeEditar && l.status === "ABERTO" && (
                      <div className="flex gap-1">
                        <form action={marcarPago.bind(null, l.id)}><button className="botao-secundario px-2 py-1 text-xs">{l.tipo === "RECEITA" ? "Recebido" : "Pago"}</button></form>
                        <form action={cancelarLancamento.bind(null, l.id)}><button className="botao-secundario px-2 py-1 text-xs">Cancelar</button></form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {lancamentos.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">Nenhum lançamento encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {total > POR_PAGINA && (
        <div className="flex items-center justify-between text-sm">
          {pagina > 1 ? <Link href={url({ pagina: pagina - 1 })} className="link">Anteriores</Link> : <span />}
          <span className="text-slate-500">Página {pagina} de {Math.ceil(total / POR_PAGINA)}</span>
          {pagina * POR_PAGINA < total ? <Link href={url({ pagina: pagina + 1 })} className="link">Próximos</Link> : <span />}
        </div>
      )}
    </div>
  );
}
