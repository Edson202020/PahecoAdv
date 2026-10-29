import type { Processo, Usuario } from "@prisma/client";
import { AREAS, STATUS_PROCESSO } from "@/lib/rotulos";
import { paraCampoData } from "@/lib/formatos";

export function CamposProcesso({
  processo,
  advogados,
  responsavelPadrao,
}: {
  processo?: Processo;
  advogados: Pick<Usuario, "id" | "nome">[];
  responsavelPadrao: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="rotulo" htmlFor="titulo">Título do caso</label>
        <input id="titulo" name="titulo" required defaultValue={processo?.titulo} placeholder="Ex.: Fulano x Empresa X (reclamação trabalhista)" className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="numeroCnj">Número CNJ (deixe em branco se for consultivo)</label>
        <input id="numeroCnj" name="numeroCnj" defaultValue={processo?.numeroCnj ?? ""} placeholder="0000000-00.0000.0.00.0000" className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="area">Área</label>
        <select id="area" name="area" defaultValue={processo?.area ?? "CIVEL"} className="campo">
          {Object.entries(AREAS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="rotulo" htmlFor="tribunal">Tribunal</label>
        <input id="tribunal" name="tribunal" defaultValue={processo?.tribunal ?? ""} placeholder="TJSP, TRT2, TST, STJ..." className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="vara">Vara ou órgão</label>
        <input id="vara" name="vara" defaultValue={processo?.vara ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="comarca">Comarca</label>
        <input id="comarca" name="comarca" defaultValue={processo?.comarca ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="parteContraria">Parte contrária</label>
        <input id="parteContraria" name="parteContraria" defaultValue={processo?.parteContraria ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="valorCausa">Valor da causa (R$)</label>
        <input id="valorCausa" name="valorCausa" inputMode="decimal" defaultValue={processo?.valorCausa?.toString().replace(".", ",") ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="dataDistribuicao">Data de distribuição</label>
        <input id="dataDistribuicao" name="dataDistribuicao" type="date" defaultValue={paraCampoData(processo?.dataDistribuicao)} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="responsavelId">Advogado responsável</label>
        <select id="responsavelId" name="responsavelId" defaultValue={processo?.responsavelId ?? responsavelPadrao} className="campo">
          {advogados.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="rotulo" htmlFor="status">Situação</label>
        <select id="status" name="status" defaultValue={processo?.status ?? "ATIVO"} className="campo">
          {Object.entries(STATUS_PROCESSO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="rotulo" htmlFor="observacoes">Observações</label>
        <textarea id="observacoes" name="observacoes" rows={3} defaultValue={processo?.observacoes ?? ""} className="campo" />
      </div>
    </div>
  );
}
