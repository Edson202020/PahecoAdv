import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { listarUsuariosAtivos } from "@/lib/consultas";
import { FormCompromisso } from "../FormCompromisso";

export default async function NovoCompromisso({ searchParams }: { searchParams: Promise<{ processo?: string }> }) {
  const usuario = await exigir("prazos:criar");
  const { processo = "" } = await searchParams;
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
      <FormCompromisso
        processos={processos}
        responsaveis={responsaveis}
        processoInicial={processo}
        responsavelInicial={doProcesso?.responsavelId ?? usuario.id}
        podeConfirmar={pode(usuario.perfil, "prazos:confirmar")}
      />
    </div>
  );
}
