import Link from "next/link";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { agendaPendente } from "@/lib/agenda";
import { ListaCompromissos } from "@/components/ListaCompromissos";

export default async function PaginaAgenda({ searchParams }: { searchParams: Promise<{ todos?: string; dias?: string }> }) {
  const usuario = await usuarioAtual();
  const { todos = "", dias = "30" } = await searchParams;
  const periodo = Math.min(Math.max(Number(dias) || 30, 1), 365);
  const { atrasados, deHoje, proximos } = await agendaPendente({
    responsavelId: todos ? undefined : usuario.id,
    dias: periodo,
  });
  const podeConfirmar = pode(usuario.perfil, "prazos:confirmar");

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Agenda e prazos</h1>
        {pode(usuario.perfil, "prazos:criar") && <Link href="/agenda/novo" className="botao">Novo prazo ou compromisso</Link>}
      </div>
      <form className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          <input type="checkbox" name="todos" value="1" defaultChecked={!!todos} /> Todo o escritório
        </label>
        <select name="dias" defaultValue={String(periodo)} className="campo w-auto">
          <option value="7">Próximos 7 dias</option>
          <option value="30">Próximos 30 dias</option>
          <option value="90">Próximos 90 dias</option>
        </select>
        <button className="botao-secundario">Atualizar</button>
      </form>
      <section className="cartao">
        <h2 className="mb-2 font-semibold text-red-700">Atrasados ({atrasados.length})</h2>
        <ListaCompromissos itens={atrasados} vazio="Nenhum compromisso atrasado." podeConfirmar={podeConfirmar} destaque="atraso" />
      </section>
      <section className="cartao">
        <h2 className="mb-2 font-semibold">Hoje ({deHoje.length})</h2>
        <ListaCompromissos itens={deHoje} vazio="Nada para hoje." podeConfirmar={podeConfirmar} />
      </section>
      <section className="cartao">
        <h2 className="mb-2 font-semibold">Próximos ({proximos.length})</h2>
        <ListaCompromissos itens={proximos} vazio="Nada no período." podeConfirmar={podeConfirmar} />
      </section>
    </div>
  );
}
