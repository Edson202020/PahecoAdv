import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { listarUsuariosAtivos } from "@/lib/consultas";
import { FormCompromisso } from "../FormCompromisso";

export default async function NovoCompromisso({ searchParams }: { searchParams: Promise<{ processo?: string; publicacao?: string }> }) {
  const usuario = await exigir("prazos:criar");
  const { processo: processoParam = "", publicacao: publicacaoId = "" } = await searchParams;
  const publicacao = publicacaoId
    ? await db.publicacao.findUnique({ where: { id: publicacaoId }, select: { id: true, processoId: true, dataDisponibilizacao: true, texto: true } })
    : null;
  const processo = publicacao?.processoId ?? processoParam;
  const [processos, responsaveis] = await Promise.all([
    db.processo.findMany({
      where: { status: { in: ["ATIVO", "SUSPENSO"] } },
      select: { id: true, titulo: true, numeroCnj: true, responsavelId: true },
      orderBy: { titulo: "asc" },
    }),
    listarUsuariosAtivos(),
  ]);
  const doProcesso = processos.find((p) => p.id === processo);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Novo prazo ou compromisso</h1>
      {publicacao && (
        <details className="cartao text-sm">
          <summary className="cursor-pointer font-medium">Publicação de origem</summary>
          <p className="mt-2 whitespace-pre-line text-slate-700">{publicacao.texto}</p>
        </details>
      )}
      <FormCompromisso
        processos={processos}
        responsaveis={responsaveis}
        processoInicial={processo}
        responsavelInicial={doProcesso?.responsavelId ?? usuario.id}
        podeConfirmar={pode(usuario.perfil, "prazos:confirmar")}
        publicacaoId={publicacao?.id}
        disponibilizacaoInicial={publicacao?.dataDisponibilizacao.toISOString().slice(0, 10)}
      />
    </div>
  );
}
