import Link from "next/link";
import type { Compromisso, Processo, Usuario } from "@prisma/client";
import { formatarQuando } from "@/lib/formatos";
import { TIPOS_COMPROMISSO } from "@/lib/rotulos";
import { cancelar, concluir, confirmar } from "@/app/(sistema)/agenda/acoes";

export type ItemAgenda = Compromisso & {
  processo: Pick<Processo, "id" | "titulo"> | null;
  responsavel: Pick<Usuario, "nome">;
};

export function ListaCompromissos({
  itens,
  vazio,
  podeConfirmar,
  destaque,
}: {
  itens: ItemAgenda[];
  vazio: string;
  podeConfirmar: boolean;
  destaque?: "atraso";
}) {
  if (itens.length === 0) return <p className="text-sm text-slate-500">{vazio}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {itens.map((c) => (
        <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
          <div className="min-w-0">
            <p>
              <span className={`font-medium ${destaque === "atraso" ? "text-red-700" : ""}`}>{formatarQuando(c)}</span>
              {" · "}
              <span className="text-slate-500">{TIPOS_COMPROMISSO[c.tipo]}</span>
              {" · "}
              {c.titulo}
            </p>
            <p className="text-xs text-slate-500">
              {c.processo && <Link href={`/processos/${c.processo.id}`} className="link">{c.processo.titulo}</Link>}
              {c.processo && " · "}
              {c.responsavel.nome}
              {c.local && ` · ${c.local}`}
            </p>
            {c.tipo === "PRAZO" && !c.confirmado && (
              <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Vencimento aguardando confirmação do advogado</span>
            )}
          </div>
          <div className="flex gap-1">
            {c.tipo === "PRAZO" && !c.confirmado && podeConfirmar && (
              <form action={confirmar.bind(null, c.id)}><button className="botao-secundario px-2 py-1 text-xs">Confirmar</button></form>
            )}
            <form action={concluir.bind(null, c.id)}><button className="botao-secundario px-2 py-1 text-xs">Concluir</button></form>
            <form action={cancelar.bind(null, c.id)}><button className="botao-secundario px-2 py-1 text-xs">Cancelar</button></form>
          </div>
        </li>
      ))}
    </ul>
  );
}
