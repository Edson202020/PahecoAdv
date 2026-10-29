import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { agendaPendente } from "@/lib/agenda";
import { ListaCompromissos } from "@/components/ListaCompromissos";

export default async function Painel() {
  const usuario = await usuarioAtual();
  const [{ atrasados, deHoje, proximos }, processosAtivos, aConfirmar] = await Promise.all([
    agendaPendente({ responsavelId: usuario.id, dias: 7 }),
    db.processo.count({ where: { status: "ATIVO", responsavelId: usuario.id } }),
    db.compromisso.count({ where: { status: "PENDENTE", tipo: "PRAZO", confirmado: false, responsavelId: usuario.id } }),
  ]);
  const podeConfirmar = pode(usuario.perfil, "prazos:confirmar");
  const numeros = [
    { rotulo: "Atrasados", valor: atrasados.length, cor: atrasados.length ? "text-red-700" : "" },
    { rotulo: "Para hoje", valor: deHoje.length, cor: "" },
    { rotulo: "Prazos a confirmar", valor: aConfirmar, cor: aConfirmar ? "text-amber-700" : "" },
    { rotulo: "Meus processos ativos", valor: processosAtivos, cor: "" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Olá, {usuario.nome.split(" ")[0]}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} className="cartao">
            <p className="text-sm text-slate-500">{n.rotulo}</p>
            <p className={`text-3xl font-semibold ${n.cor}`}>{n.valor}</p>
          </div>
        ))}
      </div>
      {atrasados.length > 0 && (
        <section className="cartao border-red-200">
          <h2 className="mb-2 font-semibold text-red-700">Atrasados</h2>
          <ListaCompromissos itens={atrasados} vazio="" podeConfirmar={podeConfirmar} destaque="atraso" />
        </section>
      )}
      <section className="cartao">
        <h2 className="mb-2 font-semibold">Hoje</h2>
        <ListaCompromissos itens={deHoje} vazio="Nada para hoje." podeConfirmar={podeConfirmar} />
      </section>
      <section className="cartao">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Próximos 7 dias</h2>
          <Link href="/agenda" className="link text-sm">Ver agenda completa</Link>
        </div>
        <ListaCompromissos itens={proximos} vazio="Nada nos próximos 7 dias." podeConfirmar={podeConfirmar} />
      </section>
    </div>
  );
}
