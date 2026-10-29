import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { somenteDigitos } from "@/lib/formatos";

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioAtual();
  const { q = "" } = await searchParams;
  const busca = q.trim();
  const digitos = somenteDigitos(busca);
  const clientes = await db.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            ...(digitos ? [{ cpfCnpj: { contains: digitos } }] : []),
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
    take: 200,
    include: { _count: { select: { processos: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        {pode(usuario.perfil, "clientes:editar") && <Link href="/clientes/novo" className="botao">Novo cliente</Link>}
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={busca} placeholder="Buscar por nome, CPF ou CNPJ" className="campo max-w-md" />
        <button className="botao-secundario">Buscar</button>
      </form>
      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead>
            <tr><th>Nome</th><th>CPF/CNPJ</th><th className="hidden md:table-cell">Telefone</th><th>Processos</th></tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/clientes/${c.id}`} className="link">{c.nome}</Link></td>
                <td>{c.cpfCnpj}</td>
                <td className="hidden md:table-cell">{c.telefone}</td>
                <td>{c._count.processos}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-500">Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
