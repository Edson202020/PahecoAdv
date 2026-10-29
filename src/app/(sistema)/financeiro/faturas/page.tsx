import Link from "next/link";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { formatarData, formatarMoeda } from "@/lib/formatos";
import { AbasFinanceiro } from "../Abas";
import { marcarFaturaPaga } from "../acoes";

export default async function PaginaFaturas({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const usuario = await exigir("financeiro:ver");
  const { status = "ABERTA" } = await searchParams;
  const faturas = await db.fatura.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { vencimento: "desc" },
    take: 200,
    include: { cliente: { select: { id: true, nome: true } }, _count: { select: { lancamentos: true } } },
  });

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Financeiro</h1>
      <AbasFinanceiro ativa="faturas" />
      <form className="flex gap-2">
        <select name="status" defaultValue={status} className="campo w-auto">
          <option value="ABERTA">Em aberto</option>
          <option value="PAGA">Pagas</option>
          <option value="">Todas</option>
        </select>
        <button className="botao-secundario">Filtrar</button>
      </form>
      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead><tr><th>Número</th><th>Cliente</th><th>Vencimento</th><th className="text-right">Valor</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {faturas.map((f) => (
              <tr key={f.id}>
                <td>{f.numero}<span className="block text-xs text-slate-500">{f._count.lancamentos} itens</span></td>
                <td>{f.cliente ? <Link href={`/clientes/${f.cliente.id}`} className="link">{f.cliente.nome}</Link> : ""}</td>
                <td>{formatarData(f.vencimento)}</td>
                <td className="text-right">
                  {formatarMoeda(f.valor)}
                  {Number(f.valorDespesas) > 0 && <span className="block text-xs text-slate-500">despesas {formatarMoeda(f.valorDespesas)}</span>}
                </td>
                <td>{f.status === "PAGA" ? `Paga em ${formatarData(f.pagamento)}` : f.status === "ABERTA" ? "Em aberto" : "Cancelada"}</td>
                <td>
                  {f.status === "ABERTA" && pode(usuario.perfil, "financeiro:editar") && (
                    <form action={marcarFaturaPaga.bind(null, f.id)}><button className="botao-secundario px-2 py-1 text-xs">Recebida</button></form>
                  )}
                </td>
              </tr>
            ))}
            {faturas.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">Nenhuma fatura.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
