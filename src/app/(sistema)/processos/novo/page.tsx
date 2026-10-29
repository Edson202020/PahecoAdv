import { redirect } from "next/navigation";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { listarAdvogados, listarClientesResumo } from "@/lib/consultas";
import { CamposProcesso } from "../CamposProcesso";
import { criarProcesso } from "../acoes";

export default async function NovoProcesso({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const usuario = await usuarioAtual();
  if (!pode(usuario.perfil, "processos:editar_proprios")) redirect("/processos");
  const { cliente = "" } = await searchParams;
  const [advogados, clientes] = await Promise.all([listarAdvogados(), listarClientesResumo()]);
  const permitidos = pode(usuario.perfil, "processos:editar_todos") ? advogados : advogados.filter((a) => a.id === usuario.id);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Novo processo ou caso</h1>
      <Formulario acao={criarProcesso} className="cartao space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="clienteId">Cliente</label>
            <select id="clienteId" name="clienteId" defaultValue={cliente} className="campo">
              <option value="">Vincular depois</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="polo">Polo do cliente</label>
            <input id="polo" name="polo" placeholder="Reclamante, réu, autor..." className="campo" />
          </div>
        </div>
        <CamposProcesso advogados={permitidos} responsavelPadrao={usuario.id} />
        <BotaoEnviar>Cadastrar processo</BotaoEnviar>
      </Formulario>
    </div>
  );
}
