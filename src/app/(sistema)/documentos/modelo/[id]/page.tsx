import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { CAMPOS_DISPONIVEIS } from "@/lib/documentos";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { excluirModelo, salvarModelo } from "../../acoes";

export default async function EditarModelo({ params }: { params: Promise<{ id: string }> }) {
  await exigir("processos:editar_proprios");
  const { id } = await params;
  const modelo = id === "novo" ? null : await db.modeloDocumento.findUnique({ where: { id } });
  if (id !== "novo" && !modelo) notFound();

  return (
    <div className="max-w-5xl space-y-4">
      <Link href="/documentos" className="link text-sm">Documentos</Link>
      <h1 className="text-2xl font-semibold">{modelo ? `Editar: ${modelo.nome}` : "Novo modelo"}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Formulario acao={salvarModelo.bind(null, modelo?.id ?? null)} className="cartao space-y-4 md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="rotulo" htmlFor="nome">Nome</label><input id="nome" name="nome" required defaultValue={modelo?.nome} className="campo" /></div>
            <div><label className="rotulo" htmlFor="categoria">Categoria</label><input id="categoria" name="categoria" defaultValue={modelo?.categoria ?? ""} className="campo" /></div>
          </div>
          <div>
            <label className="rotulo" htmlFor="conteudo">Texto</label>
            <textarea id="conteudo" name="conteudo" rows={22} required defaultValue={modelo?.conteudo} className="campo font-mono text-xs" />
          </div>
          <BotaoEnviar>Salvar modelo</BotaoEnviar>
        </Formulario>
        <aside className="cartao space-y-3 text-xs">
          <div>
            <h2 className="mb-1 text-sm font-semibold">Formatação</h2>
            <p><code># Título</code> título com o padrão do timbrado</p>
            <p><code>## Cláusula</code> subtítulo em negrito</p>
            <p><code>**texto**</code> negrito · <code>__texto__</code> sublinhado</p>
            <p><code>&gt;&gt; texto</code> linha centralizada (data, assinatura)</p>
            <p>Use campos próprios, como <code>{"{{honorarios.valor}}"}</code>, para o que deve ser completado no Word.</p>
          </div>
          <div>
            <h2 className="mb-1 text-sm font-semibold">Campos do sistema</h2>
            <ul className="space-y-1">
              {Object.entries(CAMPOS_DISPONIVEIS).map(([campo, descricao]) => (
                <li key={campo}><code>{`{{${campo}}}`}</code><span className="block text-slate-500">{descricao}</span></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      {modelo && (
        <form action={excluirModelo.bind(null, modelo.id)}>
          <button className="text-sm text-red-700 hover:underline">Excluir modelo</button>
        </form>
      )}
    </div>
  );
}
