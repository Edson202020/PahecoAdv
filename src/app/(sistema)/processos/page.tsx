import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { AREAS, STATUS_PROCESSO } from "@/lib/rotulos";

export default async function PaginaProcessos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string; meus?: string; status?: string }>;
}) {
  const usuario = await usuarioAtual();
  const { q = "", area = "", meus = "", status = "ATIVO" } = await searchParams;
  const busca = q.trim();
  const filtro: Prisma.ProcessoWhereInput = {
    ...(status && { status: status as never }),
    ...(area && { area: area as never }),
    ...(meus && { responsavelId: usuario.id }),
    ...(busca && {
      OR: [
        { titulo: { contains: busca, mode: "insensitive" } },
        { numeroCnj: { contains: busca } },
        { numeroAlternativo: { contains: busca } },
        { pasta: { contains: busca, mode: "insensitive" } },
        { parteContraria: { contains: busca, mode: "insensitive" } },
        { clientes: { some: { cliente: { nome: { contains: busca, mode: "insensitive" } } } } },
      ],
    }),
  };
  const processos = await db.processo.findMany({
    where: filtro,
    orderBy: { atualizadoEm: "desc" },
    take: 200,
    include: {
      responsavel: { select: { nome: true } },
      clientes: { where: { ehCliente: true }, include: { cliente: { select: { nome: true } } } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Processos e casos</h1>
        {pode(usuario.perfil, "processos:editar_proprios") && <Link href="/processos/novo" className="botao">Novo processo</Link>}
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={busca} placeholder="Número, título, cliente ou parte contrária" className="campo max-w-sm" />
        <select name="area" defaultValue={area} className="campo w-auto">
          <option value="">Todas as áreas</option>
          {Object.entries(AREAS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
        <select name="status" defaultValue={status} className="campo w-auto">
          <option value="">Todas as situações</option>
          {Object.entries(STATUS_PROCESSO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="meus" value="1" defaultChecked={!!meus} /> Só os meus
        </label>
        <button className="botao-secundario">Filtrar</button>
      </form>
      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead>
            <tr><th>Caso</th><th>Número</th><th className="hidden md:table-cell">Cliente</th><th className="hidden md:table-cell">Área</th><th>Responsável</th></tr>
          </thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/processos/${p.id}`} className="link">{p.titulo}</Link></td>
                <td className="whitespace-nowrap">{p.numeroCnj ?? p.numeroAlternativo ?? <span className="text-slate-500">{p.tipo === "ATENDIMENTO" ? "atendimento" : "consultivo"}</span>}</td>
                <td className="hidden md:table-cell">{p.clientes.map((c) => c.cliente.nome).join(", ")}</td>
                <td className="hidden md:table-cell">{AREAS[p.area]}</td>
                <td>{p.responsavel.nome}</td>
              </tr>
            ))}
            {processos.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">Nenhum processo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
