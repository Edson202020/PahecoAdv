import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { exigir } from "@/lib/auth";
import { CamposCliente } from "../CamposCliente";
import { criarCliente } from "../acoes";

export default async function NovoCliente() {
  await exigir("clientes:editar");
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <Formulario acao={criarCliente} className="cartao space-y-4">
        <CamposCliente />
        <BotaoEnviar>Cadastrar cliente</BotaoEnviar>
      </Formulario>
    </div>
  );
}
