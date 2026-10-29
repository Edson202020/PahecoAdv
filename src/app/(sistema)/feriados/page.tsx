import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { formatarData } from "@/lib/formatos";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarFeriado, excluirFeriado } from "./acoes";

export default async function PaginaFeriados() {
  await exigir("usuarios:gerenciar");
  const inicioAno = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const feriados = await db.feriado.findMany({ where: { data: { gte: inicioAno } }, orderBy: { data: "asc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feriados e suspensões</h1>
        <p className="text-sm text-slate-500">
          Usados no cálculo de prazos. Cadastre também Carnaval, Corpus Christi, feriados municipais e suspensões
          de expediente divulgadas por cada tribunal. O recesso de 20/12 a 20/01 já é aplicado automaticamente.
        </p>
      </div>
      <Formulario limparAoSalvar acao={criarFeriado} className="cartao flex flex-wrap items-end gap-2">
        <div><label className="rotulo" htmlFor="data">Data</label><input id="data" name="data" type="date" required className="campo" /></div>
        <div className="flex-1"><label className="rotulo" htmlFor="descricao">Descrição</label><input id="descricao" name="descricao" required className="campo" /></div>
        <div><label className="rotulo" htmlFor="tribunal">Tribunal (vazio = todos)</label><input id="tribunal" name="tribunal" placeholder="TJSP, TRT2..." className="campo w-32" /></div>
        <BotaoEnviar>Adicionar</BotaoEnviar>
      </Formulario>
      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead><tr><th>Data</th><th>Descrição</th><th>Tribunal</th><th /></tr></thead>
          <tbody>
            {feriados.map((f) => (
              <tr key={f.id}>
                <td>{formatarData(f.data)}</td>
                <td>{f.descricao}</td>
                <td>{f.tribunal ?? "Todos"}</td>
                <td><form action={excluirFeriado.bind(null, f.id)}><button className="text-xs text-red-700 hover:underline">Excluir</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
