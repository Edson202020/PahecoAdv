import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { listarUsuariosAtivos } from "@/lib/consultas";
import { formatarData } from "@/lib/formatos";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { descartar, distribuir, marcarTratada, reabrir, vincular, vincularAutomaticamente } from "./acoes";

const POR_PAGINA = 30;
const ABAS = { pendentes: "Pendentes", tratadas: "Tratadas", descartadas: "Descartadas" } as const;
type Aba = keyof typeof ABAS;

export default async function PaginaPublicacoes({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; q?: string; minhas?: string; pagina?: string }>;
}) {
  const usuario = await usuarioAtual();
  const params = await searchParams;
  const aba: Aba = params.aba && params.aba in ABAS ? (params.aba as Aba) : "pendentes";
  const busca = params.q?.trim() ?? "";
  const pagina = Math.max(Number(params.pagina) || 1, 1);
  const filtro: Prisma.PublicacaoWhereInput = {
    ...(aba === "pendentes" && { tratada: false }),
    ...(aba === "tratadas" && { tratada: true, descartada: false }),
    ...(aba === "descartadas" && { descartada: true }),
    ...(params.minhas && { responsavelId: usuario.id }),
    ...(busca && {
      OR: [
        { texto: { contains: busca, mode: "insensitive" } },
        { numeroProcesso: { contains: busca } },
        { processo: { titulo: { contains: busca, mode: "insensitive" } } },
      ],
    }),
  };
  const [publicacoes, total, contagens, usuarios] = await Promise.all([
    db.publicacao.findMany({
      where: filtro,
      orderBy: { dataDisponibilizacao: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        processo: { select: { id: true, titulo: true } },
        responsavel: { select: { nome: true } },
        compromisso: { select: { id: true } },
      },
    }),
    db.publicacao.count({ where: filtro }),
    db.publicacao.groupBy({ by: ["tratada", "descartada"], _count: true }),
    listarUsuariosAtivos(),
  ]);
  const conta = (t: boolean, d: boolean) => contagens.find((c) => c.tratada === t && c.descartada === d)?._count ?? 0;
  const numeros: Record<Aba, number> = { pendentes: conta(false, false), tratadas: conta(true, false), descartadas: conta(true, true) };
  const url = (mudar: Record<string, string | number>) => {
    const q = new URLSearchParams({ aba, ...(busca && { q: busca }), ...(params.minhas && { minhas: "1" }), pagina: String(pagina) });
    for (const [k, v] of Object.entries(mudar)) q.set(k, String(v));
    return `/publicacoes?${q}`;
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Publicações e intimações</h1>
        <form action={vincularAutomaticamente}>
          <button className="botao-secundario">Vincular aos processos pelo número</button>
        </form>
      </div>
      <nav className="flex gap-1 border-b border-slate-200">
        {(Object.keys(ABAS) as Aba[]).map((a) => (
          <Link
            key={a}
            href={url({ aba: a, pagina: 1 })}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${a === aba ? "border-marca-600 font-medium text-marca-700" : "border-transparent text-slate-500"}`}
          >
            {ABAS[a]} ({numeros[a].toLocaleString("pt-BR")})
          </Link>
        ))}
      </nav>
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="aba" value={aba} />
        <input name="q" defaultValue={busca} placeholder="Texto, número ou título do processo" className="campo max-w-md" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="minhas" value="1" defaultChecked={!!params.minhas} /> Só as minhas
        </label>
        <button className="botao-secundario">Buscar</button>
      </form>

      <ul className="space-y-3">
        {publicacoes.map((p) => (
          <li key={p.id} className="cartao space-y-2 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  Disponibilizada em {formatarData(p.dataDisponibilizacao)}
                  {p.dataPublicacao && <span className="font-normal text-slate-500"> · publicada em {formatarData(p.dataPublicacao)}</span>}
                </p>
                <p className="text-xs text-slate-500">{[p.orgao, p.vara].filter(Boolean).join(" · ")}</p>
                <p className="text-xs">
                  {p.processo ? (
                    <Link href={`/processos/${p.processo.id}`} className="link">{p.processo.titulo}</Link>
                  ) : (
                    <span className="text-amber-700">Sem processo vinculado{p.numeroProcesso ? ` (${p.numeroProcesso})` : ""}</span>
                  )}
                  {p.responsavel && <span className="text-slate-500"> · {p.responsavel.nome}</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {!p.compromisso && (
                  <Link href={`/agenda/novo?publicacao=${p.id}`} className="botao px-2 py-1 text-xs">Criar prazo</Link>
                )}
                {p.compromisso && <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Prazo criado</span>}
                {!p.tratada && (
                  <>
                    <form action={marcarTratada.bind(null, p.id)}><button className="botao-secundario px-2 py-1 text-xs">Tratada</button></form>
                    <form action={descartar.bind(null, p.id)}><button className="botao-secundario px-2 py-1 text-xs">Descartar</button></form>
                  </>
                )}
                {p.tratada && (
                  <form action={reabrir.bind(null, p.id)}><button className="botao-secundario px-2 py-1 text-xs">Reabrir</button></form>
                )}
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-slate-700">{p.texto.slice(0, 280)}{p.texto.length > 280 ? "..." : ""}</summary>
              <p className="mt-2 whitespace-pre-line text-slate-700">{p.texto}</p>
            </details>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
              {!p.processo && (
                <Formulario acao={vincular.bind(null, p.id)} className="flex flex-wrap gap-1">
                  <input name="numero" defaultValue={p.numeroProcesso ?? ""} placeholder="Número CNJ" className="campo w-60 py-1" />
                  <BotaoEnviar>Vincular</BotaoEnviar>
                </Formulario>
              )}
              <form action={distribuir.bind(null, p.id)} className="flex gap-1">
                <select name="responsavelId" defaultValue={p.responsavelId ?? ""} className="campo w-auto py-1">
                  <option value="">Sem responsável</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
                <button className="botao-secundario px-2 py-1 text-xs">Distribuir</button>
              </form>
            </div>
          </li>
        ))}
        {publicacoes.length === 0 && <li className="cartao text-sm text-slate-500">Nenhuma publicação nesta lista.</li>}
      </ul>

      {total > POR_PAGINA && (
        <div className="flex items-center justify-between text-sm">
          {pagina > 1 ? <Link href={url({ pagina: pagina - 1 })} className="link">Anteriores</Link> : <span />}
          <span className="text-slate-500">Página {pagina} de {Math.ceil(total / POR_PAGINA)}</span>
          {pagina * POR_PAGINA < total ? <Link href={url({ pagina: pagina + 1 })} className="link">Próximas</Link> : <span />}
        </div>
      )}
    </div>
  );
}
