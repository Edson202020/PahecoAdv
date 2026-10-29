import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { instalarModelosPadrao } from "./acoes";
import { GerarDocumento } from "./GerarDocumento";

export default async function PaginaDocumentos({ searchParams }: { searchParams: Promise<{ cliente?: string; processo?: string }> }) {
  const usuario = await usuarioAtual();
  const { cliente = "", processo = "" } = await searchParams;
  const [modelos, clientes, processos] = await Promise.all([
    db.modeloDocumento.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
    db.cliente.findMany({ where: { ehCliente: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    db.processo.findMany({
      where: { status: { in: ["ATIVO", "SUSPENSO"] } },
      select: { id: true, titulo: true, clientes: { where: { ehCliente: true }, select: { clienteId: true } } },
      orderBy: { titulo: "asc" },
    }),
  ]);
  const podeEditar = pode(usuario.perfil, "processos:editar_proprios");

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Documentos</h1>
      <GerarDocumento
        modelos={modelos.map((m) => ({ id: m.id, nome: m.nome }))}
        clientes={clientes}
        processos={processos.map((p) => ({ id: p.id, titulo: p.titulo, clientes: p.clientes.map((c) => c.clienteId) }))}
        clienteInicial={cliente}
        processoInicial={processo}
      />
      <section className="cartao space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Modelos</h2>
          {podeEditar && <Link href="/documentos/modelo/novo" className="link text-sm">Novo modelo</Link>}
        </div>
        {modelos.length === 0 && podeEditar && (
          <form action={instalarModelosPadrao}>
            <p className="mb-2 text-sm text-slate-500">Nenhum modelo cadastrado.</p>
            <button className="botao">Instalar modelos iniciais (procuração, declaração, contrato e recibo)</button>
          </form>
        )}
        <ul className="divide-y divide-slate-100 text-sm">
          {modelos.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <span>{m.nome}{m.categoria && <span className="text-slate-500"> · {m.categoria}</span>}</span>
              {podeEditar && <Link href={`/documentos/modelo/${m.id}`} className="link">Editar</Link>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
